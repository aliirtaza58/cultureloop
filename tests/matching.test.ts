import assert from "node:assert/strict";
import { test } from "node:test";
import { enumerateCycles, proposeExchanges } from "../src/domain/matching.ts";
import type { Preference, RoomInput } from "../src/domain/matching.ts";
import { sampleRoom } from "../src/fixtures/sample-room.ts";

function room(memberIds = ["a", "b"]): RoomInput {
  return { memberIds, listings: memberIds.map(id => ({ id: `copy-${id}`, bookId: `book-${id}`,
    ownerId: id, available: true })), preferences: [],
    // These fixture participants explicitly chose every other offered title.
    shortlists: memberIds.flatMap(memberId => memberIds.filter(owner => owner !== memberId)
      .map(owner => ({ memberId, bookId: `book-${owner}`, acceptable: true }))) };
}
function likes(memberId: string, ownerId: string, rank = 1, catalogSize = 3): Preference {
  return { memberId, bookId: `book-${ownerId}`, source: "synthetic", rank, catalogSize };
}

test("finds a direct exchange, with approval still required", () => {
  const result = proposeExchanges({ ...room(), preferences: [likes("a", "b"), likes("b", "a")] });
  assert.equal(result.membersServed, 2);
  assert.equal(result.cycles[0]!.transfers.length, 2);
  assert.equal(result.approvalRequired, true);
});

test("finds a three-person exchange where no direct exchange exists", () => {
  const cycles = enumerateCycles(sampleRoom);
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0]!.memberIds.length, 3);
  assert.equal(proposeExchanges(sampleRoom).membersServed, 3);
  assert.ok(cycles[0]!.transfers.every(t => t.evidence?.source === "synthetic"));
});

test("shortlisted books with missing evidence remain eligible and explicitly unknown", () => {
  const result = proposeExchanges({ ...room(), preferences: [likes("a", "b")] });
  assert.equal(result.membersServed, 2);
  assert.equal(result.weakestRankUtility, 0);
  assert.equal(result.cycles[0]!.transfers.filter(t => t.evidenceStatus === "unknown").length, 1);
  assert.equal(result.cycles[0]!.transfers.find(t => t.evidenceStatus === "unknown")!.evidence, undefined);
});

test("withdrawal makes the sample cycle infeasible without mutating old input", () => {
  const withdrawn = { ...sampleRoom, listings: sampleRoom.listings.map((listing, index) =>
    index === 0 ? { ...listing, available: false } : listing) };
  assert.equal(proposeExchanges(withdrawn).membersServed, 0);
  assert.equal(proposeExchanges(sampleRoom).membersServed, 3);
});

test("never exchanges a member's own physical copy", () => {
  assert.deepEqual(proposeExchanges({ ...room(), preferences: [likes("a", "a"), likes("b", "b")],
    shortlists: [{ memberId: "a", bookId: "book-a", acceptable: true },
      { memberId: "b", bookId: "book-b", acceptable: true }] }).cycles, []);
});

test("explicit unwillingness excludes even a high-ranked book", () => {
  const base = room();
  const result = proposeExchanges({ ...base, preferences: [likes("a", "b"), likes("b", "a")],
    shortlists: base.shortlists.map(d => d.memberId === "b" ? { ...d, acceptable: false } : d) });
  assert.equal(result.membersServed, 0);
});

test("ranked alternatives outside the shortlist cannot be proposed", () => {
  const input = { ...room(["a", "b", "c"]), preferences: [
    likes("a", "b"), likes("b", "a"),
  ], shortlists: [{ memberId: "a", bookId: "book-c", acceptable: true },
    { memberId: "b", bookId: "book-a", acceptable: true }] };
  assert.equal(proposeExchanges(input).membersServed, 0);
});

test("willingness alone can form a cycle without fabricated Qloo evidence", () => {
  const result = proposeExchanges(room());
  assert.equal(result.membersServed, 2);
  assert.ok(result.cycles[0]!.transfers.every(t => t.evidence === undefined && t.rankUtility === 0));
});

test("selects globally compatible cycles instead of a smaller overlapping combination", () => {
  const input = { ...room(["a", "b", "c", "d", "e", "f"]), preferences: [
    likes("b", "a"), likes("a", "b"), likes("d", "c"), likes("c", "d"),
    likes("f", "e"), likes("e", "f"), likes("c", "b"), likes("a", "c"),
  ] };
  const result = proposeExchanges(input);
  assert.equal(result.membersServed, 6);
  const members = result.cycles.flatMap(c => c.memberIds);
  const copies = result.cycles.flatMap(c => c.transfers.map(t => t.listingId));
  assert.equal(new Set(members).size, members.length);
  assert.equal(new Set(copies).size, copies.length);
});

test("breaks coverage ties by weakest fit, then total rank utility", () => {
  const input: RoomInput = { memberIds: ["a", "b"], listings: [
    { id: "a1", bookId: "a1", ownerId: "a", available: true },
    { id: "a2", bookId: "a2", ownerId: "a", available: true },
    { id: "b1", bookId: "b1", ownerId: "b", available: true },
    { id: "b2", bookId: "b2", ownerId: "b", available: true },
  ], preferences: [
    { memberId: "a", bookId: "b1", source: "synthetic", rank: 1, catalogSize: 3 },
    { memberId: "a", bookId: "b2", source: "synthetic", rank: 2, catalogSize: 3 },
    { memberId: "b", bookId: "a1", source: "synthetic", rank: 3, catalogSize: 3 },
    { memberId: "b", bookId: "a2", source: "synthetic", rank: 2, catalogSize: 3 },
  ], shortlists: [
    { memberId: "a", bookId: "b1", acceptable: true }, { memberId: "a", bookId: "b2", acceptable: true },
    { memberId: "b", bookId: "a1", acceptable: true }, { memberId: "b", bookId: "a2", acceptable: true },
  ] };
  const result = proposeExchanges(input);
  assert.deepEqual(result.cycles[0]!.transfers.map(t => t.listingId).sort(), ["a2", "b1"]);
  assert.equal(result.weakestRankUtility, 2 / 3);
});

