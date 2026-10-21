import type { ExchangeRoom } from "../../src/domain/exchanges.ts";
import type { Preference } from "../../src/domain/matching.ts";

export function Evidence({ preference, room }: { preference?: Preference; room: ExchangeRoom }) {
  const snapshot = room.evidenceSnapshots?.find(s => s.id === preference?.snapshotId);
  return <div className="evidence">
    <span className="evidence-label">{preference ? `${preference.source === "synthetic" ? "Synthetic" : "Qloo"} rank ${preference.rank} of ${preference.catalogSize}` : "Taste evidence unknown"}</span>
    <details><summary>About this evidence</summary><p>{preference?.source === "synthetic" ? "An authored example ranking, not a Qloo result." : preference ? "Qloo’s relative order for this reader’s interests and this book catalog. It is not an enjoyment probability or proof of why a person will like a book." : "Qloo has not ranked this book for this reader. It can still enter an exchange if the reader explicitly shortlists it."}</p>
      {snapshot && <p>Retrieved {new Date(snapshot.retrievedAt).toLocaleString()} · {snapshot.origin === "cache" ? "private cache reused" : "live Qloo request"}. Explanation metadata: {snapshot.explanationStatus}.</p>}
      <p>Your shortlist records willingness. Exchange approval is a separate step.</p>
    </details>
  </div>;
}
