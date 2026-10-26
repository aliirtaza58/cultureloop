import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { newCapability, RoomStore } from "../src/server/store.ts";
import type { SqlPool } from "../src/server/store.ts";
import { atomicMigration } from "../src/server/database-migration.ts";

const migration = await readFile(new URL("../supabase/migrations/20261026225006_private_book_exchange.sql", import.meta.url), "utf8");
const db = await PGlite.create();
after(() => db.close());
await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE public.unrelated_fixture (value integer); INSERT INTO public.unrelated_fixture VALUES (42); GRANT SELECT ON public.unrelated_fixture TO anon;");
await db.query(atomicMigration(migration));
const tables = ["cultureloop_rooms", "cultureloop_memberships", "cultureloop_holds", "cultureloop_qloo_cache", "cultureloop_rate_limits"];

test("all app tables enable RLS and browser roles cannot reach private records", async () => {
  const protectedTables = await db.query<{ relname: string }>("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relrowsecurity");
  assert.deepEqual(protectedTables.rows.map(row => row.relname).sort(), [...tables].sort());
  for (const role of ["anon", "authenticated", "service_role"]) {
    await db.exec(`SET ROLE ${role}`);
    try { for (const table of tables) await assert.rejects(db.query(`SELECT * FROM public.${table}`), /permission denied/); }
    finally { await db.exec("RESET ROLE"); }
  }
});
test("the migration preserves access and data in unrelated tables", async () => {
  await db.exec("SET ROLE anon");
  try { assert.equal((await db.query<{ value: number }>("SELECT value FROM public.unrelated_fixture")).rows[0]!.value, 42); }
  finally { await db.exec("RESET ROLE"); }
});
test("the owning server role still persists authorized rooms across repeat migration", async () => {
  const pool: SqlPool = { async connect() { return { async query<T extends Record<string, unknown>>(sql: string, values?: unknown[]) {
    const result = await db.query<T>(sql, values); return { rows: result.rows, rowCount: result.affectedRows };
  }, release() {} }; } };
  const owner = newCapability(), store = new RoomStore(pool);
  const created = await store.create(owner, "Synthetic migration reader");
  await db.query(atomicMigration(migration));
  assert.equal((await store.read(created.view.room.id, owner)).room.id, created.view.room.id);
  await assert.rejects(store.read(created.view.room.id, newCapability()), /membership/);
});
test("a failing prepared schema block rolls back its earlier DDL", async () => {
  await assert.rejects(db.query(atomicMigration("CREATE TABLE public.rollback_fixture (value integer); RAISE EXCEPTION 'synthetic migration failure';")), /synthetic migration failure/);
  const found = await db.query<{ present: string | null }>("SELECT to_regclass('public.rollback_fixture')::text AS present");
  assert.equal(found.rows[0]!.present, null);
});
