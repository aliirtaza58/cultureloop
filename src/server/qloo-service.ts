import { createHash, randomUUID } from "node:crypto";
import { QlooClient } from "../integrations/qloo.ts";
import type { SearchType } from "../integrations/qloo.ts";
import { catalogRanking, searchIdentities } from "../integrations/qloo-results.ts";
import type { SqlPool } from "./store.ts";
import type { ExchangeRoom } from "../domain/exchanges.ts";
import type { Preference } from "../domain/matching.ts";

export function rankingInputs(room: ExchangeRoom): string {
  return JSON.stringify({ catalog: [...new Set(room.listings.filter(l => l.available).map(l => l.bookId))].sort(),
    interests: (room.interests ?? []).map(i => [i.memberId, i.entityId]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) });
}
interface Capture { data: unknown; retrievedAt: string; origin: "live" | "cache" }
export class QlooService {
  readonly #pool: SqlPool;
  readonly #client: QlooClient;
  readonly #inflight = new Map<string, Promise<Capture>>();
  constructor(pool: SqlPool, client: QlooClient) { this.#pool = pool; this.#client = client; }
  async #capture(inputs: unknown, operation: () => Promise<unknown>): Promise<Capture> {
    const key = createHash("sha256").update(JSON.stringify(["qloo-hackathon-v1", inputs])).digest("hex");
    const shared = this.#inflight.get(key);
    if (shared) return shared;
    const pending = (async () => {
      const connection = await this.#pool.connect();
      try {
        // Dedicated cache lock prevents duplicate provider calls across server instances.
        // It does not lock a room while waiting on Qloo.
        await connection.query("BEGIN");
        await connection.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [key]);
        const existing = await connection.query<{ payload: unknown; retrieved_at: Date | string }>(
          "SELECT payload,retrieved_at FROM cultureloop_qloo_cache WHERE cache_key=$1", [key]);
        const cached = existing.rows[0];
        if (cached) {
          await connection.query("COMMIT");
          return { data: cached.payload, retrievedAt: new Date(cached.retrieved_at).toISOString(), origin: "cache" as const };
        }
        const data = await operation(), retrievedAt = new Date().toISOString();
        await connection.query("INSERT INTO cultureloop_qloo_cache(cache_key,payload,retrieved_at) VALUES($1,$2::jsonb,$3)",
          [key, JSON.stringify(data), retrievedAt]);
        await connection.query("COMMIT");
        return { data, retrievedAt, origin: "live" as const };
      } catch (error) { await connection.query("ROLLBACK"); throw error; }
      finally { connection.release(); }
    })();
    this.#inflight.set(key, pending);
    try { return await pending; } finally { this.#inflight.delete(key); }
  }
  async search(query: string, type: SearchType) {
    const capture = await this.#capture(["search", type, query.trim()], async () => {
      const data = await this.#client.searchEntities(query, type);
      searchIdentities(data, `urn:entity:${type}`);
      return data;
    });
    return { identities: searchIdentities(capture.data, `urn:entity:${type}`).slice(0, 10), origin: capture.origin };
  }
  async rank(room: ExchangeRoom) {
    const ids = [...new Set(room.listings.filter(l => l.available).map(l => l.bookId))];
    if (!ids.length) throw new Error("Offer books before ranking the room.");
    const evidence: Preference[] = [];
    const snapshots: NonNullable<ExchangeRoom["evidenceSnapshots"]>[number][] = [];
    // Sequential, one bounded catalog request per member with confirmed interests.
    for (const memberId of room.memberIds) {
      const interests = (room.interests ?? []).filter(i => i.memberId === memberId).map(i => i.entityId);
      if (!interests.length) continue;
      const capture = await this.#capture(["rank", [...ids].sort(), [...interests].sort()], async () => {
        const data = await this.#client.rankBooks(ids, interests);
        catalogRanking(data, ids);
        return data;
      });
      const ranking = catalogRanking(capture.data, ids), id = randomUUID();
      evidence.push(...ranking.entries.map(e => ({ memberId, bookId: e.bookId, source: "qloo" as const,
        rank: e.rank, catalogSize: e.catalogSize, snapshotId: id })));
      snapshots.push({ id, memberId, catalogIds: ids, interestIds: interests, retrievedAt: capture.retrievedAt,
        origin: capture.origin, explanationStatus: ranking.explanationStatus, missingBookIds: ranking.missingBookIds });
    }
    if (!snapshots.length) throw new Error("Confirm cultural interests before requesting Qloo rankings.");
    return { evidence, snapshots, inputs: rankingInputs(room) };
  }
}
