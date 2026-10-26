type Json = Record<string, unknown>;
const object = (value: unknown): Json | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Json : null;
export type AssistantReply = { prompt: string; turnId: string | null; text: string; done: boolean; failed: boolean };
export const newAssistantReply = (prompt: string): AssistantReply => ({ prompt, turnId: null, text: "", done: false, failed: false });

/** Render only text belonging to the newly submitted turn, never tools or replayed replies. */
export function assistantReplyEvent(state: AssistantReply, value: unknown): AssistantReply {
  const event = object(value), data = object(event?.data);
  if (!event || !data || state.done || state.failed) return state;
  if (event.type === "message.received" && !state.turnId && data.message === state.prompt && typeof data.turnId === "string") {
    return { ...state, turnId: data.turnId };
  }
  if (!state.turnId || data.turnId !== state.turnId) return state;
  if (event.type === "message.appended" && typeof data.messageDelta === "string") return { ...state, text: state.text + data.messageDelta };
  if (event.type === "message.completed" && typeof data.message === "string" && data.message.trim()) return { ...state, text: data.message };
  if (event.type === "turn.completed") return { ...state, done: true };
  if (event.type === "turn.failed" || event.type === "turn.cancelled") return { ...state, failed: true };
  return state;
}

/** Bounded NDJSON decoder. Provider/tool payloads are never shown as browser errors. */
export async function readAssistantReply(stream: ReadableStream<Uint8Array>, prompt: string,
  onText: (text: string) => void, signal: AbortSignal): Promise<string> {
  const reader = stream.getReader(), decoder = new TextDecoder();
  let state = newAssistantReply(prompt), pending = "", bytes = 0;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  function line(raw: string) {
    if (!raw.trim()) return;
    let event: unknown;
    try { event = JSON.parse(raw); } catch { throw new Error("The assistant response could not be read. Refresh the room before trying again."); }
    const previous = state.text;
    state = assistantReplyEvent(state, event);
    if (state.text.length > 24000) throw new Error("The assistant response was too long. Refresh the room to check saved changes.");
    if (previous !== state.text) onText(state.text);
    if (state.failed) throw new Error("The assistant could not finish this turn. Refresh the room to check saved changes before trying again.");
  }
  try {
    while (!state.done) {
      signal.throwIfAborted();
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) { pending += decoder.decode(); if (pending) line(pending); break; }
      bytes += part.value.byteLength;
      if (bytes > 2000000) throw new Error("The assistant response exceeded the reading limit. Refresh the room to check saved changes.");
      pending += decoder.decode(part.value, { stream: true });
      let end: number;
      while ((end = pending.indexOf("\n")) >= 0 && !state.done) { line(pending.slice(0, end)); pending = pending.slice(end + 1); }
      if (pending.length > 256000) throw new Error("The assistant response could not be read. Refresh the room before trying again.");
    }
    if (!state.done) throw new Error("The connection ended before the assistant finished. Refresh the room to check saved changes.");
    return state.text || "The assistant finished without a written reply. Check the room for its current state.";
  } finally {
    signal.removeEventListener("abort", abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
