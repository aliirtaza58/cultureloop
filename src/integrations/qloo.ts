export const QLOO_BASE_URL = "https://hackathon.api.qloo.com";
export type SearchType = "book" | "artist" | "movie" | "video_game";

export class QlooError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "QlooError";
    this.status = status;
  }
}

export interface QlooOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
}

/** Small GET-only adapter; returns unmodified data for private feasibility inspection. */
export class QlooClient {
  #key: string;
  #fetch: typeof fetch;
  #timeout: number;

  constructor(options: QlooOptions) {
    if (!options.apiKey.trim()) throw new QlooError("QLOO_API_KEY is not configured.");
    if (options.baseUrl !== undefined && options.baseUrl.replace(/\/$/, "") !== QLOO_BASE_URL) {
      throw new QlooError("Use the approved hackathon Qloo base URL.");
    }
    const timeout = options.timeoutMs ?? 10_000;
    if (!Number.isInteger(timeout) || timeout < 1 || timeout > 30_000) {
      throw new QlooError("Request timeout must be between 1 and 30000 milliseconds.");
    }
    this.#key = options.apiKey.trim();
    this.#fetch = options.fetchImpl ?? fetch;
    this.#timeout = timeout;
  }

  async #get(path: string, params: Record<string, string>): Promise<unknown> {
    const url = new URL(path, QLOO_BASE_URL);
    url.search = new URLSearchParams(params).toString();
    let response: Response;
    try {
      response = await this.#fetch(url, {
        method: "GET",
        headers: { "X-Api-Key": this.#key, Accept: "application/json" },
        signal: AbortSignal.timeout(this.#timeout),
        redirect: "error",
      });
    } catch {
      throw new QlooError("Qloo request failed or timed out; no retry was made.");
    }
    if (!response.ok) throw new QlooError(`Qloo returned HTTP ${response.status}.`, response.status);
    try { return await response.json(); }
    catch { throw new QlooError("Qloo returned an unreadable JSON response."); }
  }

  searchEntities(query: string, type: SearchType): Promise<unknown> {
    if (!query.trim() || query.length > 200) throw new QlooError("Search text must contain 1 to 200 characters.");
    if (!["book", "artist", "movie", "video_game"].includes(type)) throw new QlooError("Unsupported search category.");
    return this.#get("/search", { query: query.trim(), types: `urn:entity:${type}` });
  }

  rankBooks(bookIds: readonly string[], interestIds: readonly string[]): Promise<unknown> {
    function validateIds(ids: readonly string[], max: number): void {
      if (ids.length < 1 || ids.length > max
        || ids.some(id => !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id))) {
        throw new QlooError(`Supply 1 to ${max} confirmed Qloo entity UUIDs.`);
      }
    }
    validateIds(bookIds, 30);
    validateIds(interestIds, 3);
    const catalog = [...new Set(bookIds)];
    return this.#get("/v2/insights", {
      "filter.type": "urn:entity:book",
      "filter.results.entities": catalog.join(","),
      "signal.interests.entities": [...new Set(interestIds)].join(","),
      "feature.explainability": "true",
      take: String(Math.max(20, catalog.length)),
    });
  }
}
