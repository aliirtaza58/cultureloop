import { randomUUID } from "node:crypto";
import { database } from "./database.ts";
import { newCapability, RoomStore } from "./store.ts";
import type { RoomView, SqlPool } from "./store.ts";
import { QlooClient, QlooError } from "../integrations/qloo.ts";
import { QlooService, rankingInputs } from "./qloo-service.ts";
import { rateLimit } from "./limits.ts";
import { signIdentity, verifyIdentity } from "./confirmations.ts";
import { offerBook, setInterests } from "../domain/inventory.ts";
import { acceptCycle, declineCycle, expireHolds, repairExchanges, reportCompletion, shortlistBook, withdrawListing } from "../domain/exchanges.ts";
import type { MemberActor } from "../domain/exchanges.ts";
import type { SearchType } from "../integrations/qloo.ts";
import { z } from "zod";
import { agreementText } from "../domain/agreement.ts";

const cookieName = "cultureloop_guest";
let qloo: QlooService | undefined;
export function sessionToken(request: Request): string | undefined {
  const cookie = request.headers.get("cookie")?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  return cookie && /^[A-Za-z0-9_-]{43}$/.test(cookie) ? cookie : undefined;
}
export function privateJson(value: unknown, status = 200, session?: string): Response {
  const headers = new Headers({ "Cache-Control": "private, no-store", "Content-Type": "application/json" });
  if (session) headers.set("Set-Cookie", `${cookieName}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === "production" && process.env.CULTURELOOP_LOCAL_PROTOTYPE !== "true" ? "; Secure" : ""}`);
  return new Response(JSON.stringify(value), { status, headers });
}
export function requireSession(request: Request): string {
  const token = sessionToken(request);
  if (!token) throw new Error("Room membership required.");
  return token;
}
export async function body(request: Request): Promise<unknown> {
  const expectedOrigin = new URL(process.env.CULTURELOOP_APP_ORIGIN ?? request.url).origin;
  if (request.headers.get("origin") !== expectedOrigin) throw new Error("Use the app's own page to make changes.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Expected a JSON request.");
  if (Number(request.headers.get("content-length") ?? 0) > 16000) throw new Error("Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Expected a JSON request.");
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) {
    const next = await reader.read(); if (next.done) break;
    bytes += next.value.byteLength;
    if (bytes > 16000) { await reader.cancel(); throw new Error("Request is too large."); }
    chunks.push(next.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new Error("Expected a JSON request."); }
}
export function failure(error: unknown): Response {
  if (error instanceof z.ZodError) return privateJson({ error: "Please check the supplied fields." }, 400);
  if (error instanceof QlooError) return privateJson({ error: `${error.message} Existing exchanges are unchanged.` }, 503);
  const message = error instanceof Error ? error.message : "";
  // Only authored domain messages may reach the browser; never echo driver/provider error bodies.
  const known = /^(Room membership|required|Only |Choose |A member |This room |Invalid room |Invalid identity |Identity selection |Stale cycle |This cycle |Cycle |An offered copy |Completed exchanges |A current |Confirm |Offer books |Room changed|Request limit |Use the app|Expected a JSON|Request is too large|Hosted database|Hosted PostgreSQL|Identity confirmation|Wait for|Example simulation|Prototype|At least)/;
  if (known.test(message)) return privateJson({ error: message }, /membership|Only |Use the app/.test(message) ? 403 : /limit/.test(message) ? 429 : 409);
  console.error("CultureLoop request failed", { type: error instanceof Error ? error.name : "unknown" });
  return privateJson({ error: "This request could not finish. Your saved exchanges are unchanged." }, 503);
}
async function services() {
  const pool = await database();
  return { pool, store: new RoomStore(pool) };
}
function qlooService(pool: SqlPool) {
  qloo ??= new QlooService(pool, new QlooClient({ apiKey: process.env.QLOO_API_KEY ?? "", baseUrl: process.env.QLOO_BASE_URL }));
  return qloo;
}
function actingMember(view: RoomView, simulateMember?: string): MemberActor {
  if (!simulateMember || simulateMember === view.actor.memberId) return view.actor;
  if (view.room.mode !== "example" || view.room.exampleControllerMemberId !== view.actor.memberId
    || !view.room.memberIds.includes(simulateMember)) throw new Error("Example simulation is unavailable in a real room.");
  return { roomId: view.room.id, memberId: simulateMember };
}
const entry = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create"), alias: z.string().trim().min(1).max(50) }).strict(),
  z.object({ type: z.literal("join"), alias: z.string().trim().min(1).max(50), invite: z.string().max(100) }).strict(),
  z.object({ type: z.literal("example") }).strict(),
]);
export async function enter(request: Request): Promise<Response> {
  const input = entry.parse(await body(request));
  const session = sessionToken(request) ?? newCapability();
  const { pool, store } = await services();
  await rateLimit(pool, `enter:${session}`, 12);
  const result = input.type === "create" ? await store.create(session, input.alias)
    : input.type === "join" ? { view: await store.join(input.invite, session, input.alias) }
      : { view: await store.createExample(session) };
  return privateJson(result, 200, session);
}
export async function readRoom(request: Request, id: string): Promise<Response> {
  const session = requireSession(request);
  const { store } = await services();
  let view = await store.read(id, session);
  if (view.room.holds.some(hold => hold.expiresAt <= Date.now())) {
    view = await store.mutate(id, session, current => expireHolds(current.room, Date.now()));
  }
  return privateJson({ view });
}
export async function downloadAgreement(request: Request, id: string): Promise<Response> {
  const session = requireSession(request), { store } = await services();
  const view = await store.read(id, session);
  return new Response(agreementText(view.room, view.members, Date.now()), { headers: {
    "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": 'attachment; filename="cultureloop-agreement.txt"',
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
export async function searchRoom(request: Request, id: string): Promise<Response> {
  const session = requireSession(request), { store, pool } = await services();
  const view = await store.read(id, session);
  const params = z.object({ query: z.string().trim().min(1).max(200),
    category: z.enum(["book", "artist", "movie", "video_game"]) }).parse(Object.fromEntries(new URL(request.url).searchParams));
  if (view.room.mode === "example") throw new Error("Example simulation uses fictional identities; create a real room to search Qloo.");
  await rateLimit(pool, `search:${id}:${view.actor.memberId}`, 60);
  const found = await qlooService(pool).search(params.query, params.category as SearchType);
  return privateJson({ origin: found.origin, identities: found.identities.map(identity => ({ ...identity,
    proof: signIdentity(identity, session, process.env.SESSION_SECRET ?? "", Date.now()) })) });
}
const command = z.discriminatedUnion("type", [
  z.object({ type: z.literal("offer"), proof: z.string().max(2000) }),
  z.object({ type: z.literal("interests"), proofs: z.array(z.string().max(2000)).max(3) }),
  z.object({ type: z.literal("add-interest"), proof: z.string().max(2000) }),
  z.object({ type: z.literal("remove-interest"), entityId: z.uuid() }),
  z.object({ type: z.literal("shortlist"), bookId: z.string().min(1).max(200), acceptable: z.boolean() }),
  z.object({ type: z.literal("withdraw"), listingId: z.string().min(1).max(200) }),
  z.object({ type: z.literal("generate") }), z.object({ type: z.literal("rank") }),
  z.object({ type: z.literal("sample-shortlists") }),
  z.object({ type: z.literal("accept"), cycleId: z.string().max(4000), revision: z.number().int().positive() }),
  z.object({ type: z.literal("decline"), cycleId: z.string().max(4000), revision: z.number().int().positive() }),
  z.object({ type: z.literal("complete"), cycleId: z.string().max(4000), revision: z.number().int().positive(), confirmed: z.literal(true) }),
]);
const envelope = z.object({ command, simulateMember: z.uuid().optional() }).strict();
export async function act(request: Request, id: string): Promise<Response> {
  const input = envelope.parse(await body(request)), session = requireSession(request);
  const { store, pool } = await services();
  await rateLimit(pool, `action:${id}:${session}`, 180);
  const now = Date.now(), action = input.command;
  if (action.type === "rank") {
    const view = await store.read(id, session);
    if (view.room.mode === "example") throw new Error("Example simulation uses labeled synthetic rankings.");
    await rateLimit(pool, `rank:${id}`, 10);
    const ranked = await qlooService(pool).rank(view.room);
    const next = await store.mutate(id, session, current => {
      if (rankingInputs(current.room) !== ranked.inputs) throw new Error("Room changed; refresh the rankings again.");
      return { ...current.room, revision: current.room.revision + 1, preferences: ranked.evidence,
        evidenceSnapshots: [...(current.room.evidenceSnapshots ?? []), ...ranked.snapshots] };
    });
    return privateJson({ view: next });
  }
  const view = await store.mutate(id, session, current => {
    const actor = actingMember(current, input.simulateMember), room = current.room;
    switch (action.type) {
      case "offer": return offerBook(room, actor, verifyIdentity(action.proof, session, process.env.SESSION_SECRET ?? "", now), randomUUID());
      case "interests": return setInterests(room, actor, action.proofs.map(proof => verifyIdentity(proof, session, process.env.SESSION_SECRET ?? "", now)));
      case "add-interest": return setInterests(room, actor, [
        ...(room.interests ?? []).filter(i => i.memberId === actor.memberId).map(i => ({ id: i.entityId, name: i.name, types: [i.type] })),
        verifyIdentity(action.proof, session, process.env.SESSION_SECRET ?? "", now),
      ]);
      case "remove-interest": return setInterests(room, actor, (room.interests ?? [])
        .filter(i => i.memberId === actor.memberId && i.entityId !== action.entityId)
        .map(i => ({ id: i.entityId, name: i.name, types: [i.type] })));
      case "shortlist": return shortlistBook(room, actor, action.bookId, action.acceptable);
      case "withdraw": return withdrawListing(room, actor, action.listingId);
      case "generate":
        if (room.memberIds.length < 2) throw new Error("At least two members must join before matching.");
        return repairExchanges(room, actor, now);
      case "accept": return acceptCycle(room, actor, action.cycleId, action.revision, now);
      case "decline": return declineCycle(room, actor, action.cycleId, action.revision);
      case "complete": return reportCompletion(room, actor, action.cycleId, action.revision, now);
      case "sample-shortlists": {
        if (room.mode !== "example" || room.exampleControllerMemberId !== current.actor.memberId) throw new Error("Only the example controller may simulate shortlists.");
        return room.preferences.reduce((state, p) => shortlistBook(state,
          { roomId: room.id, memberId: p.memberId }, p.bookId, true), room);
      }
    }
  });
  return privateJson({ view });
}
