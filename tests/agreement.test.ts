import assert from "node:assert/strict";
import { test } from "node:test";
import { agreementText } from "../src/domain/agreement.ts";
import { acceptCycle, repairExchanges } from "../src/domain/exchanges.ts";
import type { ExchangeRoom } from "../src/domain/exchanges.ts";
import { sampleRoom } from "../src/fixtures/sample-room.ts";

const members = sampleRoom.memberIds.map(id => ({ id, alias: id }));
function approved(): ExchangeRoom {
  let room = repairExchanges({ ...sampleRoom, id: "example", mode: "example", revision: 1, holds: [], cycles: [] },
    { roomId: "example", memberId: "aria" }, 1000);
  const cycle = room.cycles[0]!;
  for (const memberId of cycle.cycle.memberIds) room = acceptCycle(room,
    { roomId: room.id, memberId }, cycle.cycle.id, cycle.revision, 1000, 10000);
  return room;
}
test("agreement labels synthetic decisions and exports only approved transfers", () => {
  const text = agreementText(approved(), members, 1001);
  assert.match(text, /FICTIONAL EXAMPLE/);
  assert.match(text, /Agreed; copies currently held/);
  assert.match(text, /Synthetic rank/);
  assert.match(text, /aria gives/);
  assert.doesNotMatch(text, /Completion recorded in app/);
});
test("expired or mismatched holds cannot be exported as a current agreement", () => {
  const room = approved();
  assert.throws(() => agreementText(room, members, 12000), /current approved/);
  assert.throws(() => agreementText({ ...room, holds: room.holds.map(h => ({ ...h, cycleRevision: 99 })) }, members, 1001), /current approved/);
});
test("unapproved changed exchanges cannot reuse prior approval in an export", () => {
  const room = approved();
  assert.throws(() => agreementText({ ...room, cycles: room.cycles.map(c => ({ ...c, status: "stale" })) }, members, 1001), /current approved/);
});
