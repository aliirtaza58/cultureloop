import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import type { SqlConnection, SqlPool } from "./store.ts";

const runtime = globalThis as typeof globalThis & { cultureloopDatabase?: Promise<SqlPool> };

/** Embedded mode is a persistent local prototype, never a hosted-production fallback. */
export function database(): Promise<SqlPool> {
  runtime.cultureloopDatabase ??= initialize();
  return runtime.cultureloopDatabase;
}
async function initialize(): Promise<SqlPool> {
  if (process.env.CULTURELOOP_LOCAL_PROTOTYPE === "true") {
    if (process.env.VERCEL) throw new Error("Embedded prototype storage cannot run on the hosted service.");
    const { PGlite } = await import("@electric-sql/pglite");
    // Bundlers can relocate the library without copying its WASM/data assets.
    // Embedded mode runs from an installed local workspace; resolve assets explicitly.
    const assets = resolve(process.cwd(), "node_modules", "@electric-sql", "pglite", "dist");
    const [bundle, wasm, initdb] = await Promise.all([
      readFile(resolve(assets, "pglite.data")), readFile(resolve(assets, "pglite.wasm")), readFile(resolve(assets, "initdb.wasm")),
    ]);
    const db = await PGlite.create(resolve(process.cwd(), ".private", "prototype-db"), {
      fsBundle: new Blob([Uint8Array.from(bundle)]),
      pgliteWasmModule: await WebAssembly.compile(Uint8Array.from(wasm)),
      initdbWasmModule: await WebAssembly.compile(Uint8Array.from(initdb)),
    });
    await db.exec(await readFile(resolve(process.cwd(), "db", "001_rooms.sql"), "utf8"));
    // One embedded connection: keep whole transactions serialized, not individual statements.
    let tail = Promise.resolve();
    return { async connect(): Promise<SqlConnection> {
      const previous = tail;
      let unlock!: () => void;
      tail = new Promise<void>(done => { unlock = done; });
      await previous;
      return {
        async query<T extends Record<string, unknown>>(sql: string, values?: unknown[]) {
          const result = await db.query<T>(sql, values);
          return { rows: result.rows, rowCount: result.affectedRows };
        }, release: unlock,
      };
    } };
  }
  if (!process.env.DATABASE_URL) throw new Error("Hosted PostgreSQL is not configured.");
  // The hosted target/plan must be verified during setup before this opt-in is enabled.
  if (process.env.CULTURELOOP_HOSTED_DB_VERIFIED !== "true") throw new Error("Hosted database target/free plan has not been verified.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3,
    connectionTimeoutMillis: 8000, idleTimeoutMillis: 10000, allowExitOnIdle: true,
    application_name: "cultureloop" });
  return { async connect() {
    const client = await pool.connect();
    return { async query<T extends Record<string, unknown>>(sql: string, values?: unknown[]) {
      const result = await client.query<T>(sql, values);
      return { rows: result.rows, rowCount: result.rowCount };
    }, release: () => client.release() };
  } };
}
