import type { ExchangeRoom, MemberActor } from "./exchanges.ts";
import type { QlooIdentity } from "../integrations/qloo-results.ts";

function authorize(room: ExchangeRoom, actor: MemberActor) {
  if (room.id !== actor.roomId || !room.memberIds.includes(actor.memberId)) throw new Error("Room membership required.");
}
export function offerBook(room: ExchangeRoom, actor: MemberActor, identity: QlooIdentity, listingId: string): ExchangeRoom {
  authorize(room, actor);
  if (!identity.types.includes("urn:entity:book")) throw new Error("Choose a confirmed book identity.");
  if (room.listings.filter(l => l.ownerId === actor.memberId).length >= 3) throw new Error("A member may offer at most 3 books.");
  if (!listingId || room.listings.some(l => l.id === listingId)) throw new Error("Physical copy identity must be unique.");
  return { ...room, revision: room.revision + 1, listings: [...room.listings,
    { id: listingId, bookId: identity.id, title: identity.name, ownerId: actor.memberId, available: true }],
    // Keep archived snapshots and cycle evidence; current rankings must use the new catalog.
    preferences: [] };
}
export function setInterests(room: ExchangeRoom, actor: MemberActor, identities: readonly QlooIdentity[]): ExchangeRoom {
  authorize(room, actor);
  if (identities.length > 3 || new Set(identities.map(i => i.id)).size !== identities.length) throw new Error("Choose up to 3 distinct interests.");
  const supported = new Set(["urn:entity:book", "urn:entity:artist", "urn:entity:movie", "urn:entity:video_game"]);
  if (identities.some(i => !i.types.some(t => supported.has(t)))) throw new Error("Unsupported cultural interest.");
  const previous = (room.interests ?? []).filter(i => i.memberId === actor.memberId).map(i => i.entityId).sort();
  if (JSON.stringify(previous) === JSON.stringify(identities.map(i => i.id).sort())) return room;
  return { ...room, revision: room.revision + 1,
    interests: [...(room.interests ?? []).filter(i => i.memberId !== actor.memberId),
      ...identities.map(i => ({ memberId: actor.memberId, entityId: i.id, name: i.name,
        type: i.types.find(t => supported.has(t))! }))],
    preferences: room.preferences.filter(p => p.memberId !== actor.memberId) };
}
