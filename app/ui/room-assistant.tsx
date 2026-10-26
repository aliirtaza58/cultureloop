"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { readAssistantReply } from "../../src/client/assistant-stream.ts";
import { requestJson } from "./api.ts";

type Props = {
  roomId: string;
  disabled: boolean;
  example: boolean;
  onBusyChange: (busy: boolean) => void;
  onRefresh: () => Promise<void>;
};
const questions = [
  "What is ready, and what should I do next?",
  "Explain the current exchange and its taste evidence.",
  "Find exchanges using our saved shortlists.",
];

function pause(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const cleanup = () => signal.removeEventListener("abort", abort);
    const timer = setTimeout(() => { cleanup(); resolve(); }, 500);
    const abort = () => { clearTimeout(timer); cleanup(); reject(signal.reason); };
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function openReply(roomId: string, startIndex: number, signal: AbortSignal) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const response = await fetch(`/cultureloop/rooms/${roomId}/stream?startIndex=${startIndex}`, {
      credentials: "same-origin", cache: "no-store", signal,
    });
    if (response.status === 404 && attempt < 7) { await response.body?.cancel(); await pause(signal); continue; }
    if (!response.ok || !response.headers.get("content-type")?.includes("application/x-ndjson") || !response.body) {
      await response.body?.cancel();
      throw new Error("The assistant reply could not open. Refresh the room before trying again.");
    }
    return response.body;
  }
  throw new Error("The assistant reply is not ready. Refresh the room before trying again.");
}

export function RoomAssistant({ roomId, disabled, example, onBusyChange, onRefresh }: Props) {
  const fieldId = useId();
  const [prompt, setPrompt] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const input = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; active.current?.abort(); onBusyChange(false); };
  }, [onBusyChange]);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || disabled || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(() => controller.abort(new DOMException("Reply timed out", "TimeoutError")), 90_000);
    setBusy(true); onBusyChange(true); setQuestion(text); setAnswer(""); setError(""); setStatus("Reading your circle…");
    try {
      const accepted = await requestJson<{ accepted: boolean; startIndex: number }>(`/cultureloop/rooms/${roomId}/messages`, {
        method: "POST", body: JSON.stringify({ message: text }), signal: controller.signal,
      });
      if (!accepted.accepted || !Number.isSafeInteger(accepted.startIndex) || accepted.startIndex < 0) {
        throw new Error("The assistant could not start. Refresh the room before trying again.");
      }
      const stream = await openReply(roomId, accepted.startIndex, controller.signal);
      const reply = await readAssistantReply(stream, text, value => {
        if (mounted.current) { setAnswer(value); setStatus("Writing a reply…"); }
      }, controller.signal);
      if (mounted.current) {
        setAnswer(reply || "The assistant finished without a written reply. Check the refreshed room for its latest state.");
        setStatus("Reply complete · review the current room before deciding");
      }
    } catch (cause) {
      if (mounted.current) {
        setStatus("");
        setError(controller.signal.aborted
          ? `${controller.signal.reason?.name === "TimeoutError" ? "The reply took too long." : "You stopped waiting."} The message may still finish on the server. Refresh the room before sending again.`
          : cause instanceof Error && /^(The assistant|Assistant |This request|Request returned|Room membership|Use the app|Request limit|Wait for)/.test(cause.message)
            ? cause.message : "The assistant could not finish. Refresh the room before trying again.");
      }
    } finally {
      clearTimeout(timer); active.current = null;
      if (mounted.current) { setBusy(false); onBusyChange(false); void onRefresh(); }
    }
  }

  return <details className="room-assistant">
    <summary><span className="assistant-title">A hand with the exchange.</span><span className="caption">Ask the book-circle assistant</span></summary>
    <div className="assistant-content">
      <p>Ask about your circle, refresh taste suggestions, or find exchanges from saved shortlists. You choose acceptable books and approve transfers yourself.</p>
      {example && <p className="caption">This room’s readers, books and ranks are fictional. Replies about it are example guidance.</p>}
      {disabled && !busy && <p className="caption">Finish the current change, or return to your own reader before asking the assistant.</p>}
      <div className="assistant-prompts" role="group" aria-label="Suggested questions">
        {questions.map(text => <button className="button quiet small" type="button" key={text} disabled={disabled || busy}
          onClick={() => { setPrompt(text); input.current?.focus(); }}>{text}</button>)}
      </div>
      <form onSubmit={event => void ask(event)}>
        <label htmlFor={fieldId}>Your question</label>
        <textarea id={fieldId} ref={input} value={prompt} maxLength={2000} rows={3} required disabled={disabled || busy}
          aria-describedby={`${fieldId}-help`} onChange={event => setPrompt(event.target.value)}/>
        <p className="caption" id={`${fieldId}-help`}>Choose a question above or write your own, then send it. Avoid personal details. {prompt.length}/2,000 characters.</p>
        <div className="actions">
          <button className="button primary" type="submit" disabled={disabled || busy || !prompt.trim()}>{busy ? "Working on your question…" : "Ask the assistant"}</button>
          {busy && <button className="button quiet" type="button" onClick={() => active.current?.abort()}>Stop waiting</button>}
        </div>
      </form>
      <p className="assistant-status caption" role="status" aria-live="polite">{status}</p>
      {error && <p className="error-message" role="alert">{error}{answer && " The reply below is incomplete."}</p>}
      {question && <div className="assistant-reply" aria-label="Latest assistant exchange">
        <p className="caption">You asked</p><p className="assistant-question">{question}</p>
        {answer && <><h3>{busy ? "Reply in progress" : error ? "Partial reply" : "From the assistant"}</h3><p className="assistant-answer">{answer}</p></>}
        <p className="caption">Check the room’s current transfers and evidence before deciding. An assistant reply never records your approval.</p>
      </div>}
    </div>
  </details>;
}
