import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { newCapability, RoomStore } from "../src/server/store.ts";
import type { SqlConnection, SqlPool } from "../src/server/store.ts";
import { acceptCycle, repairExchanges } from "../src/domain/exchanges.ts";
import { QlooClient } from "../src/integrations/qloo.ts";
import { QlooService } from "../src/server/qloo-service.ts";
import { rateLimit } from "../src/server/limits.ts";

// Real embedded PostgreSQL/WASM; this is not a hosted/network concurrency test.
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

test("private membership is required even when a room identity and invitation are known", async () => {
  const store = new RoomStore(pool), owner = newCapability();
  const { view, inviteToken } = await store.create(owner, "Reader One");
  await assert.rejects(store.read(view.room.id, newCapability()), /membership/);
  await assert.rejects(store.read(view.room.id, inviteToken), /membership/);
  const guest = newCapability();
  const joined = await store.join(inviteToken, guest, "Reader Two");
  assert.equal(joined.room.memberIds.length, 2);
  assert.notEqual(joined.actor.memberId, view.actor.memberId);
  assert.equal((await store.join(inviteToken, guest, "Ignored retry alias")).room.revision, joined.room.revision);
  const freshStore = new RoomStore(pool);
  assert.equal((await freshStore.read(view.room.id, guest)).members.length, 2);
});

test("room capacity is enforced transactionally and join retries do not allocate extra memberships", async () => {
  const store = new RoomStore(pool), owner = newCapability();
  const created = await store.create(owner, "Owner");
  for (let i = 0; i < 5; i++) await store.join(created.inviteToken, newCapability(), `Guest ${i}`);
  await assert.rejects(store.join(created.inviteToken, newCapability(), "Seventh"), /six/);
  assert.equal((await store.read(created.view.room.id, owner)).members.length, 6);
});

test("domain approvals persist across repository instances with one unique hold per physical copy", async () => {
  const store = new RoomStore(pool), first = newCapability(), second = newCapability();
  const created = await store.create(first, "First");
  const joined = await store.join(created.inviteToken, second, "Second");
  const a = created.view.actor.memberId, b = joined.actor.memberId, roomId = joined.room.id;
  const planned = await store.mutate(roomId, first, view => repairExchanges({ ...view.room, revision: view.room.revision + 1,
    listings: [{ id: "copy-a", bookId: "book-a", ownerId: a, available: true },
      { id: "copy-b", bookId: "book-b", ownerId: b, available: true }],
    shortlists: [{ memberId: a, bookId: "book-b", acceptable: true }, { memberId: b, bookId: "book-a", acceptable: true }],
  }, view.actor, 1000));
  const cycle = planned.room.cycles[0]!;
  await store.mutate(roomId, first, view => acceptCycle(view.room, view.actor, cycle.cycle.id, 1, 1000));
  const final = await store.mutate(roomId, second, view => acceptCycle(view.room, view.actor, cycle.cycle.id, 1, 1000));
  assert.equal(final.room.holds.length, 2);
  const retry = await new RoomStore(pool).mutate(roomId, second, view => acceptCycle(view.room, view.actor, cycle.cycle.id, 1, 1000));
  assert.equal(retry.room.revision, final.room.revision);
  const holds = await db.query<{ count: number }>("SELECT count(*)::integer AS count FROM cultureloop_holds WHERE room_id=$1", [roomId]);
  assert.equal(holds.rows[0]!.count, 2);
});

test("SQL hold uniqueness failures roll back both holds and the room revision", async () => {
  const store = new RoomStore(pool), session = newCapability();
  const { view } = await store.create(session, "Rollback reader");
  const hold = { listingId: "same-copy", cycleId: "cycle", cycleRevision: 1, expiresAt: Date.now() + 10000 };
  await assert.rejects(store.mutate(view.room.id, session, state => ({ ...state.room,
    revision: state.room.revision + 1, holds: [hold, hold] })), /unique|duplicate/i);
  const restored = await store.read(view.room.id, session);
  assert.equal(restored.room.revision, view.room.revision);
  assert.deepEqual(restored.room.holds, []);
  const result = await db.query<{ count: number }>("SELECT count(*)::integer AS count FROM cultureloop_holds WHERE room_id=$1", [view.room.id]);
  assert.equal(result.rows[0]!.count, 0);
});

