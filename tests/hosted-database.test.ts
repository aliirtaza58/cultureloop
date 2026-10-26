import assert from "node:assert/strict";
import { test } from "node:test";
import { rootCertificates } from "node:tls";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hostedDatabaseOptions } from "../src/server/hosted-database.ts";

const fixture = { DATABASE_URL: "postgresql://fixture:synthetic@db.example.invalid/test?sslmode=require",
  CULTURELOOP_HOSTED_DB_VERIFIED: "true" };
test("hosted settings reject missing, unverified and non-PostgreSQL targets before connecting", async () => {
  await assert.rejects(hostedDatabaseOptions({}), /not configured/);
  await assert.rejects(hostedDatabaseOptions({ ...fixture, CULTURELOOP_HOSTED_DB_VERIFIED: "false" }), /not been verified/);
  await assert.rejects(hostedDatabaseOptions({ ...fixture, DATABASE_URL: "https://example.invalid/database" }), /invalid/);
});
test("explicit TLS verification survives connection-string options and supports inline CA", async () => {
  const ca = rootCertificates[0]!;
  const options = await hostedDatabaseOptions({ ...fixture, DATABASE_SSL_CA: ca.replace(/\n/g, "\\n") });
  assert.deepEqual(options.ssl, { rejectUnauthorized: true, ca });
  assert.equal(new URL(options.connectionString!).searchParams.has("sslmode"), false);
  assert.equal(options.max, 3);
  assert.equal(options.application_name, "cultureloop");
});
test("weak SSL modes and competing driver TLS settings fail closed", async () => {
  for (const mode of ["disable", "allow", "prefer", "no-verify"]) {
    await assert.rejects(hostedDatabaseOptions({ ...fixture, DATABASE_URL: `${fixture.DATABASE_URL.split("?")[0]}?sslmode=${mode}` }), /verified TLS/);
  }
  for (const name of ["ssl", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat"]) {
    await assert.rejects(hostedDatabaseOptions({ ...fixture, DATABASE_URL: `${fixture.DATABASE_URL}&${name}=synthetic` }), /Configure database TLS/);
  }
});
test("Supabase requires its CA; local certificate loading never opens a database", async () => {
  const supabase = { ...fixture, DATABASE_URL: "postgresql://postgres.synthetic:fixture@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" };
  await assert.rejects(hostedDatabaseOptions(supabase), /Supabase database CA/);
  await assert.rejects(hostedDatabaseOptions({ ...fixture, DATABASE_SSL_CA: "not a certificate" }), /invalid or expired/);
  const directory = await mkdtemp(join(tmpdir(), "cultureloop-ca-")), file = join(directory, "ca.crt");
  try {
    await writeFile(file, rootCertificates[0]!);
    const options = await hostedDatabaseOptions({ ...supabase, DATABASE_SSL_CA_FILE: file });
    assert.deepEqual(options.ssl, { rejectUnauthorized: true, ca: rootCertificates[0] });
    await assert.rejects(hostedDatabaseOptions({ ...fixture, DATABASE_SSL_CA: rootCertificates[0], DATABASE_SSL_CA_FILE: file }), /Choose one/);
  } finally { await unlink(file); await rmdir(directory); }
});
