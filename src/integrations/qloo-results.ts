/** Validated projections of Qloo responses; never use captured data as public fixtures. */
export interface QlooIdentity {
  readonly id: string;
  readonly name: string;
  readonly types: readonly string[];
}

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}
function identity(value: unknown): QlooIdentity {
  const item = record(value);
  const types = Array.isArray(item?.types) ? item.types
    : typeof item?.subtype === "string" ? [item.subtype]
    : typeof item?.type === "string" ? [item.type] : undefined;
  if (!item || typeof item.entity_id !== "string" || !UUID.test(item.entity_id)
    || typeof item.name !== "string" || !item.name.trim() || !types
    || !types.every(type => typeof type === "string")) {
    throw new Error("Qloo returned an invalid entity identity.");
  }
  return { id: item.entity_id.toLowerCase(), name: item.name, types: types as string[] };
}

export function searchIdentities(response: unknown, requiredType: string): QlooIdentity[] {
  const result = record(response)?.results;
  if (!Array.isArray(result)) throw new Error("Unexpected Qloo search response shape.");
  return result.map(identity).filter(item => item.types.includes(requiredType));
}

export interface CatalogRanking {
  readonly entries: readonly { bookId: string; rank: number; catalogSize: number }[];
  readonly missingBookIds: readonly string[];
  readonly explanationStatus: "available" | "warning" | "unavailable";
}

/** Preserve result order within this exact catalog. Missing books remain unknown. */
export function catalogRanking(response: unknown, requestedBookIds: readonly string[]): CatalogRanking {
  const body = record(response);
  const rows = record(body?.results)?.entities;
  if (!Array.isArray(rows)) throw new Error("Unexpected Qloo ranking response shape.");
  const catalog = new Set(requestedBookIds.map(id => id.toLowerCase()));
  const seen = new Set<string>();
  const entries = rows.map((row, index) => {
    const item = identity(row);
    if (!item.types.includes("urn:entity:book") || !catalog.has(item.id) || seen.has(item.id)) {
      throw new Error("Qloo ranking escaped the fixed catalog or repeated a book.");
    }
    seen.add(item.id);
    return { bookId: item.id, rank: index + 1, catalogSize: catalog.size };
  });
  const explanations = [record(body?.query)?.explainability,
    ...rows.map(row => record(record(row)?.query)?.explainability)].filter(value => value !== undefined);
  const warning = explanations.some(value => record(value)?.warning !== undefined);
  return { entries, missingBookIds: [...catalog].filter(id => !seen.has(id)),
    explanationStatus: warning ? "warning" : explanations.length ? "available" : "unavailable" };
}
