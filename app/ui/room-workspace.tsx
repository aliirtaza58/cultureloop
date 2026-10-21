"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoomView } from "../../src/server/store.ts";
import { requestJson } from "./api.ts";
import { EntityPicker } from "./entity-picker.tsx";
import { Evidence } from "./evidence.tsx";
import { CycleView } from "./cycle-view.tsx";

type Stage = "books" | "taste" | "shortlist" | "swaps";
const stages: { id: Stage; label: string }[] = [{ id: "books", label: "The bookshelf" },
  { id: "taste", label: "Your taste" }, { id: "shortlist", label: "Your shortlist" }, { id: "swaps", label: "The exchange" }];

export function RoomWorkspace({ id }: { id: string }) {
  const [view, setView] = useState<RoomView | null>(null);
  const [stage, setStage] = useState<Stage>("books");
  const [previewMember, setPreviewMember] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await requestJson<{ view: RoomView }>(`/api/rooms/${id}`, { signal });
      setView(result.view); setError("");
    } catch (cause) { if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "The room could not load. Try refreshing."); }
  }, [id]);
  useEffect(() => {
    const controller = new AbortController(); void load(controller.signal);
    try {
      const token = sessionStorage.getItem(`cultureloop:invite:${id}`);
      if (token) setInviteLink(`${window.location.origin}/?invite=${encodeURIComponent(token)}`);
    } catch { /* The membership cookie does not rely on browser storage. */ }
    return () => controller.abort();
  }, [id, load]);

  const example = view?.room.mode === "example";
  const canSimulate = example && view.room.exampleControllerMemberId === view.actor.memberId;
  const memberId = canSimulate && previewMember ? previewMember : view?.actor.memberId ?? "";
  async function run(command: Record<string, unknown>): Promise<boolean> {
    if (busy) return false;
    setBusy(true); setError("");
    try {
      const result = await requestJson<{ view: RoomView }>(`/api/rooms/${id}/actions`, {
        method: "POST", body: JSON.stringify({ command, ...(canSimulate ? { simulateMember: memberId } : {}) }),
      });
      setView(result.view); return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The change could not be saved. Refresh and try again."); return false; }
    finally { setBusy(false); }
  }
  async function copyInvite() {
    try { await navigator.clipboard.writeText(inviteLink); setCopied(true); }
    catch { setError("The invitation could not be copied. Select and copy the invitation link below."); }
  }
  if (!view) return <section className="room-loading"><h1>Your book circle.</h1>{error ? <><p className="error-message" role="alert">{error}</p><p>If this browser hasn’t joined the room, open its invitation and choose your own name.</p><div className="actions"><button className="button" onClick={() => void load()}>Try again</button><a className="button" href="/">Back to start</a></div></> : <p role="status">Opening the bookshelf…</p>}</section>;
  const { room, members } = view;
  const alias = (key: string) => members.find(member => member.id === key)?.alias ?? "Reader";
  const ownBooks = room.listings.filter(l => l.ownerId === memberId);
  const ownInterests = (room.interests ?? []).filter(i => i.memberId === memberId);
  const ownShortlists = room.shortlists.filter(s => s.memberId === memberId && s.acceptable);
  const preferences = room.preferences.filter(p => p.memberId === memberId);
  const availableBooks = [...new Map(room.listings.filter(l => l.available && l.ownerId !== memberId).map(l => [l.bookId, l])).values()]
    .sort((a, b) => (preferences.find(p => p.bookId === a.bookId)?.rank ?? Infinity)
      - (preferences.find(p => p.bookId === b.bookId)?.rank ?? Infinity) || (a.title ?? a.bookId).localeCompare(b.title ?? b.bookId));
  const activeCycles = room.cycles.filter(c => ["pending", "held", "completed"].includes(c.status));
  const pastCycles = room.cycles.filter(c => !["pending", "held", "completed"].includes(c.status));
  return <>
    <div className="room-heading"><div><p className="intro-note">{example ? "A fictional circle, ready to explore." : `${members.length} of 6 places around the bookshelf.`}</p><h1>{example ? "An afternoon book swap." : "Your book circle."}</h1></div><button className="button quiet refresh" disabled={busy} onClick={() => void load()}>Refresh room <span aria-hidden="true">↻</span></button></div>
    {example && <div className="example-note"><strong>Example room.</strong> Books and ranks are synthetic. You can simulate each reader’s choices; they are not real participant approvals.</div>}
    <div className="room-layout">
      <aside className="room-sidebar">
        <div className="reader-identity"><span className="reader-initial" aria-hidden="true">{alias(memberId).charAt(0)}</span><div><span className="caption">{example ? "Previewing as" : "You’re here as"}</span><strong>{alias(memberId)}</strong></div></div>
        {canSimulate && <><label htmlFor="preview-member">Simulate a reader</label><select id="preview-member" value={memberId} onChange={e => setPreviewMember(e.target.value)} disabled={busy}>{members.map(m => <option key={m.id} value={m.id}>{m.alias}</option>)}</select></>}
        <nav className="stage-nav" aria-label="Room sections">{stages.map(item => <button key={item.id} type="button" className={stage === item.id ? "current" : ""} aria-current={stage === item.id ? "step" : undefined} onClick={() => setStage(item.id)}>{item.label}<span aria-hidden="true">{item.id === "books" ? room.listings.filter(l => l.available).length : item.id === "shortlist" ? ownShortlists.length : "→"}</span></button>)}</nav>
        <div className="room-members"><h2>In this circle</h2>{members.map(member => <p key={member.id}><span className="member-dot" aria-hidden="true"/>{member.alias}</p>)}</div>
        {inviteLink && !example && <div className="invite-box"><button className="button small full" onClick={() => void copyInvite()}>{copied ? "Invitation copied" : "Copy invitation"}</button><details><summary>Show invitation link</summary><label htmlFor="share-link">Share with your circle</label><input id="share-link" readOnly value={inviteLink} onFocus={e => e.target.select()}/></details></div>}
        {example && <p className="caption">Explore the example, then <a href="/#start">start a real room</a> with your friends.</p>}
      </aside>
      <section className="workspace" aria-busy={busy}>
        <div className="request-status" role="status" aria-live="polite">{busy ? "Saving your change…" : "Room saved · refresh to see changes from other readers"}</div>
        {error && <p className="error-message" role="alert">{error}</p>}
        {stage === "books" && <>
          <div className="section-head"><div><h2>A bookshelf between friends.</h2><p>Every listing is a physical copy, offered by the reader named below.</p></div><span className="caption">{room.listings.filter(l => l.available).length} available</span></div>
          {room.listings.length ? <div className="book-grid">{room.listings.map((listing, n) => <article className={`book-item ${listing.available ? "" : "unavailable"}`} key={listing.id}><div className={`book-jacket jacket-${n % 4}`}><span className="jacket-rule"/><h3>{listing.title ?? "Confirmed book"}</h3><span>{listing.ownerId === memberId ? "From your shelf" : `From ${alias(listing.ownerId)}`}</span></div><div className="book-caption"><span>{alias(listing.ownerId)}</span><span className="status">{listing.available ? "Available" : "Unavailable"}</span></div>{listing.ownerId === memberId && listing.available && <button className="text-button" disabled={busy} onClick={() => void run({ type: "withdraw", listingId: listing.id })}>Withdraw this copy</button>}</article>)}</div> : <div className="empty-state"><h3>The first book starts the story.</h3><p>Offer a book you’re ready to pass along, then invite a friend to do the same.</p></div>}
          {!example && <div className="offering-panel"><h3>Bring a book to the circle.</h3><p>You’ve offered {ownBooks.length} of 3 copies. Confirm the exact title before adding it. Check edition and condition with the other reader before a handoff.</p><EntityPicker roomId={id} purpose="book" disabled={busy || ownBooks.length >= 3} onChoose={proof => run({ type: "offer", proof })}/></div>}
          <div className="next-step"><p>Found a few books you might like?</p><button className="button" onClick={() => setStage(example ? "shortlist" : "taste")}>{example ? "Choose your next read" : "Add your favorites"}<span aria-hidden="true">→</span></button></div>
        </>}
        {stage === "taste" && <>
          <h2>A little about your taste.</h2><p>Choose up to three books, films, artists or games you already enjoy. Qloo uses these cultural signals to rank the books in this room. Your name is not sent to Qloo.</p>
          {example ? <div className="empty-state"><h3>This example uses authored ranks.</h3><p>Its taste order is synthetic. Create a real room to confirm favorites and request live Qloo rankings.</p><button className="button" onClick={() => setStage("shortlist")}>View example rankings</button></div> : <>
            <ul className="favorite-list">{ownInterests.map(interest => <li key={interest.entityId}><span><strong>{interest.name}</strong><small>{interest.type.replace("urn:entity:", "").replace("_", " ")}</small></span><button className="button quiet small" disabled={busy} onClick={() => void run({ type: "remove-interest", entityId: interest.entityId })}>Remove<span className="sr-only"> {interest.name}</span></button></li>)}</ul>
            <EntityPicker roomId={id} purpose="interest" disabled={busy || ownInterests.length >= 3} onChoose={proof => run({ type: "add-interest", proof })}/>
            <div className="next-step"><p>Suggestions help you discover. You still choose which books you’d accept.</p><button className="button primary" disabled={busy || !ownInterests.length} onClick={async () => { if (await run({ type: "rank" })) setStage("shortlist"); }}>Find taste suggestions</button></div>
          </>}
        </>}
        {stage === "shortlist" && <>
          <div className="section-head"><div><h2>What would you like to read?</h2><p>Shortlist every book you’d be happy to receive. Taste rank stays separate from your choice.</p></div>{!example && <button className="button small" disabled={busy} onClick={() => void run({ type: "rank" })}>Refresh suggestions</button>}</div>
          {availableBooks.length ? <div className="shortlist-list">{availableBooks.map((listing, n) => {
            const chosen = ownShortlists.some(s => s.bookId === listing.bookId);
            return <article className={`shortlist-row ${chosen ? "chosen" : ""}`} key={listing.bookId}><div className={`book-number jacket-${n % 4}`} aria-hidden="true">{preferences.find(p => p.bookId === listing.bookId)?.rank ?? "—"}</div><div><h3>{listing.title ?? "Confirmed book"}</h3><p className="caption">Offered by {room.listings.filter(l => l.available && l.bookId === listing.bookId && l.ownerId !== memberId).map(l => alias(l.ownerId)).join(", ")}</p><Evidence preference={preferences.find(p => p.bookId === listing.bookId)} room={room}/></div><button className={`button small ${chosen ? "selected" : ""}`} aria-pressed={chosen} disabled={busy} onClick={() => void run({ type: "shortlist", bookId: listing.bookId, acceptable: !chosen })}>{chosen ? "✓ Shortlisted" : "Add to shortlist"}<span className="sr-only">: {listing.title}</span></button></article>;
          })}</div> : <div className="empty-state"><h3>Waiting for another shelf.</h3><p>Books offered by other readers appear here. Invite a friend and refresh the room after they add a book.</p></div>}
          {canSimulate && <div className="example-action"><h3>Take the example for a spin.</h3><p>To explore the whole loop, explicitly load acceptable-book choices for all three fictional readers. This keeps the original synthetic ranks and records no approvals.</p><button className="button" disabled={busy} onClick={() => void run({ type: "sample-shortlists" })}>Use example shortlists</button></div>}
          <div className="next-step"><p>Shortlisting means “I’d welcome this book.” Each proposed exchange still needs approval.</p><button className="button primary" onClick={() => setStage("swaps")}>Review exchanges<span aria-hidden="true">→</span></button></div>
        </>}
        {stage === "swaps" && <>
          <div className="section-head"><div><h2>Find a next chapter together.</h2><p>Each reader gives and receives one book. Only explicitly shortlisted books enter a swap.</p></div><button className="button primary" disabled={busy || room.memberIds.length < 2} onClick={() => void run({ type: "generate" })}>{activeCycles.length ? "Update exchanges" : "Find exchanges"}<span aria-hidden="true">↻</span></button></div>
          {activeCycles.length ? activeCycles.map(record => <CycleView key={`${record.cycle.id}:${record.revision}`} record={record} room={room} members={members} memberId={memberId} busy={busy} onAction={run}/>) : <div className="empty-state"><h3>A little loop needs willing readers.</h3><p>Add acceptable books to each reader’s shortlist, then find exchanges. If no compatible two- or three-person swap exists, broaden your own shortlist or offer another book.</p><button className="button" onClick={() => setStage("shortlist")}>Back to the shortlist</button></div>}
          {pastCycles.length > 0 && <details className="exchange-history"><summary>Previous exchanges ({pastCycles.length})</summary><p>Changed exchanges keep their old decisions for reference. Those decisions do not approve new transfers.</p>{pastCycles.map(record => <CycleView key={`${record.cycle.id}:${record.revision}`} record={record} room={room} members={members} memberId={memberId} busy={busy} onAction={run}/>)}</details>}
          {canSimulate && <p className="caption">Use “Simulate a reader” to review and approve separately as each fictional participant.</p>}
        </>}
      </section>
    </div>
  </>;
}
