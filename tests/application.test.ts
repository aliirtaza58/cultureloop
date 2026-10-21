import assert from "node:assert/strict";
import { test } from "node:test";
import { body, failure, privateJson, requireSession } from "../src/server/application.ts";
import { newCapability } from "../src/server/store.ts";

test("mutations reject cross-origin requests and oversized bodies without trusting content length", async () => {
  const make = (origin: string, value: string) => new Request("https://cultureloop.test/api/rooms", {
    method: "POST", headers: { origin, "content-type": "application/json" }, body: value,
  });
  await assert.rejects(body(make("https://other.test", "{}")), /own page/);
  await assert.rejects(body(make("https://cultureloop.test", JSON.stringify({ value: "x".repeat(16000) }))), /too large/);
  assert.deepEqual(await body(make("https://cultureloop.test", '{"type":"example"}')), { type: "example" });
});

test("session cookies require a private capability and responses prohibit caching", () => {
  const session = newCapability();
  assert.equal(requireSession(new Request("https://cultureloop.test", { headers: { cookie: `cultureloop_guest=${session}` } })), session);
  assert.throws(() => requireSession(new Request("https://cultureloop.test?memberId=someone")), /membership/);
  const response = privateJson({ ok: true }, 200, session);
  assert.match(response.headers.get("set-cookie")!, /HttpOnly; SameSite=Lax/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("explicit app origin handles server hostname normalization without allowing another origin", async () => {
  const previous = process.env.CULTURELOOP_APP_ORIGIN;
  process.env.CULTURELOOP_APP_ORIGIN = "http://127.0.0.1:3017";
  try {
    const request = (origin: string) => new Request("http://localhost:3017/api/rooms", {
      method: "POST", headers: { origin, "content-type": "application/json" }, body: "{}",
    });
    assert.deepEqual(await body(request("http://127.0.0.1:3017")), {});
    await assert.rejects(body(request("http://127.0.0.1:3000")), /own page/);
    await assert.rejects(body(request("https://other.test")), /own page/);
    await assert.rejects(body(request("null")), /own page/);
  } finally {
    if (previous === undefined) delete process.env.CULTURELOOP_APP_ORIGIN;
    else process.env.CULTURELOOP_APP_ORIGIN = previous;
  }
});

test("untrusted driver errors do not expose private connection details", async () => {
  const original = console.error;
  const logs: unknown[][] = [];
  console.error = (...values: unknown[]) => { logs.push(values); };
  try {
    const response = failure(new Error("connection failed for postgres://private-password@private-host"));
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private-password|private-host/);
    assert.doesNotMatch(JSON.stringify(logs), /private-password|private-host/);
  } finally { console.error = original; }
});
