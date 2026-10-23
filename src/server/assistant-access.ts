import { z } from "zod";
import { hashCapability } from "./store.ts";
import type { RoomStore } from "./store.ts";
import { requireSession } from "./application.ts";

/** The conversation address is derived on the server; never accept an address/session ID from JSON. */
export async function authorizeAssistant(request: Request, roomId: string, store: RoomStore) {
  z.uuid().parse(roomId);
  const token = requireSession(request);
  await store.read(roomId, token);
  const principalId = hashCapability(token);
  return { address: `${roomId}:${principalId}`,
    auth: { authenticator: "cultureloop-guest", principalId, principalType: "user" as const, attributes: { roomId } } };
}
const principal = z.object({ authenticator: z.literal("cultureloop-guest"), principalType: z.literal("user"),
  principalId: z.string().regex(/^[a-f0-9]{64}$/), attributes: z.object({ roomId: z.uuid() }) });
/** Accept only the framework's current verified caller. Never fall back to an earlier initiator. */
export function assistantPrincipal(current: unknown) {
  const parsed = principal.safeParse(current);
  if (!parsed.success) throw new Error("Room membership required.");
  return parsed.data;
}
export function requireFreeAssistant(): void {
  if (process.env.CULTURELOOP_FREE_AI_VERIFIED !== "true") {
    throw new Error("Prototype assistant is waiting for verified free model access.");
  }
  if (!process.env.AI_GATEWAY_MODEL?.trim() || !(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim())) {
    throw new Error("Prototype assistant model access is not configured.");
  }
}
