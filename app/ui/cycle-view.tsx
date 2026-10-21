"use client";

import { useId, useState } from "react";
import type { CycleRecord, ExchangeRoom } from "../../src/domain/exchanges.ts";
import type { Membership } from "../../src/server/store.ts";
import { Evidence } from "./evidence.tsx";

export function CycleView({ record, room, members, memberId, busy, onAction }: {
  record: CycleRecord; room: ExchangeRoom; members: readonly Membership[]; memberId: string; busy: boolean;
  onAction: (command: Record<string, unknown>) => Promise<boolean>;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const markerId = useId().replace(/:/g, "");
  const alias = (id: string) => members.find(m => m.id === id)?.alias ?? "Reader";
  const involved = record.cycle.memberIds.includes(memberId);
  const approved = record.acceptedBy.includes(memberId);
  const held = record.status === "held";
  const completed = record.status === "completed";
  const action = (type: string) => onAction({ type, cycleId: record.cycle.id, revision: record.revision, ...(type === "complete" ? { confirmed: true } : {}) });
  const labels = { pending: "Awaiting approvals", held: "Agreed · copies held", completed: "Completion recorded", declined: "Declined", stale: "Changed · previous approvals inactive", expired: "Hold expired" };
  return <article className="cycle-panel" data-cycle-status={record.status}>
    <div className="section-head"><h3>{record.cycle.memberIds.length === 2 ? "A book for a book." : "Three books. One shared loop."}</h3><span className={`status ${held || completed ? "status-good" : ""}`}>{labels[record.status]}</span></div>
    <p className="caption">Revision {record.revision} · {record.acceptedBy.length} of {record.cycle.memberIds.length} approvals {room.mode === "example" ? "(simulated)" : ""}</p>
    <div className={`cycle-diagram cycle-${record.cycle.memberIds.length}`}>
      <svg className="cycle-arrows" viewBox="0 0 600 390" fill="none" aria-hidden="true"><defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 6 4 1 7"/></marker></defs>{record.cycle.memberIds.length === 3 ? <><path d="M380 90Q555 140 475 265" markerEnd={`url(#${markerId})`}/><path d="M390 330Q300 375 205 330" markerEnd={`url(#${markerId})`}/><path d="M120 260Q55 145 210 90" markerEnd={`url(#${markerId})`}/></> : <><path d="M225 80Q300 20 375 80" markerEnd={`url(#${markerId})`}/><path d="M375 190Q300 250 225 190" markerEnd={`url(#${markerId})`}/></>}</svg>
      <ol className="transfer-list">{record.cycle.transfers.map((transfer, n) => {
        const listing = room.listings.find(l => l.id === transfer.listingId);
        return <li className={`transfer transfer-${n}`} key={transfer.listingId}><p className="transfer-reader">{alias(transfer.fromMemberId)}</p><div className={`mini-jacket jacket-${n}`}><strong>{listing?.title ?? "Offered book"}</strong></div><p>Gives to <strong>{alias(transfer.toMemberId)}</strong> <span aria-hidden="true">→</span></p><Evidence preference={transfer.evidence} room={room}/></li>;
      })}</ol>
    </div>
    <div className="approval-list">{record.cycle.memberIds.map(id => <span key={id}>{alias(id)}{id === memberId ? " (you)" : ""} · {record.acceptedBy.includes(id) ? "approved" : "waiting"}</span>)}</div>
    {record.status === "pending" && involved && <div className="actions"><button className="button primary" disabled={busy || approved} onClick={() => void action("accept")}>{approved ? "You approved this revision" : room.mode === "example" ? "Simulate my approval" : "Approve this exchange"}</button><button className="button quiet" disabled={busy} onClick={() => void action("decline")}>Decline</button></div>}
    {held && <><p className="agreement-note">Everyone approved these exact transfers. Arrange a local handoff together. Agreement does not mean the books have changed hands.</p><div className="actions"><a className="button" href={`/api/rooms/${room.id}/agreement`} download>Download agreement</a><button className="button" onClick={() => window.print()}>Print agreement</button>{involved && <button className="button quiet" disabled={busy} onClick={() => void action("decline")}>Cancel my agreement</button>}</div>
      {involved && <details className="completion"><summary>{room.mode === "example" ? "Simulate a completed handoff" : "Record a completed handoff"}</summary><label className="check-label"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>{room.mode === "example" ? "Record this fictional handoff as completed." : "These books were handed over to their new readers."}</label><p className="caption">This records completion and removes these copies from available inventory.</p><button className="button" disabled={busy || !confirmed} onClick={() => void action("complete")}>Record completion</button></details>}
    </>}
    {completed && <p className="agreement-note">{room.mode === "example" ? "Fictional handoff recorded for this example." : `Handoff recorded by ${alias(record.completedBy ?? "")}.`} These copies are no longer available.</p>}
  </article>;
}
