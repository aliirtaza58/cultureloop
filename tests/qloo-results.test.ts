import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogRanking, searchIdentities } from "../src/integrations/qloo-results.ts";

const one = "11111111-1111-4111-8111-111111111111";
const two = "22222222-2222-4222-8222-222222222222";
const three = "33333333-3333-4333-8333-333333333333";
const entity = (entity_id: string) => ({ entity_id, name: "Independently authored test book",
  type: "urn:entity", subtype: "urn:entity:book" });

test("normalizes search type arrays and upper-case entity IDs", () => {
  assert.equal(searchIdentities({ results: [{ entity_id: one.toUpperCase(), name: "Fictional fixture",
    types: ["urn:entity:book"] }] }, "urn:entity:book")[0]!.id, one);
  assert.throws(() => searchIdentities({ results: {} }, "urn:entity:book"), /shape/);
  assert.throws(() => searchIdentities({ results: [{ entity_id: "made-up", name: "Bad", types: [] }] }, "urn:entity:book"), /identity/);
});

test("normalizes Insights generic type plus book subtype without inventing absent evidence", () => {
  const result = catalogRanking({ results: { entities: [entity(two), entity(one)] } }, [one, two, three]);
  assert.deepEqual(result.entries, [{ bookId: two, rank: 1, catalogSize: 3 }, { bookId: one, rank: 2, catalogSize: 3 }]);
  assert.deepEqual(result.missingBookIds, [three]);
  assert.equal(result.explanationStatus, "unavailable");
});

test("rejects out-of-catalog, duplicate, wrong-type and malformed ranking results", () => {
  for (const entities of [[entity(two)], [entity(one), entity(one)],
    [{ ...entity(one), subtype: "urn:entity:movie" }]]) {
    assert.throws(() => catalogRanking({ results: { entities } }, [one]), /catalog/);
  }
  assert.throws(() => catalogRanking({}, [one]), /shape/);
});

test("records explanation availability and warnings without manufacturing a causal explanation", () => {
  const body = { results: { entities: [entity(one)] }, query: { explainability: { warning: "Fixture warning" } } };
  assert.equal(catalogRanking(body, [one]).explanationStatus, "warning");
  assert.equal(catalogRanking({ ...body, query: { explainability: { inputs: [] } } }, [one]).explanationStatus, "available");
});
