import type { ExchangeRoom } from "./exchanges.ts";

/** A human-readable agreement, never evidence that a physical handoff occurred. */
export function agreementText(room: ExchangeRoom, members: readonly { id: string; alias: string }[], now: number): string {
  const clean = (value: string) => value.replace(/[\r\n\t]+/g, " ").trim();
  const alias = (id: string) => clean(members.find(m => m.id === id)?.alias ?? "Reader");
  const approved = room.cycles.filter(record => record.cycle.memberIds.every(id => record.acceptedBy.includes(id))
    && (record.status === "completed" || (record.status === "held" && record.cycle.transfers.every(transfer =>
      room.holds.some(hold => hold.listingId === transfer.listingId && hold.cycleId === record.cycle.id
        && hold.cycleRevision === record.revision && hold.expiresAt > now)))));
  if (!approved.length) throw new Error("A current approved exchange is required before exporting.");
  const lines = ["CultureLoop exchange agreement", room.mode === "example"
    ? "FICTIONAL EXAMPLE — synthetic ranks and simulated decisions; no real handoff."
    : "Agreement records explicit app approvals. A physical handoff is not independently verified.",
  `Exported: ${new Date(now).toISOString()}`, ""];
  for (const [index, record] of approved.entries()) {
    lines.push(`Exchange ${index + 1} · revision ${record.revision}`, `Status: ${record.status === "completed" ? "Completion recorded in app" : "Agreed; copies currently held"}`);
    for (const transfer of record.cycle.transfers) {
      const title = clean(room.listings.find(l => l.id === transfer.listingId)?.title ?? "Offered book");
      lines.push(`${alias(transfer.fromMemberId)} gives “${title}” to ${alias(transfer.toMemberId)}.`);
      const evidence = transfer.evidence;
      lines.push(`Taste evidence: ${evidence ? `${evidence.source === "qloo" ? "Qloo" : "Synthetic"} rank ${evidence.rank} of ${evidence.catalogSize}` : "unknown; explicitly shortlisted"}.`);
      const capture = room.evidenceSnapshots?.find(s => s.id === evidence?.snapshotId);
      if (capture) lines.push(`Evidence retrieved: ${capture.retrievedAt}; ${capture.origin === "cache" ? "private cache reused" : capture.origin}.`);
    }
    lines.push(`Approvals: ${record.cycle.memberIds.map(alias).join(", ")}.`, "");
  }
  lines.push("Check edition, condition and handoff details together. Ranks are not enjoyment probabilities.");
  return lines.join("\n");
}
