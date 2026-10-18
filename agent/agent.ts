import { defineAgent } from "eve";

const model = process.env.AI_GATEWAY_MODEL?.trim();
if (!model) {
  throw new Error("Set AI_GATEWAY_MODEL to an account-verified free-tier tool-capable model before running the agent.");
}

export default defineAgent({
  model,
  defaultTools: false,
  limits: {
    maxInputTokensPerSession: 10_000,
    maxOutputTokensPerSession: 2_000,
    sessionTimeoutMs: 30 * 60 * 1_000,
  },
});
