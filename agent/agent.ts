import { defineAgent, defineDynamic } from "eve";
import { resolveAgentModel } from "./lib/model.ts";

export default defineAgent({
  model: defineDynamic({ events: {
    "step.started": () => resolveAgentModel(),
  } }),
  defaultTools: false,
  limits: {
    maxInputTokensPerSession: 10_000,
    maxOutputTokensPerSession: 2_000,
    sessionTimeoutMs: 30 * 60 * 1_000,
  },
});
