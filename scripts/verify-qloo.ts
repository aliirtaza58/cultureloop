import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { QlooClient } from "../src/integrations/qloo.ts";
import { catalogRanking, searchIdentities } from "../src/integrations/qloo-results.ts";
import type { SearchType } from "../src/integrations/qloo.ts";

// Independently chosen research inputs, not inventory or participant preferences.
const candidates = ["The Hobbit", "Dune", "1984", "To Kill a Mockingbird", "Pride and Prejudice",
  "The Great Gatsby", "The Catcher in the Rye", "The Alchemist", "The Book Thief", "The Hunger Games",
  "The Little Prince", "The Kite Runner", "The Handmaid's Tale", "Brave New World", "The Martian",
  "The Fault in Our Stars", "Atomic Habits", "Educated", "Sapiens: A Brief History of Humankind",
  "The Night Circus", "Frankenstein", "Jane Eyre", "The Road", "Life of Pi"];
const profileSeeds = ["Spirited Away", "The Matrix", "Pride & Prejudice", "Interstellar", "The Godfather"];
const directory = ".private/qloo-feasibility";
const client = new QlooClient({ apiKey: process.env.QLOO_API_KEY ?? "", baseUrl: process.env.QLOO_BASE_URL });
let liveRequests = 0;
let cacheHits = 0;
const timings: number[] = [];
let reviewedSelections: Record<string, string> = {};

async function capture(key: unknown, request: () => Promise<unknown>): Promise<unknown> {
  const path = `${directory}/${createHash("sha256").update(JSON.stringify(key)).digest("hex")}.json`;
  try {
    const saved = JSON.parse(await readFile(path, "utf8")) as { data: unknown };
    cacheHits++;
    return saved.data;
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
  }
  if (liveRequests >= 35) throw new Error("Feasibility request budget reached; no further call made.");
  liveRequests++;
  const started = performance.now();
  const data = await request();
  timings.push(Math.round(performance.now() - started));
  await writeFile(path, JSON.stringify({ retrievedAt: new Date().toISOString(), inputs: key, data }, null, 2), { flag: "wx" });
  return data;
}
async function resolve(query: string, type: SearchType) {
  const raw = await capture(["search", type, query], () => client.searchEntities(query, type));
  const matches = searchIdentities(raw, `urn:entity:${type}`);
  const normalize = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const exact = matches.filter(item => normalize(item.name) === normalize(query));
  const reviewed = reviewedSelections[query];
  const selected = reviewed ? matches.find(item => item.id === reviewed.toLowerCase())
    : exact.length === 1 ? exact[0] : undefined;
  if (reviewed && !selected) throw new Error("A reviewed identity is absent from the saved search results.");
  // Never silently choose between ambiguous entities. Review candidates privately.
  return { query, candidates: matches.map(item => ({ id: item.id, name: item.name })),
    selected, requiresReview: !selected,
    selection: reviewed ? "privately reviewed research identity; not participant confirmation"
      : "research exact-name match; not participant confirmation" };
}

async function main() {
  await mkdir(directory, { recursive: true });
  try { reviewedSelections = JSON.parse(await readFile(`${directory}/selections.json`, "utf8")) as Record<string, string>; }
  catch (error) { if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error; }
  const books = [];
  for (const title of candidates) books.push(await resolve(title, "book"));
  const profiles = [];
  for (const seed of profileSeeds) profiles.push(await resolve(seed, "movie"));
  const ids = [...new Set(books.flatMap(book => book.selected ? [book.selected.id] : []))];
  const rankings = [];
  for (const profile of profiles) {
    if (!profile.selected || ids.length === 0) continue;
    const raw = await capture(["rank", ids, profile.selected.id], () => client.rankBooks(ids, [profile.selected!.id]));
    const ranking = catalogRanking(raw, ids);
    rankings.push({ profile: profile.query, ...ranking });
  }
  const distinctOrders = new Set(rankings.filter(r => r.entries.length).map(r => JSON.stringify(r.entries.map(e => e.bookId)))).size;
  const observations = { retrievedAt: new Date().toISOString(), source: "live Qloo or private captured Qloo cache",
    fictionalProfiles: true, physicalInventory: false, liveRequests, cacheHits, timingsMs: timings,
    candidateCount: candidates.length, resolvedBooks: ids.length, distinctProfiles: rankings.length,
    distinctOrders, rankings, books, profiles,
    identityTargetReached: ids.length >= 20,
    gate: rankings.length === 5 && rankings.every(r => r.entries.length > 0) && distinctOrders > 1
      ? "live evidence available for review; human usefulness unverified" : "needs coverage/variation review" };
  await writeFile(`${directory}/report.json`, JSON.stringify(observations, null, 2));
  console.log(JSON.stringify({ resolvedBooks: ids.length, profilesRanked: rankings.length, distinctOrders,
    liveRequests, cacheHits, returnedCounts: rankings.map(r => r.entries.length),
    explanationStatuses: rankings.map(r => r.explanationStatus), report: `${directory}/report.json`, gate: observations.gate }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Feasibility check failed."); process.exitCode = 1; });
