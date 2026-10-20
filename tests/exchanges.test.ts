import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptCycle, declineCycle, expireHolds, repairExchanges, reportCompletion, shortlistBook, withdrawListing } from "../src/domain/exchanges.ts";
import type { ExchangeRoom, MemberActor } from "../src/domain/exchanges.ts";

const now = 1_000;
const actor = (memberId: string): MemberActor => ({ roomId: "room-one", memberId });
function room(): ExchangeRoom {
  const memberIds = ["a", "b", "c", "d"];
  return { id: "room-one", revision: 1, memberIds, preferences: [], cycles: [], holds: [],
    listings: memberIds.map(ownerId => ({ id: `copy-${ownerId}`, bookId: `book-${ownerId}`, ownerId, available: true })),
    shortlists: [["a", "b"], ["b", "a"], ["c", "d"], ["d", "c"]].map(([memberId, owner]) =>
      ({ memberId: memberId!, bookId: `book-${owner}`, acceptable: true })) };
}
function proposed() { return repairExchanges(room(), actor("a"), now); }
function cycleFor(input: ExchangeRoom, memberId: string) {
  return input.cycles.find(c => (c.status === "pending" || c.status === "held") && c.cycle.memberIds.includes(memberId))!;
}
function acceptPair(input: ExchangeRoom, first: string, second: string, duration = 100) {
  const cycle = cycleFor(input, first);
  const partial = acceptCycle(input, actor(first), cycle.cycle.id, cycle.revision, now, duration);
  return acceptCycle(partial, actor(second), cycle.cycle.id, cycle.revision, now, duration);
}

test("partial approval is distinct from unanimous approval and acceptance retries are idempotent", () => {
  const start = proposed(), cycle = cycleFor(start, "a");
  const partial = acceptCycle(start, actor("a"), cycle.cycle.id, 1, now);
  assert.equal(partial.holds.length, 0);
  assert.equal(cycleFor(partial, "a").status, "pending");
  assert.equal(acceptCycle(partial, actor("a"), cycle.cycle.id, 1, now), partial);
  const held = acceptCycle(partial, actor("b"), cycle.cycle.id, 1, now);
  assert.equal(held.holds.length, 2);
  assert.equal(cycleFor(held, "a").status, "held");
  assert.equal(acceptCycle(held, actor("b"), cycle.cycle.id, 1, now), held);
  assert.equal(start.holds.length, 0);
});

test("repair preserves an unchanged disjoint cycle and its existing participant approval", () => {
  let state = proposed();
  const stable = cycleFor(state, "c");
  state = acceptCycle(state, actor("c"), stable.cycle.id, stable.revision, now);
  const stableApproved = cycleFor(state, "c");
  state = withdrawListing(state, actor("a"), "copy-a");
  state = repairExchanges(state, actor("b"), now);
  assert.equal(cycleFor(state, "c"), stableApproved);
  assert.deepEqual(stableApproved.acceptedBy, ["c"]);
  assert.equal(state.cycles.filter(c => c.status === "pending").length, 1);
});

test("repair gives changed physical-copy transfers fresh approval while retaining another held cycle", () => {
  const initial = room();
  const withExtra = { ...initial, listings: [...initial.listings,
    { id: "copy-a-extra", bookId: "book-a", ownerId: "a", available: true }] };
  let state = repairExchanges(withExtra, actor("a"), now);
  state = acceptPair(state, "a", "b"); state = acceptPair(state, "c", "d");
  const stable = cycleFor(state, "c");
  const old = cycleFor(state, "a");
  const given = old.cycle.transfers.find(t => t.fromMemberId === "a")!.listingId;
  state = withdrawListing(state, actor("a"), given);
  assert.equal(state.holds.length, 2);
  state = repairExchanges(state, actor("b"), now);
  const fresh = cycleFor(state, "a");
  assert.notEqual(fresh.cycle.id, old.cycle.id);
  assert.deepEqual(fresh.acceptedBy, []);
  assert.equal(cycleFor(state, "c"), stable);
  assert.throws(() => acceptCycle(state, actor("a"), old.cycle.id, old.revision, now), /no longer/);
});

