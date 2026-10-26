/** Explicit synthetic workflow against hosted SQL. Cleans up only its newly created room. */
import assert from "node:assert/strict";
import { Pool } from "pg";
import { mkdir, writeFile } from "node:fs/promises";
import { hostedDatabaseOptions } from "../src/server/hosted-database.ts";
import { newCapability, RoomStore } from "../src/server/store.ts";
import type { SqlPool } from "../src/server/store.ts";
import { acceptCycle, repairExchanges } from "../src/domain/exchanges.ts";

async function main() {
  const ref = process.argv[process.argv.indexOf("--project-ref") + 1];
  const url = new URL(process.env.DATABASE_URL!);
  if (!ref || !/^[a-z]{20}$/.test(ref) || url.username !== `postgres.${ref}`) throw new Error("Supply the confirmed project reference.");
  const pg = new Pool(await hostedDatabaseOptions({ ...process.env, CULTURELOOP_HOSTED_DB_VERIFIED: "true" }));
  const pool: SqlPool = { async connect() {
    const client = await pg.connect();
    return { async query<T extends Record<string, unknown>>(sql: string, values?: unknown[]) {
      const result = await client.query<T>(sql, values); return { rows: result.rows, rowCount: result.rowCount };
    }, release: () => client.release() };
  } };
  let roomId: string | undefined;
  try {
    const first = newCapability(), second = newCapability(), store = new RoomStore(pool);
    const created = await store.create(first, "Synthetic SQL reader A"); roomId = created.view.room.id;
    const joined = await store.join(created.inviteToken, second, "Synthetic SQL reader B");
    const a = created.view.actor.memberId, b = joined.actor.memberId, now = Date.now();
    await assert.rejects(store.read(roomId, newCapability()), /membership/);
    const planned = await store.mutate(roomId, first, view => repairExchanges({ ...view.room, revision: view.room.revision + 1,
      listings: [{ id: "synthetic-copy-a", bookId: "synthetic-book-a", ownerId: a, available: true },
        { id: "synthetic-copy-b", bookId: "synthetic-book-b", ownerId: b, available: true }],
      shortlists: [{ memberId: a, bookId: "synthetic-book-b", acceptable: true }, { memberId: b, bookId: "synthetic-book-a", acceptable: true }],
    }, view.actor, now));
    const cycle = planned.room.cycles[0]!;
    assert.ok(cycle);
    await store.mutate(roomId, first, view => acceptCycle(view.room, view.actor, cycle.cycle.id, cycle.revision, now));
    const accept = () => new RoomStore(pool).mutate(roomId!, second, view => acceptCycle(view.room, view.actor, cycle.cycle.id, cycle.revision, now));
    const [one, two] = await Promise.all([accept(), accept()]);
    assert.equal(one.room.revision, two.room.revision);
    assert.equal(one.room.holds.length, 2);
    const count = await pg.query<{ count: number }>("SELECT count(*)::integer AS count FROM cultureloop_holds WHERE room_id=$1", [roomId]);
    assert.equal(count.rows[0]!.count, 2);
    const savedRevision = one.room.revision;
    await assert.rejects(store.mutate(roomId, first, view => ({ ...view.room, revision: view.room.revision + 1,
      holds: [view.room.holds[0]!, view.room.holds[0]!] })), /duplicate|unique/i);
    const restored = await new RoomStore(pool).read(roomId, first);
    assert.equal(restored.room.revision, savedRevision);
    assert.equal(restored.room.holds.length, 2);
    const report = { passed: true, storage: "hosted PostgreSQL", fixture: "synthetic; not Qloo or participant research",
      checks: ["create/join persistence", "membership isolation", "concurrent approval retry", "unique holds", "rollback restores revision/holds"] };
    await mkdir(".private/hosted-verification", { recursive: true });
    await writeFile(".private/hosted-verification/database.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (roomId) await pg.query("DELETE FROM cultureloop_rooms WHERE id=$1", [roomId]);
    await pg.end();
  }
}
main().catch(() => { console.error("Hosted SQL verification failed; no credentials or records are displayed."); process.exitCode = 1; });
