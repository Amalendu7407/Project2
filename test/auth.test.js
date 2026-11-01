import test from "node:test";
import assert from "node:assert/strict";
import { createPasswordHash, createSessionToken, readSessionToken, verifyCredentials, verifyPassword } from "../server/auth.js";

test("password verification accepts the configured password and rejects another", () => {
  const credentials = { email: "demo@example.com", ...createPasswordHash("test-password") };
  assert.equal(verifyPassword("test-password", credentials.salt, credentials.hash), true);
  assert.equal(verifyCredentials("DEMO@example.com", "test-password", credentials), true);
  assert.equal(verifyCredentials("demo@example.com", "wrong-password", credentials), false);
  assert.equal(verifyCredentials("other@example.com", "test-password", credentials), false);
});

test("session token is signed and expires after its lifetime", () => {
  const now = 1_800_000_000_000;
  const token = createSessionToken({ email: "demo@example.com" }, "test-secret-that-is-long-enough", now);
  const session = readSessionToken(token, "test-secret-that-is-long-enough", now);
  assert.equal(session.email, "demo@example.com");
  assert.equal(typeof session.id, "string");
  assert.equal(typeof session.expiresAt, "number");
  assert.equal(readSessionToken(token, "wrong-secret", now), null);
  assert.equal(readSessionToken(token, "test-secret-that-is-long-enough", now + 8 * 24 * 60 * 60 * 1000), null);
  assert.equal(readSessionToken(`${token}tampered`, "test-secret-that-is-long-enough", now), null);
  assert.equal(readSessionToken("not-a-session", "test-secret-that-is-long-enough", now), null);
});
