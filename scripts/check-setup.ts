/** Read-only setup diagnostics. Never prints credentials or provider response bodies. */
export {};
const present = (name: string) => Boolean(process.env[name]?.trim());
const gateway = process.argv.includes("--gateway");
const names = ["QLOO_API_KEY", "AI_GATEWAY_API_KEY", "AI_GATEWAY_MODEL", "DATABASE_URL", "SESSION_SECRET"];
const result: Record<string, unknown> = {
  variables: Object.fromEntries(names.map(name => [name, present(name) ? "present (not validated)" : "missing"])),
  signingSecretLongEnough: (process.env.SESSION_SECRET?.length ?? 0) >= 32,
  hostedDatabaseOptIn: process.env.CULTURELOOP_HOSTED_DB_VERIFIED === "true",
  note: "Presence does not verify accounts, free plans, database connectivity, Qloo authentication or inference.",
};
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
