import { defineAgent, defineDynamic } from "eve";
import { resolveAssistantModel } from "../src/server/assistant-configuration.ts";

export default defineAgent({
  model: defineDynamic({ events: {
    "step.started": () => resolveAssistantModel(),
  } }),
  defaultTools: false,
  limits: {
    maxInputTokensPerSession: 10_000,
    maxOutputTokensPerSession: 2_000,
    sessionTimeoutMs: 30 * 60 * 1_000,
  },
});