test("membership in one room does not authorize access to a different room", async () => {
  const store = new RoomStore(pool), a = newCapability(), b = newCapability();
  const first = await store.create(a, "A"), second = await store.create(b, "B");
  await assert.rejects(store.mutate(first.view.room.id, b, view => ({ ...view.room, revision: 99 })), /membership/);
  await assert.rejects(store.read(second.view.room.id, a), /membership/);
});

test("fictional example starts with synthetic ranks and no invented willingness or approvals", async () => {
  const store = new RoomStore(pool), session = newCapability();
  const view = await store.createExample(session);
  assert.equal(view.room.mode, "example");
  assert.equal(view.room.exampleControllerMemberId, view.actor.memberId);
  assert.equal(view.members.length, 3);
  assert.deepEqual(view.room.shortlists, []);
  assert.deepEqual(view.room.cycles, []);
  assert.ok(view.room.preferences.every(p => p.source === "synthetic"));
  assert.ok(view.members.every(m => m.alias.includes("fictional")));
});

test("Qloo cache deduplicates requests and survives a new service instance", async () => {
  let calls = 0;
  const one = "11111111-1111-4111-8111-111111111111";
  const client = new QlooClient({ apiKey: "synthetic-test-key", fetchImpl: async () => {
    calls++;
    return Response.json({ results: [{ entity_id: one, name: "Fictional cache fixture", types: ["urn:entity:book"] }] });
  } });
  const service = new QlooService(pool, client);
  const results = await Promise.all([service.search("fictional cache", "book"), service.search("fictional cache", "book")]);
  assert.equal(calls, 1);
  assert.deepEqual(results[0]!.identities, results[1]!.identities);
  const cached = await new QlooService(pool, client).search("fictional cache", "book");
  assert.equal(cached.origin, "cache");
  assert.equal(calls, 1);
});

test("malformed provider data is not persisted as a successful cache entry", async () => {
  let calls = 0;
  const client = new QlooClient({ apiKey: "synthetic-test-key", fetchImpl: async () => {
    calls++; return Response.json({ incorrect: "synthetic malformed fixture" });
  } });
  const service = new QlooService(pool, client);
  await assert.rejects(service.search("malformed fixture", "book"), /shape/);
  await assert.rejects(service.search("malformed fixture", "book"), /shape/);
  assert.equal(calls, 2); // Explicit separate requests; no automatic retry.
});

test("a partial provider failure leaves room evidence and shortlists unchanged", async () => {
  const store = new RoomStore(pool), first = newCapability(), second = newCapability();
  const created = await store.create(first, "First fixture");
  const joined = await store.join(created.inviteToken, second, "Second fixture");
  const one = "44444444-4444-4444-8444-444444444444";
  const interest = "55555555-5555-4555-8555-555555555555";
  const view = await store.mutate(joined.room.id, first, current => ({ ...current.room,
    revision: current.room.revision + 1,
    listings: [{ id: "fixture-copy", bookId: one, ownerId: current.actor.memberId, available: true }],
    interests: current.room.memberIds.map((memberId, n) => ({ memberId, entityId: n ? one : interest,
      name: "Synthetic interest", type: "urn:entity:book" })),
  }));
  let calls = 0;
  const client = new QlooClient({ apiKey: "synthetic-test-key", fetchImpl: async () => {
    calls++;
    return calls === 1 ? Response.json({ results: { entities: [{ entity_id: one, name: "Synthetic book", subtype: "urn:entity:book" }] } })
      : new Response("private provider failure", { status: 503 });
  } });
  await assert.rejects(new QlooService(pool, client).rank(view.room), /HTTP 503/);
  assert.equal(calls, 2);
  assert.deepEqual((await store.read(view.room.id, first)).room, view.room);
});

test("request limits persist across callers and reject excess requests", async () => {
  await rateLimit(pool, "fixture bucket", 2);
  await rateLimit(pool, "fixture bucket", 2);
  await assert.rejects(rateLimit(pool, "fixture bucket", 2), /Request limit/);
});
