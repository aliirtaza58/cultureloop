# CultureLoop decision log

This log records product and architecture choices, their status, and rationale.

## D018 — Reuse free Google and PostgreSQL accounts

- Date: 2026-10-26; updated 2026-10-27. Status: direct Google/local eve and hosted PostgreSQL transaction/access checks verified; shared hosted runtime pending.
- Supersedes D005's proposed Neon/Gateway defaults: use direct Google AI Studio for inference and the entrant's dedicated Supabase PostgreSQL target for state. Preserve the existing web app, eve runtime, SQL services and matching contract. No MongoDB rewrite or Supabase Auth migration.
- Explicit provider selection, a verified Google model allowlist, per-call output cap and existing session gates bound inference. No automatic provider or paid-model fallback. Pin the Google adapter to the installed AI SDK/provider versions.
- Google Free content processing is a documented tradeoff: send only existing pseudonymous tool context, without personal identifiers/secrets. Free status is entrant-reported; actual key and tool requests are separately observed.
- Database setup must verify TLS with the project's CA, private table access and transactions before enabling the hosted flag. Existing unrelated projects remain untouched. The four-hour hosted eve gate and prototype approval requirement remain unchanged.

## D015 — Shared assistant operations

- Date: 2026-10-23. Status: application services tested; live runtime pending.
- Bind assistant tools to server-verified room access. Model arguments cannot select another room/member, create willingness, approve transfers or report completion.
- Button and assistant ranking/generation use the same operations. The model receives pseudonymous reader labels, evidence provenance and explicit unknowns; guest capabilities and aliases stay outside tool results.
- Preserve eve and the existing four-hour free hosted gate. Service tests do not establish model execution or hosted access. Evidence: [assistant verification](ASSISTANT_VERIFICATION.md).

## D016 — Agent runtime and conversation ownership

- Date: 2026-10-23. Status: agent build and local fail-closed HTTP checks passed; free hosted round trip pending.
- Use a custom eve channel with server-derived room/guest conversation addresses. Deny the standard session/control/stream API; preserve its health route. The model receives no guest capability and cannot select a conversation address.
- Resolve the configured model at runtime with the free-access gate checked before each model step. Static builds need no model credentials; they do not verify inference.
- Pin just-bash for an in-process sandbox and disable automatic installs/default model tools. Actual hosted Workflow and other resource quotas still require verification.
- Keep embedded local PostgreSQL limited to one server process at a time. Integrated web/agent services require the verified free hosted database. No architecture fallback or timebox exemption is implied.

## D017 — One web/agent service graph

- Date: 2026-10-25. Status: source configuration and launch guards tested; combined/hosted operation pending.
- Compose the existing root Next.js app and root eve agent through `eve/vercel`, without moving or restarting the project. Route only the custom room-assistant endpoints to eve; keep existing room APIs on web.
- Use portable Node development launchers and the pinned CLI's local-only mode. Combined startup requires verified network PostgreSQL and refuses embedded storage/port 3000. Retain the plain local web mode for prototype review while accounts are pending.
- Vercel Services remains beta; free plan/resource checks and the actual hosted agent gate still apply. See [setup](SETUP.md).

## D001 — Product direction

- Date: 2026-10-18. Status: selected by user.
- Build CultureLoop: cultural-taste-assisted physical-book exchange with two- and three-person cycles.
- Reason: connects Qloo's cross-domain evidence to an actionable inventory-constrained workflow.

## D002 — Budget

- Date: 2026-10-18. Status: explicit user constraint.
- Free tiers only. No purchases, upgrades, paid trials, automatic top-ups, or custom-domain purchases.
- Free allowances are finite; quota-aware design and measured capacity are required. Reaching a limit does not authorize spending.

## D003 — Working scope and matching ownership

- Date: 2026-10-18. Status: scope retained; willingness and approval details superseded by D011/D013.
- Rooms of 2-6 members, up to 3 books and 3 interests each, cycles of length 2 or 3. Ordinary code enforces constraints; participants approve exchanges.
- Keep title identity separate from owned physical copies. Missing evidence is unknown; approval is bound to a proposal revision.

## D004 — Data strategy

