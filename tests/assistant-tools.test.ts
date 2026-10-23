import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { newCapability, RoomStore } from "../src/server/store.ts";
import type { SqlConnection, SqlPool } from "../src/server/store.ts";
import { roomAccess } from "../src/server/room-operations.ts";
import type { RoomQloo } from "../src/server/room-operations.ts";
import { rankingInputs } from "../src/server/qloo-service.ts";
import { roomAssistantTools } from "../src/server/assistant-tools.ts";
import { shortlistBook } from "../src/domain/exchanges.ts";

// Synthetic provider data and embedded PostgreSQL; no model or live Qloo requests.
const db = await PGlite.create();
await db.exec(await readFile(new URL("../db/001_rooms.sql", import.meta.url), "utf8"));
after(() => db.close());
let tail = Promise.resolve();
const pool: SqlPool = { async connect(): Promise<SqlConnection> {
  const previous = tail; let release!: () => void;
  tail = new Promise<void>(done => { release = done; }); await previous;
  return { async query<T extends Record<string, unknown>>(sql: string, values?: unknown[]) {
    const result = await db.query<T>(sql, values); return { rows: result.rows, rowCount: result.affectedRows };
  }, release };
} };
const store = new RoomStore(pool);
const noProvider: RoomQloo = { async search() { throw new Error("Provider must not run."); },
  async rank() { throw new Error("Provider must not run."); } };
const noLimit = async () => {};

test("agent reads redact aliases/capabilities and cannot invent willingness", async () => {
  const session = newCapability(), view = await store.createExample(session);
  const tools = roomAssistantTools(roomAccess(store, view.room.id, session), noProvider, noLimit, () => 1000);
  const model = JSON.stringify(await tools.invoke("read_room", {}));
  assert.ok(!model.includes("Aria") && !model.includes(session));
  await tools.invoke("find_exchange_cycles", {});
  const saved = await store.read(view.room.id, session);
  assert.deepEqual(saved.room.cycles, []);
  assert.deepEqual(saved.room.shortlists, []);
  assert.deepEqual(saved.room.preferences, view.room.preferences);
});

test("tool inputs reject room/member impersonation and participant decisions", async () => {
  const session = newCapability(), view = await store.createExample(session);
  let called = false;
  const tools = roomAssistantTools(roomAccess(store, view.room.id, session), noProvider, async () => { called = true; });
  for (const input of [{ roomId: view.room.id }, { memberId: view.room.memberIds[1] }, { acceptable: true }, { command: "accept" }]) {
    await assert.rejects(tools.invoke("find_exchange_cycles", input));
  }
  await assert.rejects(tools.invoke("accept" as never, {}), /Unknown assistant tool/);
  assert.equal(called, false);
});

test("every tool checks membership before using limits or providers", async () => {
  const owner = newCapability(), view = await store.createExample(owner);
  let called = false;
  const tools = roomAssistantTools(roomAccess(store, view.room.id, newCapability()), noProvider, async () => { called = true; });
  for (const [name, input] of [["read_room", {}], ["find_exchange_cycles", {}], ["rank_available_books", {}],
    ["resolve_entities", { query: "a book", category: "book" }], ["explain_proposal", { cycleId: "cycle", revision: 1 }]] as const) {
    await assert.rejects(tools.invoke(name, input), /membership/);
  }
  assert.equal(called, false);
});

