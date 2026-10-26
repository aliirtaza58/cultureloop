/** Administrative bootstrap. Requires an explicit project ref; never prints connection values. */
import { Pool } from "pg";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { hostedDatabaseOptions } from "../src/server/hosted-database.ts";
import { atomicMigration } from "../src/server/database-migration.ts";

const tables = ["cultureloop_rooms", "cultureloop_memberships", "cultureloop_holds", "cultureloop_qloo_cache", "cultureloop_rate_limits"];
const migration = "supabase/migrations/20261026225006_private_book_exchange.sql";
async function inspect(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const unrelated = await client.query<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> ALL($1::text[])", [tables]);
    if (unrelated.rows.length) throw new Error("Target contains unrelated tables; schema setup stopped.");
    const state = await client.query<{ relname: string; relrowsecurity: boolean }>(
      "SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname=ANY($1::text[])", [tables]);
    const grants = await client.query<{ role: string; table_name: string; allowed: boolean }>(
      "SELECT r.rolname AS role, c.relname AS table_name, has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS allowed FROM pg_roles r CROSS JOIN pg_class c WHERE r.rolname IN ('anon','authenticated','service_role') AND c.relnamespace='public'::regnamespace AND c.relname=ANY($1::text[])", [tables]);
    await client.query("ROLLBACK");
    return { tables: state.rows.length, rlsTables: state.rows.filter(row => row.relrowsecurity).length,
      browserGrants: grants.rows.filter(row => row.allowed).length };
  } finally { client.release(); }
}
async function main() {
  const index = process.argv.indexOf("--project-ref"), ref = process.argv[index + 1];
  if (index < 0 || !ref || !/^[a-z]{20}$/.test(ref)) throw new Error("Supply the confirmed Free project's --project-ref.");
  const url = new URL(process.env.DATABASE_URL!);
  if (url.username !== `postgres.${ref}` || !url.hostname.endsWith(".pooler.supabase.com")) throw new Error("Database target does not match the confirmed project.");
  for (const key of ["host", "user", "password", "port", "database"]) if (url.searchParams.has(key)) throw new Error("Connection URL contains conflicting target settings.");
  // Bootstrap verifies the schema before the application opt-in can be enabled.
  const settings = await hostedDatabaseOptions({ ...process.env, CULTURELOOP_HOSTED_DB_VERIFIED: "true" });
  const pool = new Pool(settings);
  try {
    const before = await inspect(pool);
    if (process.argv.includes("--apply")) {
      const npm = process.env.npm_execpath;
      if (!npm) throw new Error("Run this setup through npm run db:setup.");
      await mkdir(".private", { recursive: true });
      const file = resolve(".private/schema-setup.sql");
      await writeFile(file, atomicMigration(await readFile(migration, "utf8")));
      const password = decodeURIComponent(url.password); url.password = "";
      url.searchParams.set("sslmode", "verify-full");
      let caFile = process.env.DATABASE_SSL_CA_FILE;
      if (!caFile) {
        caFile = ".private/schema-setup-ca.crt";
        const ssl = settings.ssl;
        if (!ssl || typeof ssl !== "object" || typeof ssl.ca !== "string") throw new Error("Database CA is required for schema setup.");
        await writeFile(caFile, ssl.ca);
      }
      url.searchParams.set("sslrootcert", resolve(caFile));
      const env = { ...process.env, PGPASSWORD: password, SUPABASE_DB_PASSWORD: password };
      for (const name of ["QLOO_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "AI_GATEWAY_API_KEY", "SESSION_SECRET", "DATABASE_URL", "DATABASE_SSL_CA"]) delete env[name as keyof typeof env];
      const child = spawn(process.execPath, [npm, "exec", "--yes", "--package=supabase@2.122.0", "--", "supabase", "db", "query", "--db-url", url.toString(), "--file", file],
        { env, stdio: ["ignore", "pipe", "pipe"] });
      let diagnostics = "";
      child.stdout.on("data", chunk => { diagnostics += chunk; });
      child.stderr.on("data", chunk => { diagnostics += chunk; });
      const code = await new Promise<number>(done => { child.on("error", () => done(1)); child.on("close", value => done(value ?? 1)); });
      if (code !== 0) {
        await writeFile(".private/schema-setup-error.log", diagnostics.split(password).join("[redacted]"));
        throw new Error("Supabase schema command failed; diagnostics retained privately.");
      }
    }
    const after = await inspect(pool);
    const secured = after.tables === tables.length && after.rlsTables === tables.length && after.browserGrants === 0;
    console.log(JSON.stringify({ connected: true, applied: process.argv.includes("--apply"), before, after, secured,
      note: "Schema/access only. Application transactions and hosted runtime remain separate checks." }, null, 2));
    if (process.argv.includes("--apply") && !secured) process.exitCode = 1;
  } finally { await pool.end(); }
}
main().catch(() => {
  console.error("Database setup failed. Verify the confirmed project, CA, credentials and private diagnostics; no values are displayed.");
  process.exitCode = 1;
});
