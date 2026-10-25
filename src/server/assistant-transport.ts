import { z } from "zod";
import { authorizeAssistant } from "./assistant-access.ts";
import { requireFreeAssistant } from "./assistant-configuration.ts";
import { body, privateJson } from "./application.ts";
import { rateLimit } from "./limits.ts";
import type { RoomStore, SqlPool } from "./store.ts";

type Caller = Awaited<ReturnType<typeof authorizeAssistant>>;
const message = z.object({ message: z.string().trim().min(1).max(2000) }).strict();
export async function sendAssistant(request: Request, roomId: string, store: RoomStore, pool: SqlPool,
  send: (address: string, text: string, auth: Caller["auth"]) => Promise<{ id: string }>): Promise<Response> {
  const input = message.parse(await body(request));
  const caller = await authorizeAssistant(request, roomId, store);
  requireFreeAssistant();
  await rateLimit(pool, `assistant-turn:${caller.address}`, 20);
  const session = await send(caller.address, input.message, caller.auth);
  return privateJson({ accepted: true, sessionId: session.id });
}
export async function streamAssistant(request: Request, roomId: string, store: RoomStore,
  streamForAddress: (address: string) => Promise<ReadableStream<Uint8Array> | null>): Promise<Response> {
  const caller = await authorizeAssistant(request, roomId, store);
  const stream = await streamForAddress(caller.address);
  if (!stream) return privateJson({ error: "No assistant conversation yet." }, 404);
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
