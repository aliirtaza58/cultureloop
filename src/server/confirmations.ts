import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { QlooIdentity } from "../integrations/qloo-results.ts";

const identitySchema = z.object({ id: z.uuid(), name: z.string().min(1).max(300),
  types: z.array(z.enum(["urn:entity:book", "urn:entity:artist", "urn:entity:movie", "urn:entity:video_game"])).min(1),
  expiresAt: z.number().int().nonnegative() }).strict();
function signature(payload: string, sessionToken: string, secret: string): string {
  if (secret.length < 32) throw new Error("Identity confirmation is unavailable until server secrets are configured.");
  return createHmac("sha256", secret).update(JSON.stringify([sessionToken, payload])).digest("base64url");
}
export function signIdentity(identity: QlooIdentity, sessionToken: string, secret: string, now: number): string {
  const body = identitySchema.parse({ ...identity, expiresAt: now + 10 * 60 * 1000 });
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${signature(payload, sessionToken, secret)}`;
}
/** A user must choose a server-resolved identity. A proof is scoped to their private session. */
export function verifyIdentity(proof: string, sessionToken: string, secret: string, now: number): QlooIdentity {
  if (proof.length > 2000) throw new Error("Invalid identity confirmation.");
  const [payload, mac, extra] = proof.split(".");
  if (!payload || !mac || extra !== undefined) throw new Error("Invalid identity confirmation.");
  const expected = Buffer.from(signature(payload, sessionToken, secret), "base64url");
  const supplied = Buffer.from(mac, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error("Invalid identity confirmation.");
  let raw: unknown;
  try { raw = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); }
  catch { throw new Error("Invalid identity confirmation."); }
  const result = identitySchema.safeParse(raw);
  if (!result.success || result.data.expiresAt <= now) throw new Error("Identity selection expired; search again.");
  const { expiresAt: _expiresAt, ...identity } = result.data;
  return identity;
}