test("decline releases only affected holds, does not widen shortlists, and avoids re-proposing the rejected cycle", () => {
  let state = acceptPair(acceptPair(proposed(), "a", "b"), "c", "d");
  const declined = cycleFor(state, "a"), stable = cycleFor(state, "c");
  const decisions = structuredClone(state.shortlists);
  state = declineCycle(state, actor("a"), declined.cycle.id, declined.revision);
  assert.equal(state.holds.length, 2);
  assert.equal(declineCycle(state, actor("a"), declined.cycle.id, declined.revision), state);
  state = repairExchanges(state, actor("b"), now);
  assert.equal(cycleFor(state, "c"), stable);
  assert.deepEqual(state.shortlists, decisions);
  assert.equal(state.cycles.some(c => c.status === "pending" && c.cycle.memberIds.includes("a")), false);
});

test("shortlist changes preserve rank evidence and invalidate only affected active cycles", () => {
  const state = acceptPair(proposed(), "a", "b");
  const evidence = [{ memberId: "a", bookId: "book-b", source: "qloo" as const, rank: 2, catalogSize: 4 }];
  const ranked = { ...state, preferences: evidence };
  const changed = shortlistBook(ranked, actor("a"), "book-b", false);
  assert.equal(changed.preferences, evidence);
  assert.equal(changed.holds.length, 0);
  assert.equal(cycleFor(changed, "c"), cycleFor(state, "c"));
  assert.equal(shortlistBook(changed, actor("a"), "book-b", false), changed);
});

test("stale cycle revisions and cross-room or nonparticipant actions are rejected", () => {
  const state = proposed(), cycle = cycleFor(state, "a");
  assert.throws(() => acceptCycle(state, actor("a"), cycle.cycle.id, 99, now), /Stale/);
  assert.throws(() => acceptCycle(state, actor("c"), cycle.cycle.id, 1, now), /participants/);
  assert.throws(() => repairExchanges(state, { roomId: "other-room", memberId: "a" }, now), /membership/);
  assert.throws(() => shortlistBook(state, actor("outside"), "book-a", true), /membership/);
  assert.throws(() => withdrawListing(state, actor("b"), "copy-a"), /owner/);
});

test("expired holds require a fresh cycle revision and fresh approvals", () => {
  const state = acceptPair(proposed(), "a", "b", 10), cycle = cycleFor(state, "a");
  assert.throws(() => acceptCycle(state, actor("a"), cycle.cycle.id, 1, now + 11), /no longer/);
  const expired = expireHolds(state, now + 11);
  assert.equal(expired.holds.length, 0);
  const repaired = repairExchanges(expired, actor("a"), now + 11), fresh = cycleFor(repaired, "a");
  assert.equal(fresh.revision, 2);
  assert.deepEqual(fresh.acceptedBy, []);
  assert.throws(() => acceptCycle(repaired, actor("a"), cycle.cycle.id, 1, now + 11), /Stale/);
});

test("an existing conflicting hold prevents final acceptance without partial writes", () => {
  const state = proposed(), cycle = cycleFor(state, "a");
  const partial = acceptCycle(state, actor("a"), cycle.cycle.id, 1, now);
  const conflict = { ...partial, holds: [{ listingId: "copy-a", cycleId: "other-cycle", cycleRevision: 1, expiresAt: now + 100 }] };
  const before = structuredClone(conflict);
  assert.throws(() => acceptCycle(conflict, actor("b"), cycle.cycle.id, 1, now), /already held/);
  assert.deepEqual(conflict, before);
});

test("completion requires explicit participant action and completed exchanges remain immutable", () => {
  const pending = proposed(), cycle = cycleFor(pending, "a");
  assert.throws(() => reportCompletion(pending, actor("a"), cycle.cycle.id, 1, now), /approved/);
  const held = acceptPair(pending, "a", "b");
  const completed = reportCompletion(held, actor("a"), cycle.cycle.id, 1, now);
  assert.equal(completed.holds.length, 0);
  assert.equal(completed.listings.find(l => l.id === "copy-a")!.available, false);
  assert.equal(reportCompletion(completed, actor("b"), cycle.cycle.id, 1, now), completed);
  assert.throws(() => withdrawListing(completed, actor("a"), "copy-a"), /Completed/);
  assert.throws(() => declineCycle(completed, actor("a"), cycle.cycle.id, 1), /cannot/);
  assert.equal(repairExchanges(completed, actor("c"), now).cycles.find(c => c.cycle.id === cycle.cycle.id)!.status, "completed");
});

test("repair of an unchanged room preserves all existing cycle decisions", () => {
  const state = proposed(), cycle = cycleFor(state, "a");
  const partial = acceptCycle(state, actor("a"), cycle.cycle.id, 1, now);
  const repaired = repairExchanges(partial, actor("c"), now);
  assert.equal(repaired.cycles.length, partial.cycles.length);
  assert.deepEqual(repaired.cycles, partial.cycles);
});
