import assert from "node:assert/strict";
import { test } from "node:test";
import { assistantConfiguration, googlePrototypeModel } from "../src/server/assistant-configuration.ts";
import { resolveAgentModel } from "../agent/lib/model.ts";

const names = ["CULTURELOOP_MODEL_PROVIDER", "CULTURELOOP_FREE_AI_VERIFIED", "GOOGLE_GENERATIVE_AI_API_KEY",
  "GOOGLE_MODEL", "AI_GATEWAY_API_KEY", "AI_GATEWAY_MODEL", "VERCEL_OIDC_TOKEN"] as const;
function withEnvironment(values: Record<string, string>, run: () => void) {
  const before = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    Object.assign(process.env, values);
    run();
  } finally {
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name];
    }
  }
}
const googleFixture = { CULTURELOOP_MODEL_PROVIDER: "google", CULTURELOOP_FREE_AI_VERIFIED: "true",
  GOOGLE_MODEL: googlePrototypeModel, GOOGLE_GENERATIVE_AI_API_KEY: "synthetic-google-key-no-inference" };

test("Google selection needs its own credentials and never borrows Gateway access", () => {
  withEnvironment({ ...googleFixture, GOOGLE_GENERATIVE_AI_API_KEY: "", AI_GATEWAY_API_KEY: "synthetic-gateway" }, () => {
    assert.throws(assistantConfiguration, /not configured/);
  });
  withEnvironment({ ...googleFixture, CULTURELOOP_FREE_AI_VERIFIED: "false" }, () => {
    assert.throws(resolveAgentModel, /waiting for verified free/);
  });
  withEnvironment({ ...googleFixture, GOOGLE_MODEL: "unverified-paid-model" }, () => {
    assert.throws(resolveAgentModel, /not been verified/);
  });
});
test("Google uses a direct provider object and reevaluates the gate on the next step", () => {
  withEnvironment(googleFixture, () => {
    const selection = resolveAgentModel();
    assert.equal(typeof selection, "object");
    if (typeof selection === "string") throw new Error("Expected direct Google provider.");
    assert.equal(selection.model.provider, "google.generative-ai");
    assert.equal(selection.model.modelId, googlePrototypeModel);
    assert.equal(selection.modelContextWindowTokens, 1_048_576);
    process.env.CULTURELOOP_FREE_AI_VERIFIED = "false";
    assert.throws(resolveAgentModel, /waiting for verified free/);
  });
});
test("unknown providers fail closed and Gateway remains an explicit independent option", () => {
  withEnvironment({ ...googleFixture, CULTURELOOP_MODEL_PROVIDER: "openrouter" }, () => {
    assert.throws(assistantConfiguration, /Unsupported/);
  });
  withEnvironment({ ...googleFixture, CULTURELOOP_MODEL_PROVIDER: "gateway" }, () => {
    assert.throws(assistantConfiguration, /not configured/);
    process.env.AI_GATEWAY_MODEL = "synthetic/no-inference";
    process.env.AI_GATEWAY_API_KEY = "synthetic-gateway-key";
    assert.equal(resolveAgentModel(), "synthetic/no-inference");
  });
});

test("direct Google requests cap output tokens, keep the key in a header and do not fall back", async () => {
  const before = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    Object.assign(process.env, googleFixture);
    let calls = 0;
    const selection = resolveAgentModel(async (input, init) => {
      calls++;
      const url = String(input);
      assert.ok(url.startsWith("https://generativelanguage.googleapis.com/v1beta/models/"));
      assert.ok(!url.includes(googleFixture.GOOGLE_GENERATIVE_AI_API_KEY));
      assert.equal(new Headers(init?.headers).get("x-goog-api-key"), googleFixture.GOOGLE_GENERATIVE_AI_API_KEY);
      const request = JSON.parse(String(init?.body));
      assert.equal(request.generationConfig.maxOutputTokens, 512);
      return new Response(JSON.stringify({ error: { code: 429, message: "Synthetic free quota exhausted", status: "RESOURCE_EXHAUSTED" } }),
        { status: 429, headers: { "content-type": "application/json" } });
    });
    if (typeof selection === "string") throw new Error("Expected Google provider.");
    await assert.rejects(Promise.resolve(selection.model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: "Synthetic transport check" }] }], maxOutputTokens: 50_000,
    })));
    assert.equal(calls, 1);
  } finally {
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name];
    }
  }
});
