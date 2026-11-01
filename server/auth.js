import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createPasswordHash(password, salt = randomBytes(16).toString("hex")) {
  if (typeof password !== "string" || typeof salt !== "string") {
    throw new TypeError("Password and salt must be strings.");
  }
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

export function verifyPassword(password, salt, expectedHash) {
  if (typeof password !== "string" || typeof salt !== "string" || typeof expectedHash !== "string") {
    return false;
  }
  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return safeEqual(actualHash, expectedHash);
}

export function verifyCredentials(email, password, account) {
  if (!account || typeof account !== "object") return false;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const accountEmail = typeof account.email === "string" ? account.email : "";
  const emailMatches = safeEqual(normalizedEmail, accountEmail);
  const passwordMatches = verifyPassword(password, account.salt, account.hash);
  return emailMatches && passwordMatches;
}

export function createSessionToken(user, secret, now = Date.now()) {
  if (!user || typeof user.email !== "string" || typeof secret !== "string") {
    throw new TypeError("User email and secret must be strings.");
  }
  const sessionId = randomBytes(24).toString("base64url");
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({
    sub: user.email,
    jti: sessionId,
    exp: expiresAt,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readSessionToken(token, secret, now = Date.now()) {
  if (typeof token !== "string" || typeof secret !== "string") return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof session.sub !== "string" || typeof session.jti !== "string"
      || !Number.isInteger(session.exp) || session.exp <= Math.floor(now / 1000)) return null;
    return { email: session.sub, id: session.jti, expiresAt: session.exp };
  } catch {
    return null;
  }
}

export const sessionTtlSeconds = SESSION_TTL_SECONDS;