- Date: 2026-10-18. Status: implementation default.
- Qloo supplies runtime cultural evidence. Members supply offered books and explicit favorites. Seed examples and public tests are independently authored and labeled synthetic.
- No taste-model training dataset, vector database, GPU, or bulk scraping is required. Private responses never become a public dataset.
- Open Library metadata is optional; core flow must work without it.

## D005 — Proposed deployment

- Date: 2026-10-18. Status: proposed; runtime fallback policy superseded by D012; free account gate remains.
- Next.js/TypeScript web app plus one eve agent on Vercel Hobby; Neon Free Postgres for application state; AI Gateway free-tier-eligible model.
- Reason: follows the existing plan while keeping the web app and agent in one project and avoiding a self-managed server.
- Gate: verify actual free eligibility, tool-capable model access, runtime requirements, retention, and quotas in the entrant's account before relying on this deployment. Exact model and versions remain open.
- The default eve scaffold's model is not automatically approved. If the free setup fails, document an alternative that preserves the product and free-only constraint before changing the architecture.

## D006 — State and scaling

- Date: 2026-10-18. Status: implementation default.
- SQL owns rooms, evidence/cache records, proposals, and holds. Match within small rooms; do not compute a global exchange graph.
- Start with pooled connections, request deduplication, cache reuse, bounded provider concurrency, and transactional holds. Add infrastructure only for a measured need within free allowances.

## D007 — Judge access

- Date: 2026-10-18. Status: submission requirement translated into implementation scope.
- Public hosted URL, guest entry, editable example room, new-room workflow, and public licensed source. No personal API key, private hosting-team membership, local server, or developer intervention for judges.
- Preserve core application state independently of short-lived agent traces. Record actual deployed URL and validation evidence only after a successful deployment.

## D010 — Initial executable foundation

- Date: 2026-10-18. Status: implemented and locally verified.
- Source repository: aliirtaza58/cultureloop. Keep private responses outside Git.
- Pin Node 24-compatible TypeScript 7.0.2, eve 0.80.1, AI SDK 7.0.137, and Zod 4.6.7 with a lockfile. Use Node's native TypeScript support for the CLI and tests.
- Establish deterministic room-scoped matching and a one-request private Qloo probe before live agent integration. The initial eve tool reads a synthetic fixture only; default tools are disabled and no model is selected automatically.
- Browser UI, persistence, real agent execution, account eligibility, and deployment remain separate checkpoints. Verification: FOUNDATION_VERIFICATION.md.

## D011 — Willingness is separate from taste evidence

- Date: 2026-10-21. Status: explicitly authorized revised plan.
- Target friends/students exchanging physical books locally. Store explicit acceptable-book shortlists separately from Qloo rankings. Matching requires willingness; shortlisting never overwrites rank or records approval.
- Unranked but shortlisted books remain eligible with unknown evidence. Zero contributes only to solver tie breaking, never an affinity display. Retain coverage/weakest-rank/total-rank/deterministic priorities.

## D012 — Bounded runtime feasibility

- Date: 2026-10-21. Status: authorized revised plan; hosted gate unverified.
- Retain eve if a free hosted tool round trip succeeds within four focused implementation hours. Record time and failures. Otherwise use one bounded AI SDK agent in Next.js with the same domain services.
- Neither choice bypasses free inference verification. Spending, paid trials, top-ups, tester messages, and Devpost submission are not authorized.

## D013 — Repair at cycle boundaries

- Date: 2026-10-21. Status: explicitly authorized revised plan.
- Preserve unchanged disjoint cycles and approvals. Changed cycles require fresh approval bound to that cycle's revision and displayed transfers.
- Transactional availability checks/holds and idempotent retries prevent duplicate allocation. Withdrawal releases affected holds; completed cycles cannot be silently rewritten.

## D014 — Prototype before final submission version

- Date: 2026-10-21. Status: explicitly required by the entrant.
- Current implementation is a prototype for extensive entrant testing. Collect feedback and obtain explicit prototype approval before progressing to the final submission version.
- Permit local embedded PostgreSQL for prototype review with the same SQL store; hosted PostgreSQL/model gates remain independently unverified until tested. No synthetic replacement for failed live evidence and no Devpost submission is authorized.
