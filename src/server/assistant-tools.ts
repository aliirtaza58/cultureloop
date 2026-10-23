import { z } from "zod";
import type { RoomView } from "./store.ts";
import { findRoomExchanges, rankRoom } from "./room-operations.ts";
import type { RoomAccess, RoomQloo } from "./room-operations.ts";
import { expireHolds } from "../domain/exchanges.ts";

const empty = z.object({}).strict();
export const assistantSchemas = {
  read_room: empty,
  resolve_entities: z.object({ query: z.string().trim().min(1).max(200),
    category: z.enum(["book", "artist", "movie", "video_game"]) }).strict(),
  rank_available_books: empty,
  find_exchange_cycles: empty,
  explain_proposal: z.object({ cycleId: z.string().min(1).max(4000), revision: z.number().int().positive() }).strict(),
};
export type AssistantToolName = keyof typeof assistantSchemas;

/** No aliases, credentials, invite links, identity proofs or raw provider responses go to the model. */
export function assistantRoom(view: RoomView, now: number) {
  const room = expireHolds(view.room, now);
  const label = (id: string) => id === view.actor.memberId ? "You" : `Reader ${room.memberIds.indexOf(id) + 1}`;
  return {
    revision: room.revision, example: room.mode === "example", actor: view.actor.memberId,
    members: room.memberIds.map(id => ({ id, label: label(id) })),
    books: room.listings.map(book => ({ ...book, title: book.title ?? "Untitled offered book" })),
    interests: (room.interests ?? []).map(interest => ({ ...interest })),
    rankings: room.preferences, shortlists: room.shortlists,
    evidence: room.evidenceSnapshots ?? [], cycles: room.cycles, holds: room.holds,
    limits: "Ranks are catalog ordering, not enjoyment probabilities. Missing evidence is unknown. Only explicit shortlists permit matching; only participants can approve or record a handoff.",
  };
}

/** The transport supplies an authorized closure. Tools cannot choose a room or impersonate a participant. */
export function roomAssistantTools(access: RoomAccess, qloo: RoomQloo,
  limit: (name: AssistantToolName) => Promise<void>, clock: () => number = Date.now) {
  return {
    async invoke(name: AssistantToolName, input: unknown): Promise<unknown> {
      const schema = Object.hasOwn(assistantSchemas, name) ? assistantSchemas[name] : undefined;
      if (!schema) throw new Error("Unknown assistant tool.");
      const parsed = schema.parse(input);
      // Check membership before rate limits or provider access, on every tool invocation.
      const view = await access.read();
      await limit(name);
      switch (name) {
        case "read_room": return assistantRoom(view, clock());
        case "resolve_entities": {
          if (view.room.mode === "example") throw new Error("Example simulation uses fictional identities; create a real room to search Qloo.");
          const search = assistantSchemas.resolve_entities.parse(parsed);
          const result = await qloo.search(search.query, search.category);
          return { ...result, confirmationRequired: true,
            note: "Search candidates only. The participant must confirm a title or favorite in the room; no inventory or interests changed." };
        }
        case "rank_available_books": return assistantRoom(await rankRoom(access, qloo), clock());
        case "find_exchange_cycles": return assistantRoom(await findRoomExchanges(access, clock()), clock());
        case "explain_proposal": {
          const { cycleId, revision } = assistantSchemas.explain_proposal.parse(parsed);
          const room = expireHolds(view.room, clock());
          const cycle = room.cycles.filter(item => item.cycle.id === cycleId).sort((a, b) => b.revision - a.revision)[0];
          if (!cycle || cycle.revision !== revision) throw new Error("Stale cycle revision; reload before explaining.");
          return { cycleId, revision, status: cycle.status, example: room.mode === "example",
            transfers: cycle.cycle.transfers.map(transfer => ({
              listingId: transfer.listingId, fromMemberId: transfer.fromMemberId, toMemberId: transfer.toMemberId,
              title: room.listings.find(book => book.id === transfer.listingId)?.title ?? "Untitled offered book",
              evidence: transfer.evidence ?? null, evidenceStatus: transfer.evidenceStatus,
              provenance: room.evidenceSnapshots?.find(snapshot => snapshot.id === transfer.evidence?.snapshotId) ?? null,
              acceptable: room.shortlists.some(choice => choice.memberId === transfer.toMemberId && choice.bookId === transfer.bookId && choice.acceptable),
            })), acceptedBy: cycle.acceptedBy,
            note: "This explains the displayed revision. Rankings do not establish specific taste reasons or physical handoff. Changed transfers require fresh participant approval." };
        }
      }
    },
  };
}
