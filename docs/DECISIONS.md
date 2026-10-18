# CultureLoop decision log

Keep durable choices here; current task progress belongs in ../PHASE_TRACKER.md. New entries should state status, date, decision, and reason. Supersede meaningful reversals explicitly.

## D001 — Product direction

- Date: 2026-10-18. Status: selected by user.
- Build CultureLoop: cultural-taste-assisted physical-book exchange with two- and three-person cycles.
- Reason: connects Qloo's cross-domain evidence to an actionable inventory-constrained workflow.

## D002 — Budget

- Date: 2026-10-18. Status: explicit user constraint.
- Free tiers only. No purchases, upgrades, paid trials, automatic top-ups, or custom-domain purchases.
- Free allowances are finite; quota-aware design and measured capacity are required. Reaching a limit does not authorize spending.

## D003 — Working scope and matching ownership

- Date: 2026-10-18. Status: working implementation scope.
- Rooms of 2-6 members, up to 3 books and 3 interests each, cycles of length 2 or 3. Ordinary code enforces constraints; participants approve exchanges.
- Keep title identity separate from owned physical copies. Missing evidence is unknown; approval is bound to a proposal revision.

## D004 — Data strategy

- Date: 2026-10-18. Status: implementation default.
- Qloo supplies runtime cultural evidence. Members supply offered books and explicit favorites. Seed examples and public tests are independently authored and labeled synthetic.
- No taste-model training dataset, vector database, GPU, or bulk scraping is required. Private responses never become a public dataset.
- Open Library metadata is optional; core flow must work without it.

## D005 — Proposed deployment

- Date: 2026-10-18. Status: proposed; account/runtime gate not passed.
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

## D008 — Session continuity

- Date: 2026-10-18. Status: requested by user.
- Root AGENTS.md defines startup and closeout rules. PHASE_TRACKER.md owns phase state; SESSION_HANDOFF.md is replaced with a compact current resume note.
- Detailed plan/provider notes are read on demand. No growing transcript diary or routine archive rereads.

## D009 — User-supplied frontend skill

- Date: 2026-10-18. Status: explicitly requested by user; installed.
- Use UI/UX Pro Max from the provided ZIP for frontend design and review. Keep a project copy under skills/ui-ux-pro-max and install it in the Codex user skills folder.
- Retain the MIT license/provenance. Only Claude-specific example script paths were adapted for portability.
- Follow docs/FRONTEND_DESIGN.md; select a verified design master before pages. Product scope, free-only budget, truthful evidence states, and participant decisions take precedence over generic template recommendations.

## D010 — Initial executable foundation

- Date: 2026-10-18. Status: implemented and locally verified.
- The user supplied aliirtaza58/cultureloop as the repository. Initialize main and connect that remote; keep the original skill ZIP and all private responses outside Git.
- Pin Node 24-compatible TypeScript 7.0.2, eve 0.80.1, AI SDK 7.0.137, and Zod 4.6.7 with a lockfile. Use Node's native TypeScript support for the CLI and tests.
- Establish deterministic room-scoped matching and a one-request private Qloo probe before live agent integration. The initial eve tool reads a synthetic fixture only; default tools are disabled and no model is selected automatically.
- Browser UI, persistence, real agent execution, account eligibility, and deployment remain separate checkpoints. Verification: FOUNDATION_VERIFICATION.md.
