/** One bounded live protocol check. It uses a synthetic calculator, never participant data. */
import { generateText, isStepCount, tool } from "ai";
import { z } from "zod";
import { resolveAgentModel } from "../agent/lib/model.ts";
import { assistantConfiguration } from "../src/server/assistant-configuration.ts";

async function main() {
  if (!process.argv.includes("--live")) throw new Error("Run with --live after verifying free account access.");
  const configuration = assistantConfiguration(), selection = resolveAgentModel();
  let executions = 0;
  const result = await generateText({
    model: typeof selection === "string" ? selection : selection.model,
    prompt: "Call add_numbers with a=2 and b=3. After the tool responds, reply with just its sum.",
    tools: { add_numbers: tool({
      description: "Add the two numbers for a synthetic connection test. This is not book or Qloo evidence.",
      inputSchema: z.object({ a: z.literal(2), b: z.literal(3) }).strict(),
      execute: async ({ a, b }) => { executions++; return { sum: a + b }; },
    }) },
    prepareStep: ({ stepNumber }) => ({ toolChoice: stepNumber === 0 ? { type: "tool", toolName: "add_numbers" } : "none" }),
    stopWhen: isStepCount(2),
    maxOutputTokens: 256,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(45000),
  });
  const passed = executions === 1 && result.steps.length === 2 && result.text.trim() === "5";
  console.log(JSON.stringify({ passed, provider: configuration.provider, model: configuration.model,
    toolExecutions: executions, modelSteps: result.steps.length,
    inputTokens: result.totalUsage.inputTokens, outputTokens: result.totalUsage.outputTokens,
    note: "Live model/tool protocol only; synthetic calculator. This does not verify the hosted room assistant or database." }, null, 2));
  if (!passed) process.exitCode = 1;
}
main().catch(error => {
  // Provider exceptions can contain request headers. Print only bounded, non-secret metadata.
  console.error(JSON.stringify({ passed: false,
    status: typeof error?.statusCode === "number" ? error.statusCode : undefined,
    reason: "Model verification failed; inspect account quota/model access or local configuration privately. No automatic retry or provider fallback." }));
  process.exitCode = 1;
});
