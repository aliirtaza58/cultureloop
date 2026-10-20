import assert from "node:assert/strict";
import { test } from "node:test";
import { signIdentity, verifyIdentity } from "../src/server/confirmations.ts";

const secret = "synthetic-test-signing-secret-with-at-least-32-characters";
const identity = { id: "11111111-1111-4111-8111-111111111111", name: "Fictional test identity", types: ["urn:entity:book"] };
test("identity confirmation is bound to the resolved identity, session, and expiry", () => {
  const proof = signIdentity(identity, "test-session-one", secret, 1000);
  assert.deepEqual(verifyIdentity(proof, "test-session-one", secret, 1001), identity);
  assert.throws(() => verifyIdentity(proof, "other-session", secret, 1001), /Invalid/);
  assert.throws(() => verifyIdentity(proof, "test-session-one", secret, 601000), /expired/);
  assert.throws(() => verifyIdentity(proof + ".extra", "test-session-one", secret, 1001), /Invalid/);
  const [body, mac] = proof.split(".");
  const forged = Buffer.from(JSON.stringify({ ...identity, name: "Forged book", expiresAt: 999999 })).toString("base64url");
  assert.throws(() => verifyIdentity(`${forged}.${mac}`, "test-session-one", secret, 1001), /Invalid/);
  assert.ok(body);
});
