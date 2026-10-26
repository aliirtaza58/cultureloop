import { createGoogle } from "@ai-sdk/google";
import { wrapLanguageModel } from "ai";
import { assistantConfiguration } from "../../src/server/assistant-configuration.ts";

/** Each step rechecks the gate. Provider failures never select another provider. */
export function resolveAgentModel(fetch?: typeof globalThis.fetch) {
  const configuration = assistantConfiguration();
  if (configuration.provider === "gateway") return configuration.model;
  const google = createGoogle({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY, fetch });
  return {
    model: wrapLanguageModel({ model: google(configuration.model), middleware: {
      specificationVersion: "v4",
      transformParams: async ({ params }) => ({ ...params, maxOutputTokens: Math.min(params.maxOutputTokens ?? 512, 512) }),
    } }),
    // The selected model's limit was checked in Google's live model metadata.
    modelContextWindowTokens: 1_048_576,
  };
}
