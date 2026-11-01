import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import dotenv from "dotenv";
import {
  createPasswordHash,
  createSessionToken,
  readSessionToken,
  sessionTtlSeconds,
  verifyCredentials,
} from "./auth.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

const demoEmail = process.env.SPLITMATE_DEMO_EMAIL?.trim().toLowerCase();
const demoPassword = process.env.SPLITMATE_DEMO_PASSWORD;
if (!demoEmail || !demoPassword) {
  throw new Error("Set SPLITMATE_DEMO_EMAIL and SPLITMATE_DEMO_PASSWORD in .env.local before starting SplitMate.");
}

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("Set SESSION_SECRET in the production environment.");
}
const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production"
  ? ""
  : randomBytes(32).toString("hex"));
if (sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters in production.");
}

const passwordHash = createPasswordHash(demoPassword);
const account = { email: demoEmail, ...passwordHash };
const attempts = new Map();
const activeSessions = new Map();
const app = express();
const isProduction = process.env.NODE_ENV === "production";
const serveFrontend = isProduction || process.argv.includes("--serve-static");
const port = Number(process.env.PORT_API || 4174);
const cookieName = "splitmate_session";
const cookieOptions = `Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionTtlSeconds}${isProduction ? "; Secure" : ""}`;

app.disable("x-powered-by");
app.use(express.json({ limit: "8kb" }));
app.use("/api/auth", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function getSession(req) {
  const now = Math.floor(Date.now() / 1000);
  for (const [id, expiresAt] of activeSessions) {
    if (expiresAt <= now) activeSessions.delete(id);
  }
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  const session = readSessionToken(cookie?.slice(cookieName.length + 1), sessionSecret);
  if (!session || activeSessions.get(session.id) !== session.expiresAt) return null;
  return session;
}

function rateLimitExceeded(ip, now = Date.now()) {
  for (const [address, entry] of attempts) {
    if (entry.expiresAt <= now) attempts.delete(address);
  }
  const existing = attempts.get(ip);
  if (!existing || existing.expiresAt <= now) {
    attempts.set(ip, { count: 1, expiresAt: now + 15 * 60 * 1000 });
    return false;
  }
  existing.count += 1;
  return existing.count > 8;
}

app.get("/api/auth/session", (req, res) => {
  const session = getSession(req);
  if (!session || session.email !== account.email) return res.json({ user: null });
  return res.json({ user: { email: account.email } });
});

app.post("/api/auth/login", (req, res) => {
  const ip = req.ip || "unknown";
  if (rateLimitExceeded(ip)) return res.status(429).json({ error: "Too many sign-in attempts. Try again in 15 minutes." });

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (email.length > 254 || password.length > 1024 || !verifyCredentials(email, password, account)) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  attempts.delete(ip);
  const token = createSessionToken({ email: account.email }, sessionSecret);
  const session = readSessionToken(token, sessionSecret);
  activeSessions.set(session.id, session.expiresAt);
  res.setHeader("Set-Cookie", `${cookieName}=${token}; ${cookieOptions}`);
  return res.json({ user: { email: account.email } });
});

app.post("/api/auth/logout", (req, res) => {
  const session = getSession(req);
  if (session) activeSessions.delete(session.id);
  res.setHeader("Set-Cookie", `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isProduction ? "; Secure" : ""}`);
  return res.status(204).end();
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

if (serveFrontend) {
  const browserBuild = path.join(projectRoot, "dist", "browser");
  app.use(express.static(browserBuild));
  app.get("*", (_req, res) => res.sendFile(path.join(browserBuild, "index.html")));
}

app.listen(port, isProduction ? "0.0.0.0" : "127.0.0.1", () => {
  console.log(`SplitMate API listening on port ${port}`);
});
