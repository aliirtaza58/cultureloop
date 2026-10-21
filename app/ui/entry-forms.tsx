"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "./api.ts";
import type { RoomView } from "../../src/server/store.ts";
import type { FormEvent } from "react";

export function EntryForms({ invite }: { invite: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [lastRoom, setLastRoom] = useState("");
  useEffect(() => { try { setLastRoom(localStorage.getItem("cultureloop:last-room") ?? ""); } catch { /* Storage may be disabled. */ } }, []);
  async function enter(input: Record<string, string>) {
    setBusy(input.type!); setError("");
    try {
      const result = await requestJson<{ view: RoomView; inviteToken?: string }>("/api/rooms", { method: "POST", body: JSON.stringify(input) });
      try {
        localStorage.setItem("cultureloop:last-room", result.view.room.id);
        if (result.inviteToken) sessionStorage.setItem(`cultureloop:invite:${result.view.room.id}`, result.inviteToken);
      } catch { /* Membership uses an HttpOnly cookie, independent of browser storage. */ }
      router.push(`/rooms/${result.view.room.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The room could not open. Try again."); }
    finally { setBusy(""); }
  }
  function submit(event: FormEvent<HTMLFormElement>, type: "create" | "join") {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void enter({ type, alias: String(form.get("alias")), ...(type === "join" ? { invite: String(form.get("invite")) } : {}) });
  }
  return <div aria-busy={Boolean(busy)}>
    <h2>{invite ? "A place in the circle." : "Start a new chapter."}</h2>
    <p>{invite ? "Choose a name your friends will recognize, then join their room." : "Take a look around with three fictional readers, or bring your own circle."}</p>
    {error && <p className="error-message" role="alert">{error}</p>}
    {!invite && <><button className="button primary full" disabled={Boolean(busy)} onClick={() => void enter({ type: "example" })}>{busy === "example" ? "Opening example…" : "Try the example"}<span aria-hidden="true">↗</span></button>
      <p className="caption">Fictional books, synthetic ranks, simulated decisions.</p><div className="divider-label">or start with your books</div>
      <form onSubmit={e => submit(e, "create")}><label htmlFor="create-alias">Your name in the room</label><input id="create-alias" name="alias" autoComplete="nickname" required maxLength={50} placeholder="How your friends know you" disabled={Boolean(busy)}/><button className="button full" disabled={Boolean(busy)}>{busy === "create" ? "Creating room…" : "Create a room"}<span aria-hidden="true">→</span></button></form></>}
    <details className="join-details" open={invite ? true : undefined}><summary>{invite ? "Join this room" : "Have an invitation?"}</summary>
      <form onSubmit={e => submit(e, "join")}><label htmlFor="join-alias">Your name in the room</label><input id="join-alias" name="alias" autoComplete="nickname" required maxLength={50} disabled={Boolean(busy)}/><label htmlFor="invite">Invitation code</label><input id="invite" name="invite" required maxLength={100} defaultValue={invite} disabled={Boolean(busy)}/><button className="button full" disabled={Boolean(busy)}>{busy === "join" ? "Joining room…" : "Join the room"}</button></form>
    </details>
    {/^[\da-f-]{36}$/i.test(lastRoom) && <a className="resume-link" href={`/rooms/${lastRoom}`}>Return to your last room <span aria-hidden="true">→</span></a>}
  </div>;
}