test("agent repair uses only existing shortlists and explains exact revisions", async () => {
  const session = newCapability(), view = await store.createExample(session);
  await store.mutate(view.room.id, session, current => current.room.preferences.reduce((room, preference) =>
    shortlistBook(room, { roomId: room.id, memberId: preference.memberId }, preference.bookId, true), current.room));
  const tools = roomAssistantTools(roomAccess(store, view.room.id, session), noProvider, noLimit, () => 1000);
  await tools.invoke("find_exchange_cycles", {});
  const saved = await store.read(view.room.id, session), cycle = saved.room.cycles[0]!;
  assert.ok(cycle);
  assert.equal(cycle.status, "pending");
  assert.deepEqual(cycle.acceptedBy, []);
  assert.deepEqual(saved.room.holds, []);
  const explanation = await tools.invoke("explain_proposal", { cycleId: cycle.cycle.id, revision: cycle.revision }) as { transfers: { acceptable: boolean }[]; example: boolean };
  assert.equal(explanation.example, true);
  assert.ok(explanation.transfers.every(transfer => transfer.acceptable));
  await assert.rejects(tools.invoke("explain_proposal", { cycleId: cycle.cycle.id, revision: cycle.revision + 1 }), /Stale/);
  assert.deepEqual((await store.read(view.room.id, session)).room, saved.room);
});

test("agent ranking uses the shared service and preserves explicit shortlists", async () => {
  const session = newCapability(), created = await store.create(session, "Private alias");
  const memberId = created.view.actor.memberId;
  await store.mutate(created.view.room.id, session, current => ({ ...current.room, revision: current.room.revision + 1,
    listings: [{ id: "copy", bookId: "book", ownerId: memberId, available: true }],
    shortlists: [{ memberId, bookId: "book", acceptable: true }] }));
  const before = await store.read(created.view.room.id, session);
  const qloo: RoomQloo = { ...noProvider, async rank(room) { return {
    inputs: rankingInputs(room), evidence: [{ memberId, bookId: "book", source: "qloo", rank: 1, catalogSize: 1 }], snapshots: [],
  }; } };
  const tools = roomAssistantTools(roomAccess(store, before.room.id, session), qloo, noLimit);
  await tools.invoke("rank_available_books", {});
  const saved = await store.read(before.room.id, session);
  assert.deepEqual(saved.room.shortlists, before.room.shortlists);
  assert.equal(saved.room.preferences[0]!.rank, 1);
  assert.deepEqual(saved.room.cycles, []);
});

test("an inventory change while ranking rejects stale evidence", async () => {
  const session = newCapability(), { view } = await store.create(session, "Race fixture");
  const qloo: RoomQloo = { ...noProvider, async rank(room) {
    await store.mutate(room.id, session, current => ({ ...current.room, revision: current.room.revision + 1,
      listings: [{ id: "new-copy", bookId: "new-book", ownerId: current.actor.memberId, available: true }] }));
    return { inputs: rankingInputs(room), evidence: [], snapshots: [] };
  } };
  const tools = roomAssistantTools(roomAccess(store, view.room.id, session), qloo, noLimit);
  await assert.rejects(tools.invoke("rank_available_books", {}), /Room changed/);
  assert.deepEqual((await store.read(view.room.id, session)).room.preferences, []);
});

test("provider failure preserves the last saved room", async () => {
  const session = newCapability(), { view } = await store.create(session, "Failure fixture");
  const tools = roomAssistantTools(roomAccess(store, view.room.id, session), noProvider, noLimit);
  await assert.rejects(tools.invoke("rank_available_books", {}), /Provider must not run/);
  assert.deepEqual((await store.read(view.room.id, session)).room, view.room);
});

test("identity lookup returns candidates requiring confirmation and makes no changes", async () => {
  const session = newCapability(), { view } = await store.create(session, "Lookup fixture");
  const qloo: RoomQloo = { ...noProvider, async search() { return { origin: "cache", identities: [
    { id: "11111111-1111-4111-8111-111111111111", name: "Synthetic candidate", types: ["urn:entity:book"] },
  ] }; } };
  const tools = roomAssistantTools(roomAccess(store, view.room.id, session), qloo, noLimit);
  const result = await tools.invoke("resolve_entities", { query: "Synthetic candidate", category: "book" }) as { confirmationRequired: boolean };
  assert.equal(result.confirmationRequired, true);
  assert.deepEqual((await store.read(view.room.id, session)).room, view.room);
});
