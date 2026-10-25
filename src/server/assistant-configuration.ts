/** Read at runtime, so static builds do not need credentials or run inference. */
export function requireFreeAssistant(): void {
  if (process.env.CULTURELOOP_FREE_AI_VERIFIED !== "true") {
    throw new Error("Prototype assistant is waiting for verified free model access.");
  }
  if (!process.env.AI_GATEWAY_MODEL?.trim() || !(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim())) {
    throw new Error("Prototype assistant model access is not configured.");
  }
}
export function resolveAssistantModel(): string {
  requireFreeAssistant();
  return process.env.AI_GATEWAY_MODEL!.trim();
}
