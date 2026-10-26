import assert from "node:assert/strict";
import { test } from "node:test";
import { assistantReplyEvent, newAssistantReply, readAssistantReply } from "../src/client/assistant-stream.ts";
const event = (type: string, turnId: string, data: Record<string, unknown> = {}) => ({ type, data: { turnId, ...data } });
const records = [event("turn.completed", "old"), event("message.completed", "old", { message: "Old answer" }),
  event("message.received", "new", { message: "Read my room" }),
  event("action.result", "new", { result: { output: { secret: "never render" } } }),
  event("message.appended", "new", { messageDelta: "Two café readers." }),
  event("message.completed", "other", { message: "Foreign reply" }), event("turn.completed", "new")];

test("replayed completion and unrelated turns cannot complete or replace a new reply", () => {
  let state = newAssistantReply("Read my room");
  for (const item of records) state = assistantReplyEvent(state, item);
  assert.equal(state.text, "Two café readers."); assert.equal(state.done, true); assert.equal(state.turnId, "new");
  assert.equal(assistantReplyEvent(state, event("message.appended", "new", { messageDelta: "duplicate" })), state);
});
test("NDJSON decoding preserves split UTF-8 and cancels the stream after the matching turn", async () => {
  const bytes = new TextEncoder().encode(records.map(item => JSON.stringify(item)).join("\n") + "\n");
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ start(c) { for (let n = 0; n < bytes.length; n += 3) c.enqueue(bytes.slice(n, n + 3)); }, cancel() { cancelled = true; } });
  const shown: string[] = [];
  assert.equal(await readAssistantReply(stream, "Read my room", value => shown.push(value), new AbortController().signal), "Two café readers.");
  assert.deepEqual(shown, ["Two café readers."]); assert.equal(cancelled, true);
});
test("failed or truncated streams never report an old completed turn as success", async () => {
  for (const values of [[records[0]], [records[2], event("turn.failed", "new", { error: "private provider body" })]]) {
    const stream = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new TextEncoder().encode(values.map(x => JSON.stringify(x)).join("\n"))); c.close(); } });
    await assert.rejects(readAssistantReply(stream, "Read my room", () => {}, new AbortController().signal), error =>
      error instanceof Error && /before the assistant finished|could not finish/.test(error.message) && !error.message.includes("private provider"));
  }
});
test("aborting a waiting stream releases it without claiming completion", async () => {
  const controller = new AbortController(); let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const reading = readAssistantReply(stream, "Read my room", () => {}, controller.signal);
  controller.abort();
  await assert.rejects(reading, { name: "AbortError" }); assert.equal(cancelled, true);
});
