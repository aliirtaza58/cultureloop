import { enumerateCycles, proposeExchanges } from "./matching.ts";
import type { ExchangeCycle, RoomInput } from "./matching.ts";

export type CycleStatus = "pending" | "held" | "declined" | "stale" | "expired" | "completed";
export interface CycleRecord {
  readonly cycle: ExchangeCycle;
  readonly revision: number;
  readonly status: CycleStatus;
  readonly acceptedBy: readonly string[];
  readonly declinedBy?: string;
  readonly completedBy?: string;
}
export interface InventoryHold {
  readonly listingId: string;
  readonly cycleId: string;
  readonly cycleRevision: number;
  readonly expiresAt: number;
}
export interface ExchangeRoom extends RoomInput {
  readonly id: string;
  readonly revision: number;
  readonly cycles: readonly CycleRecord[];
  readonly holds: readonly InventoryHold[];
  readonly mode?: "example";
  readonly exampleControllerMemberId?: string;
  readonly interests?: readonly { memberId: string; entityId: string; name: string; type: string }[];
  readonly evidenceSnapshots?: readonly { id: string; memberId: string; catalogIds: readonly string[];
    interestIds: readonly string[]; retrievedAt: string; origin: "live" | "cache" | "synthetic";
    explanationStatus: "available" | "warning" | "unavailable"; missingBookIds: readonly string[] }[];
}
/** Constructed from a verified server-side membership, never model/user-supplied authority. */
export interface MemberActor { readonly roomId: string; readonly memberId: string }

function authorize(room: ExchangeRoom, actor: MemberActor): void {
  if (actor.roomId !== room.id || !room.memberIds.includes(actor.memberId)) throw new Error("Room membership required.");
}
function clock(now: number): void {
  if (!Number.isSafeInteger(now) || now < 0) throw new Error("A valid server timestamp is required.");
}
function currentCycle(room: ExchangeRoom, actor: MemberActor, cycleId: string, revision: number): CycleRecord {
  authorize(room, actor);
  const item = room.cycles.filter(c => c.cycle.id === cycleId).sort((a, b) => b.revision - a.revision)[0];
  if (!item || item.revision !== revision) throw new Error("Stale cycle revision; reload before deciding.");
  if (!item.cycle.memberIds.includes(actor.memberId)) throw new Error("Only cycle participants may decide.");
  return item;
}
function replace(room: ExchangeRoom, previous: CycleRecord, next: CycleRecord,
  holds: readonly InventoryHold[] = room.holds): ExchangeRoom {
  return { ...room, revision: room.revision + 1,
    cycles: room.cycles.map(item => item === previous ? next : item), holds };
}
function release(room: ExchangeRoom, cycleIds: Set<string>): readonly InventoryHold[] {
  return room.holds.filter(hold => !cycleIds.has(hold.cycleId));
}

export function expireHolds(room: ExchangeRoom, now: number): ExchangeRoom {
  clock(now);
  const expired = new Set(room.holds.filter(h => h.expiresAt <= now).map(h => h.cycleId));
  if (!expired.size) return room;
  return { ...room, revision: room.revision + 1, holds: release(room, expired),
    cycles: room.cycles.map(c => c.status === "held" && expired.has(c.cycle.id) ? { ...c, status: "expired" } : c) };
}

/** Run inside the repository's transaction. Pure functions alone do not establish DB atomicity. */
export function repairExchanges(room: ExchangeRoom, actor: MemberActor, now: number): ExchangeRoom {
  authorize(room, actor);
  const base = expireHolds(room, now);
  const feasible = new Set(enumerateCycles(base).map(c => c.id));
  const preserved = base.cycles.filter(c => c.status === "completed"
    || ((c.status === "pending" || c.status === "held") && feasible.has(c.cycle.id)));
  const reserved = preserved.flatMap(c => c.cycle.memberIds);
  if (new Set(reserved).size !== reserved.length) throw new Error("Overlapping persisted cycles require review.");
  const invalid = new Set(base.cycles.filter(c => (c.status === "pending" || c.status === "held")
    && !preserved.includes(c)).map(c => c.cycle.id));
  const proposed = proposeExchanges(base, { reservedMemberIds: reserved,
    excludedCycleIds: base.cycles.filter(c => c.status === "declined").map(c => c.cycle.id) });
  const additions: CycleRecord[] = proposed.cycles.map(cycle => ({ cycle,
    revision: 1 + Math.max(0, ...base.cycles.filter(c => c.cycle.id === cycle.id).map(c => c.revision)),
    status: "pending", acceptedBy: [] }));
  if (!invalid.size && !additions.length) return base;
  return { ...base, revision: base.revision + 1, holds: release(base, invalid),
    cycles: [...base.cycles.map(c => invalid.has(c.cycle.id) && (c.status === "pending" || c.status === "held")
      ? { ...c, status: "stale" as const } : c), ...additions] };
}