test("same-title copies stay distinct and do not let one member join two cycles", () => {
  const base = room(["a", "b", "c"]);
  const result = proposeExchanges({ ...base,
    listings: base.listings.map(l => l.ownerId === "c" ? l : { ...l, bookId: "shared-title" }),
    preferences: [likes("a", "c"), likes("b", "c"),
      { memberId: "c", bookId: "shared-title", source: "synthetic", rank: 1, catalogSize: 2 }],
    shortlists: [{ memberId: "a", bookId: "book-c", acceptable: true },
      { memberId: "b", bookId: "book-c", acceptable: true },
      { memberId: "c", bookId: "shared-title", acceptable: true }],
  });
  assert.equal(result.membersServed, 2);
  assert.equal(new Set(result.cycles.flatMap(c => c.transfers.map(t => t.listingId))).size, 2);
});

test("ties are reproducible when input ordering changes", () => {
  const input = { ...room(["a", "b", "c"]), preferences: [
    likes("a", "b"), likes("b", "a"), likes("a", "c"), likes("c", "a"),
  ] };
  assert.deepEqual(proposeExchanges(input), proposeExchanges({
    memberIds: [...input.memberIds].reverse(), listings: [...input.listings].reverse(),
    preferences: [...input.preferences].reverse(),
    shortlists: [...input.shortlists].reverse(),
  }));
});

test("rejects duplicate physical IDs", () => {
  const base = room();
  assert.throws(() => proposeExchanges({ ...base, listings: base.listings.map(l => ({ ...l, id: "same" })) }), /unique/);
});

test("rejects foreign owners and foreign preference references", () => {
  const base = room();
  assert.throws(() => proposeExchanges({ ...base, listings: [{ ...base.listings[0]!, ownerId: "outside" }] }), /outside/);
  assert.throws(() => proposeExchanges({ ...base, preferences: [likes("outside", "a")] }), /outside/);
  assert.throws(() => proposeExchanges({ ...base, preferences: [likes("a", "unknown")] }), /outside/);
});

test("rejects duplicate preference evidence instead of silently replacing it", () => {
  assert.throws(() => proposeExchanges({ ...room(), preferences: [likes("a", "b"), likes("a", "b")] }), /unique/);
});

test("rejects invalid ranks, missing ranks, and out-of-scope room sizes", () => {
  for (const rank of [0, -1, 1.5, 4, Number.NaN]) {
    assert.throws(() => proposeExchanges({ ...room(), preferences: [likes("a", "b", rank)] }), /Rank/);
  }
  assert.throws(() => proposeExchanges({ ...room(), preferences: [
    { memberId: "a", bookId: "book-b", source: "qloo" } as Preference,
  ] }), /supply a rank/);
  assert.throws(() => proposeExchanges(room(["a"])), /2 to 6/);
  assert.throws(() => proposeExchanges(room(["a", "b", "c", "d", "e", "f", "g"])), /2 to 6/);
});

test("rejects duplicate members and more than three offered copies per member", () => {
  assert.throws(() => proposeExchanges(room(["a", "a"])), /unique/);
  const base = room();
  assert.throws(() => proposeExchanges({ ...base, listings: Array.from({ length: 4 }, (_, index) =>
    ({ id: `copy-${index}`, bookId: `book-${index}`, ownerId: "a", available: true })) }), /at most 3/);
});

test("room with no offered inventory gives an empty proposal", () => {
  assert.deepEqual(proposeExchanges({ ...room(), listings: [], shortlists: [] }).cycles, []);
});

test("rank evidence alone never implies willingness", () => {
  assert.equal(proposeExchanges({ ...room(), shortlists: [],
    preferences: [likes("a", "b"), likes("b", "a")] }).membersServed, 0);
});

test("shortlisting preserves original evidence ranks and never records approval", () => {
  const input = { ...room(), preferences: [likes("a", "b", 2), likes("b", "a", 3)] };
  const original = structuredClone(input);
  const result = proposeExchanges(input);
  assert.deepEqual(input, original);
  assert.equal(result.cycles[0]!.transfers.find(t => t.toMemberId === "a")!.evidence!.rank, 2);
  assert.equal(result.cycles[0]!.transfers.find(t => t.toMemberId === "b")!.evidence!.rank, 3);
  assert.equal(result.approvalRequired, true);
});

test("rejects missing, foreign, duplicate, or non-boolean shortlist decisions", () => {
  const base = room();
  assert.throws(() => proposeExchanges({ ...base, shortlists: undefined } as unknown as RoomInput), /required/);
  assert.throws(() => proposeExchanges({ ...base, shortlists: [{ memberId: "outside", bookId: "book-a", acceptable: true }] }), /outside/);
  assert.throws(() => proposeExchanges({ ...base, shortlists: [base.shortlists[0]!, base.shortlists[0]!] }), /unique/);
  assert.throws(() => proposeExchanges({ ...base, shortlists: [{ ...base.shortlists[0]!, acceptable: "yes" }] } as unknown as RoomInput), /boolean/);
});
