import { readFile } from "node:fs/promises";
import { X509Certificate } from "node:crypto";
import { resolve } from "node:path";
import type { PoolConfig } from "pg";

/** Build connection options without connecting or weakening certificate verification. */
export async function hostedDatabaseOptions(env: Partial<NodeJS.ProcessEnv> = process.env): Promise<PoolConfig> {
  if (!env.DATABASE_URL?.trim()) throw new Error("Hosted PostgreSQL is not configured.");
  if (env.CULTURELOOP_HOSTED_DB_VERIFIED !== "true") throw new Error("Hosted database target/free plan has not been verified.");
  let url: URL;
  try {
    url = new URL(env.DATABASE_URL);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
  } catch { throw new Error("Hosted PostgreSQL URL is invalid."); }

  const mode = url.searchParams.get("sslmode");
  if (mode !== null && !["require", "verify-ca", "verify-full"].includes(mode)) {
    throw new Error("Hosted PostgreSQL requires verified TLS.");
  }
  for (const name of ["ssl", "sslcert", "sslkey", "sslrootcert", "sslpassword", "uselibpqcompat"]) {
    if (url.searchParams.has(name)) throw new Error("Configure database TLS through DATABASE_SSL_CA or DATABASE_SSL_CA_FILE.");
  }
  // pg connection-string SSL parameters replace explicit SSL options. Own the TLS policy here.
  url.searchParams.delete("sslmode");
  const inline = env.DATABASE_SSL_CA?.trim(), file = env.DATABASE_SSL_CA_FILE?.trim();
  if (inline && file) throw new Error("Choose one database CA setting: inline certificate or local file.");
  let ca: string | undefined;
  try { ca = inline?.replace(/\\n/g, "\n") || (file ? await readFile(resolve(file), "utf8") : undefined); }
  catch { throw new Error("Database CA file is unavailable."); }
  if (ca) {
    try {
      const certificate = new X509Certificate(ca);
      if (!certificate.ca || Date.parse(certificate.validTo) <= Date.now()) throw new Error();
    } catch { throw new Error("Database CA certificate is invalid or expired."); }
  }
  if (url.hostname.endsWith(".pooler.supabase.com") && !ca) {
    throw new Error("Configure the Supabase database CA certificate before connecting.");
  }
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    max: 3, connectionTimeoutMillis: 8000, idleTimeoutMillis: 10000, allowExitOnIdle: true,
    application_name: "cultureloop" };
}