export function acceptCycle(room: ExchangeRoom, actor: MemberActor, cycleId: string,
  revision: number, now: number, holdMs = 60 * 60 * 1000): ExchangeRoom {
  clock(now);
  if (!Number.isSafeInteger(holdMs) || holdMs < 1 || holdMs > 24 * 60 * 60 * 1000) throw new Error("Invalid hold duration.");
  const base = expireHolds(room, now);
  const item = currentCycle(base, actor, cycleId, revision);
  if (item.status === "held" && base.holds.filter(h => h.cycleId === cycleId).length !== item.cycle.transfers.length) {
    throw new Error("Cycle hold expired; repair and approve a fresh revision.");
  }
  if ((item.status === "held" || item.status === "completed") && item.acceptedBy.includes(actor.memberId)) return base;
  if (item.status !== "pending") throw new Error("This cycle is no longer awaiting decisions.");
  if (!enumerateCycles(base).some(c => c.id === cycleId)) throw new Error("Cycle availability or willingness changed.");
  if (item.acceptedBy.includes(actor.memberId)) return base;
  const acceptedBy = [...item.acceptedBy, actor.memberId].sort();
  if (!item.cycle.memberIds.every(member => acceptedBy.includes(member))) return replace(base, item, { ...item, acceptedBy });
  const copies = new Set(item.cycle.transfers.map(t => t.listingId));
  if (base.holds.some(h => copies.has(h.listingId) && h.expiresAt > now && h.cycleId !== cycleId)) {
    throw new Error("An offered copy is already held by another exchange.");
  }
  const holds = [...base.holds, ...[...copies].map(listingId =>
    ({ listingId, cycleId, cycleRevision: revision, expiresAt: now + holdMs }))];
  return replace(base, item, { ...item, acceptedBy, status: "held" }, holds);
}

export function declineCycle(room: ExchangeRoom, actor: MemberActor, cycleId: string, revision: number): ExchangeRoom {
  const item = currentCycle(room, actor, cycleId, revision);
  if (item.status === "declined" && item.declinedBy === actor.memberId) return room;
  if (item.status !== "pending" && item.status !== "held") throw new Error("This cycle cannot be declined.");
  return replace(room, item, { ...item, status: "declined", declinedBy: actor.memberId }, release(room, new Set([cycleId])));
}

function invalidate(room: ExchangeRoom, affected: Set<string>): ExchangeRoom {
  return { ...room, revision: room.revision + 1, holds: release(room, affected),
    cycles: room.cycles.map(c => affected.has(c.cycle.id) && (c.status === "pending" || c.status === "held")
      ? { ...c, status: "stale" } : c) };
}

export function shortlistBook(room: ExchangeRoom, actor: MemberActor, bookId: string, acceptable: boolean): ExchangeRoom {
  authorize(room, actor);
  if (typeof acceptable !== "boolean" || !room.listings.some(l => l.bookId === bookId)) throw new Error("Invalid shortlist decision.");
  const old = room.shortlists.find(d => d.memberId === actor.memberId && d.bookId === bookId);
  if (old?.acceptable === acceptable) return room;
  const affected = new Set(!acceptable ? room.cycles.filter(c => c.cycle.transfers.some(t =>
    t.toMemberId === actor.memberId && t.bookId === bookId) && c.status !== "completed").map(c => c.cycle.id) : []);
  return invalidate({ ...room, shortlists: [...room.shortlists.filter(d => d !== old),
    { memberId: actor.memberId, bookId, acceptable }] }, affected);
}

export function withdrawListing(room: ExchangeRoom, actor: MemberActor, listingId: string): ExchangeRoom {
  authorize(room, actor);
  const listing = room.listings.find(l => l.id === listingId);
  if (!listing || listing.ownerId !== actor.memberId) throw new Error("Only the copy's owner may withdraw it.");
  if (room.cycles.some(c => c.status === "completed" && c.cycle.transfers.some(t => t.listingId === listingId))) {
    throw new Error("Completed exchanges cannot be rewritten.");
  }
  if (!listing.available) return room;
  const affected = new Set(room.cycles.filter(c => c.cycle.transfers.some(t => t.listingId === listingId)).map(c => c.cycle.id));
  return invalidate({ ...room, listings: room.listings.map(l => l === listing ? { ...l, available: false } : l) }, affected);
}

export function reportCompletion(room: ExchangeRoom, actor: MemberActor, cycleId: string, revision: number, now: number): ExchangeRoom {
  clock(now);
  const item = currentCycle(room, actor, cycleId, revision);
  if (item.status === "completed") return room;
  if (item.status !== "held" || room.holds.filter(h => h.cycleId === cycleId && h.expiresAt > now).length !== item.cycle.transfers.length) {
    throw new Error("A current unanimously approved hold is required.");
  }
  const next = replace(room, item, { ...item, status: "completed", completedBy: actor.memberId }, release(room, new Set([cycleId])));
  const copies = new Set(item.cycle.transfers.map(t => t.listingId));
  return { ...next, listings: next.listings.map(l => copies.has(l.id) ? { ...l, available: false } : l) };
}
