import { spawn } from "node:child_process";

if (process.env.VERCEL) throw new Error("Use the hosted database on Vercel.");
if ((process.env.SESSION_SECRET?.length ?? 0) < 32) throw new Error("Configure SESSION_SECRET privately before starting the prototype.");
const port = process.env.PORT ?? "3017";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Choose a valid local port.");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", port], {
  stdio: "inherit", env: { ...process.env, CULTURELOOP_LOCAL_PROTOTYPE: "true",
    CULTURELOOP_APP_ORIGIN: `http://127.0.0.1:${port}`, NEXT_TELEMETRY_DISABLED: "1" },
});
child.on("exit", code => { process.exitCode = code ?? 1; });
