import assert from "node:assert/strict";
import { test } from "node:test";
import { offerBook, setInterests } from "../src/domain/inventory.ts";
import type { ExchangeRoom } from "../src/domain/exchanges.ts";
import { sampleRoom } from "../src/fixtures/sample-room.ts";

const room: ExchangeRoom = { ...sampleRoom, id: "room", revision: 1, cycles: [], holds: [] };
const actor = { roomId: "room", memberId: "aria" };
const identity = { id: "00000000-0000-4000-8000-000000000001", name: "Synthetic book", types: ["urn:entity:book"] };

test("copies stay separate from titles and require room membership and a confirmed book", () => {
  const added = offerBook(room, actor, identity, "new-copy");
  assert.equal(added.listings.at(-1)!.bookId, identity.id);
  assert.equal(added.listings.at(-1)!.ownerId, actor.memberId);
  assert.deepEqual(added.preferences, []);
  assert.deepEqual(added.shortlists, room.shortlists);
  assert.throws(() => offerBook(added, actor, identity, "new-copy"), /unique/);
  assert.throws(() => offerBook(room, { ...actor, memberId: "outsider" }, identity, "copy"), /membership/);
  assert.throws(() => offerBook(room, actor, { ...identity, types: ["urn:entity:movie"] }, "copy"), /book identity/);
});

test("interest changes invalidate only the member's current evidence and enforce three distinct inputs", () => {
  const changed = setInterests(room, actor, [identity]);
  assert.equal(changed.preferences.some(p => p.memberId === "aria"), false);
  assert.equal(changed.preferences.filter(p => p.memberId !== "aria").length, room.preferences.filter(p => p.memberId !== "aria").length);
  assert.deepEqual(changed.shortlists, room.shortlists);
  assert.equal(setInterests(changed, actor, [identity]), changed);
  assert.throws(() => setInterests(room, actor, [identity, identity]), /distinct/);
  assert.throws(() => setInterests(room, actor, Array.from({ length: 4 }, (_, n) => ({ ...identity, id: String(n) }))), /up to 3/);
});
