import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));

/** No process starts unless both services can use the same verified network database. */
export function serviceLaunch(mode: "web" | "agent", env: Partial<NodeJS.ProcessEnv>) {
  if (mode !== "web" && mode !== "agent") throw new Error("Choose the web or agent service.");
  if (env.CULTURELOOP_LOCAL_PROTOTYPE === "true") throw new Error("Combined services cannot share embedded database files. Use verified hosted PostgreSQL.");
  if (!env.DATABASE_URL?.trim() || env.CULTURELOOP_HOSTED_DB_VERIFIED !== "true") {
    throw new Error("Configure and verify the free shared PostgreSQL target before starting combined services.");
  }
  if ((env.SESSION_SECRET?.trim().length ?? 0) < 32) throw new Error("Configure SESSION_SECRET privately before starting combined services.");
  const raw = env.PORT?.trim() || (mode === "web" ? "3019" : "3018");
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || String(port) !== raw || port === 3000) {
    throw new Error("Choose an available service port from 1024 to 65535, excluding 3000.");
  }
  const args = mode === "web"
    ? [resolve(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", raw]
    : [resolve(root, "node_modules/eve/bin/eve.js"), "dev", "--no-ui", "--no-default-extensions", "--host", "127.0.0.1", "--port", raw];
  return { args, cwd: root, env: { ...env, NODE_ENV: "development" as const, NEXT_TELEMETRY_DISABLED: "1",
    CULTURELOOP_APP_ORIGIN: env.CULTURELOOP_APP_ORIGIN || "http://127.0.0.1:3017" } };
}

async function main() {
  const files: Record<string, string> = {};
  for (const name of [".env", ".env.local"]) {
    try { Object.assign(files, parseEnv(await readFile(resolve(root, name), "utf8"))); }
    catch (error) { if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error; }
  }
  const env = { ...files, ...process.env }, mode = process.argv[2];
  const launch = serviceLaunch(mode === "--check" ? "web" : mode as "web" | "agent", env);
  if (mode === "--check") {
    console.log("Shared database/session settings present. Connectivity, free eligibility and inference remain separate checks.");
    return;
  }
  const child = spawn(process.execPath, launch.args, { cwd: launch.cwd, env: launch.env, stdio: "inherit" });
  child.on("error", () => { console.error("The service could not start."); process.exitCode = 1; });
  child.on("exit", code => { process.exitCode = code ?? 1; });
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => child.kill(signal));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    // Authored configuration messages only; never print environment values or filesystem/provider bodies.
    const message = error instanceof Error ? error.message : "";
    console.error(/^(Choose |Combined |Configure )/.test(message) ? message : "The service could not read its local configuration.");
    process.exitCode = 1;
  });
}
