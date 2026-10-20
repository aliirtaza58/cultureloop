# Backend checkpoint: October 21, 2026

## Observed checks

- `npm test`: **56 passed**, zero failures/skips. Includes matching/willingness separation, unknown evidence, copy allocation, cycle revisions, preservation of unaffected approvals, decline/withdrawal/expiry/completion, signed identity proofs and request safeguards.
- `npm run typecheck`: passed, including the Next.js API handlers.
- `npm run demo`: passed, clearly labeled synthetic; three-person exchange, no inferred approvals or provider calls.
- SQL tests use actual embedded PostgreSQL/WASM, not a mocked query engine. Verified membership/invite separation, cross-room isolation, capacity, persistence across repository instances, idempotent acceptance, unique holds and full rollback on SQL failure.
- Cache/rate tests use embedded PostgreSQL with independently authored synthetic provider responses. Verified request deduplication, reuse by a new service instance, rejected malformed cache data, persisted request limits and unchanged room state after partial provider failure.
- Setup diagnostic confirmed Qloo key presence and a locally generated private session signing secret. At the final local check, Gateway key/model and database URL are **not configured**. No secret values were printed. An earlier Gateway check returned HTTP 401 and the earlier configured model was absent from the catalog; that was not a successful runtime gate.

## Live Qloo feasibility

Privately reviewed 24 book identities and five fictional cultural profiles. Fixed-catalog Insights returned 23 of 24 books for each profile, with five different orderings and four distinct first choices. Pairwise rank changes covered 17–22 of the 23 returned books, with maximum shifts of 6–16 positions. One missing book per profile remains unknown. Explainability metadata was present; no generated causal explanation or enjoyment probability was claimed.

36 live requests were observed across the bootstrap and study runs: one bootstrap search, 29 study lookups, one initial small-catalog rank request and five reviewed-catalog rank requests. Subsequent inspection reused private captures. No automatic retry. Raw responses, IDs and private selection/cache artifacts are excluded from public source.

These profiles and inventory are research inputs, not real participant preferences or physical books. Human usefulness is unverified. The earlier numerical 20-identity target alone did not establish feasibility; coverage and observed variation were also reviewed.

## Implemented but not yet verified end to end

Next.js API handlers cover create/join/read, resolved identity selection, offered copies/interests, Qloo ranking, explicit shortlists, generation, decisions, repair and completion. Domain/store/request helpers are tested; handlers have not yet been exercised over HTTP or in a browser. The local file-backed database adapter is implemented, but restart durability has not been demonstrated by this checkpoint's in-memory SQL tests.

The eve agent remains a synthetic preview scaffold. No live inference, hosted tool turn, hosted database migration, hosted concurrency check or deployment has succeeded. The intended Vercel free workspace is unconfirmed. No UI has been built; the entrant deferred UI work until the next session.

Public release still needs stronger deployment-level abuse controls/cleanup, bounded storage/cache retention, full separate-session/browser tests, free quota checks and entrant prototype approval. No tester outreach, fabricated research, final approval or Devpost submission occurred.
