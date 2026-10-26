/** Verified on Google's model/pricing pages; changing this requires another free-access check. */
export const googlePrototypeModel = "gemini-3.5-flash-lite";
export type AssistantConfiguration = { provider: "google" | "gateway"; model: string };

/** Read at runtime, so static builds do not need credentials or run inference. */
export function assistantConfiguration(): AssistantConfiguration {
  if (process.env.CULTURELOOP_FREE_AI_VERIFIED !== "true") {
    throw new Error("Prototype assistant is waiting for verified free model access.");
  }
  const provider = process.env.CULTURELOOP_MODEL_PROVIDER?.trim() || "gateway";
  if (provider === "google") {
    const model = process.env.GOOGLE_MODEL?.trim();
    if (!model || !process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
      throw new Error("Prototype assistant model access is not configured.");
    }
    if (model !== googlePrototypeModel) throw new Error("Google model has not been verified for this free prototype.");
    return { provider, model };
  }
  if (provider !== "gateway") throw new Error("Unsupported assistant model provider.");
  if (!process.env.AI_GATEWAY_MODEL?.trim() || !(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim())) {
    throw new Error("Prototype assistant model access is not configured.");
  }
  return { provider, model: process.env.AI_GATEWAY_MODEL.trim() };
}
export function requireFreeAssistant(): void {
  assistantConfiguration();
}
export function resolveAssistantModel(): string {
  return assistantConfiguration().model;
}
