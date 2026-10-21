import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";

let contents = "";
try { contents = await readFile(".env.local", "utf8"); }
catch (error) { if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error; }
if ((contents.match(/^SESSION_SECRET=/gm)?.length ?? 0) > 1) throw new Error("Keep a single SESSION_SECRET entry in .env.local before continuing.");
const existing = process.env.SESSION_SECRET?.trim() || parseEnv(contents).SESSION_SECRET?.trim();
if (existing) {
  if (existing.length < 32) throw new Error("The existing SESSION_SECRET is too short. Replace it privately with at least 32 random characters.");
  console.log("Existing private session secret preserved. No hosted resources configured.");
} else {
  const line = `SESSION_SECRET=${randomBytes(32).toString("hex")}`;
  const next = /^SESSION_SECRET=.*$/m.test(contents) ? contents.replace(/^SESSION_SECRET=.*$/m, line)
    : `${contents}${contents.endsWith("\n") || !contents ? "" : "\n"}${line}\n`;
  await writeFile(".env.local", next, { flag: contents ? "w" : "wx" });
  console.log("Created private session secret in ignored .env.local. Its value was not displayed.");
}
