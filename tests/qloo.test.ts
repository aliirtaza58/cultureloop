import assert from "node:assert/strict";
import { test } from "node:test";
import { QlooClient } from "../src/integrations/qloo.ts";

const placeholderKey = "synthetic-unit-test-key";
const bookId = "11111111-1111-4111-8111-111111111111";
const interestId = "22222222-2222-4222-8222-222222222222";

test("lookup uses the hackathon host, GET, proper type, and header-only auth", async () => {
  const fakeFetch: typeof fetch = async (input, options) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://hackathon.api.qloo.com");
    assert.equal(url.pathname, "/search");
    assert.equal(url.searchParams.get("query"), "A title & sequel");
    assert.equal(url.searchParams.get("types"), "urn:entity:book");
    assert.equal(options?.method, "GET");
    assert.equal(new Headers(options?.headers).get("X-Api-Key"), placeholderKey);
    assert.equal(url.toString().includes(placeholderKey), false);
    assert.equal(options?.redirect, "error");
    assert.ok(options?.signal instanceof AbortSignal);
    return Response.json({ results: [] });
  };
  assert.deepEqual(await new QlooClient({ apiKey: placeholderKey, fetchImpl: fakeFetch })
    .searchEntities("A title & sequel", "book"), { results: [] });
});

test("fixed-catalog ranking uses confirmed IDs, deduplicates them, and requests explanations", async () => {
  let requests = 0;
  const fakeFetch: typeof fetch = async input => {
    requests++;
    const url = new URL(String(input));
    assert.equal(url.pathname, "/v2/insights");
    assert.equal(url.searchParams.get("filter.type"), "urn:entity:book");
    assert.equal(url.searchParams.get("filter.results.entities"), bookId);
    assert.equal(url.searchParams.get("signal.interests.entities"), interestId);
    assert.equal(url.searchParams.get("feature.explainability"), "true");
    return Response.json({ results: { entities: [] } });
  };
  await new QlooClient({ apiKey: placeholderKey, fetchImpl: fakeFetch })
    .rankBooks([bookId, bookId], [interestId]);
  assert.equal(requests, 1);
});

test("refuses missing keys, other hosts, oversized inputs, and fabricated IDs", () => {
  assert.throws(() => new QlooClient({ apiKey: " " }), /not configured/);
  assert.throws(() => new QlooClient({ apiKey: placeholderKey, baseUrl: "https://example.com" }), /approved/);
  const client = new QlooClient({ apiKey: placeholderKey });
  assert.throws(() => client.rankBooks(["not-a-confirmed-UUID"], [interestId]), /confirmed/);
  assert.throws(() => client.rankBooks(Array(31).fill(bookId), [interestId]), /1 to 30/);
  assert.throws(() => client.rankBooks([bookId], Array(4).fill(interestId)), /1 to 3/);
  assert.throws(() => client.searchEntities(" ", "book"), /characters/);
});

test("HTTP errors expose status without echoing untrusted response content or retrying", async () => {
  let requests = 0;
  const fakeFetch: typeof fetch = async () => {
    requests++;
    return new Response(`untrusted content ${placeholderKey}`, { status: 429 });
  };
  await assert.rejects(new QlooClient({ apiKey: placeholderKey, fetchImpl: fakeFetch })
    .searchEntities("Book", "book"), (error: unknown) => {
    assert.equal((error as Error).message, "Qloo returned HTTP 429.");
    return true;
  });
  assert.equal(requests, 1);
});

test("transport failures are sanitized and do not silently fall back", async () => {
  let requests = 0;
  const fakeFetch: typeof fetch = async () => { requests++; throw new Error(placeholderKey); };
  await assert.rejects(new QlooClient({ apiKey: placeholderKey, fetchImpl: fakeFetch })
    .searchEntities("Book", "book"), /failed or timed out/);
  assert.equal(requests, 1);
});
