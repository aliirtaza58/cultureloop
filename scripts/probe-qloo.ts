import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { QlooClient } from "../src/integrations/qloo.ts";
import type { SearchType } from "../src/integrations/qloo.ts";

const usage = `Qloo feasibility probe: one request, no automatic retries.
  npm run qloo:probe -- search book "The Hobbit"
  npm run qloo:probe -- search artist "Artist name"
  npm run qloo:probe -- rank <comma-separated-book-UUIDs> <comma-separated-interest-UUIDs>
Configure QLOO_API_KEY in ignored .env.local. Responses stay under .private/qloo-probes/.`;

async function main(): Promise<void> {
  const [mode, first, second, ...extra] = process.argv.slice(2);
  if (mode === "--help" || mode === "-h") { console.log(usage); return; }
  if (!first || !second || extra.length || !["search", "rank"].includes(mode ?? "")) {
    throw new Error(usage);
  }
  const client = new QlooClient({ apiKey: process.env.QLOO_API_KEY ?? "",
    baseUrl: process.env.QLOO_BASE_URL });
  const result = mode === "search"
    ? await client.searchEntities(second, first as SearchType)
    : await client.rankBooks(first.split(","), second.split(","));
  const folder = join(process.cwd(), ".private", "qloo-probes");
  await mkdir(folder, { recursive: true });
  const output = join(folder, `${Date.now()}-${mode}.json`);
  await writeFile(output, JSON.stringify({ mode, inputs: [first, second],
    retrievedAt: new Date().toISOString(), data: result }, null, 2), { flag: "wx" });
  console.log(`Saved one private Qloo response to ${output}`);
  console.log("Inspect canonical IDs, coverage, ranking fields, and explanation warnings before integrating.");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : "Probe failed.");
  process.exitCode = 1;
});
