/** Read-only setup diagnostics. Never prints credentials or provider response bodies. */
export {};
const present = (name: string) => Boolean(process.env[name]?.trim());
const gateway = process.argv.includes("--gateway");
const google = process.argv.includes("--google");
const names = ["QLOO_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "GOOGLE_MODEL", "AI_GATEWAY_API_KEY", "AI_GATEWAY_MODEL", "DATABASE_URL", "SESSION_SECRET"];
const result: Record<string, unknown> = {
  modelProvider: process.env.CULTURELOOP_MODEL_PROVIDER || "gateway",
  variables: Object.fromEntries(names.map(name => [name, present(name) ? "present (not validated)" : "missing"])),
  signingSecretLongEnough: (process.env.SESSION_SECRET?.length ?? 0) >= 32,
  hostedDatabaseOptIn: process.env.CULTURELOOP_HOSTED_DB_VERIFIED === "true",
  freeModelOptIn: process.env.CULTURELOOP_FREE_AI_VERIFIED === "true",
  note: "Presence does not verify accounts, free plans, database connectivity, Qloo authentication or inference.",
};
if (google) {
  try {
    if (present("GOOGLE_GENERATIVE_AI_API_KEY")) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: { "x-goog-api-key": process.env.GOOGLE_GENERATIVE_AI_API_KEY! }, signal: AbortSignal.timeout(10000),
      });
      result.googleModelsHttp = response.status;
      if (response.ok) {
        const catalog = await response.json() as { models?: { name?: string; supportedGenerationMethods?: string[] }[] };
        const model = catalog.models?.find(item => item.name === `models/${process.env.GOOGLE_MODEL}`);
        result.configuredGoogleModelInCatalog = Boolean(model);
        result.googleGenerationSupported = model?.supportedGenerationMethods?.includes("generateContent") ?? false;
      } else await response.body?.cancel();
    }
  } catch { result.googleCheck = "unavailable or timed out; no retry"; }
}
if (gateway) {
  // No inference, tools, model charges, or database connection. Only catalog and credit metadata.
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", { signal: AbortSignal.timeout(10000) });
    result.modelCatalogHttp = response.status;
    if (response.ok) {
      const catalog = await response.json() as { data?: { id?: string }[] };
      result.configuredModelInCatalog = Array.isArray(catalog.data)
        && catalog.data.some(model => model.id === process.env.AI_GATEWAY_MODEL);
    }
    if (present("AI_GATEWAY_API_KEY")) {
      const credits = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
        headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` }, signal: AbortSignal.timeout(10000),
      });
      result.gatewayCreditsHttp = credits.status;
      await credits.body?.cancel();
    }
  } catch { result.gatewayCheck = "unavailable or timed out; no retry"; }
}
console.log(JSON.stringify(result, null, 2));
