# CultureLoop project instructions

## Start each session

1. Read this file, `PHASE_TRACKER.md`, and `SESSION_HANDOFF.md` first. State the current phase and next checkpoint.
2. Follow the current request; do not start implementation during planning-only work.
3. Inspect Git status if `.git` exists; preserve unrelated changes. Never assume a branch or commit.
4. Read relevant files only. Avoid routine full-repository, chat-history, archive, or planning-document rereads.
5. Resolve recorded-state conflicts through targeted inspection. Follow the instruction hierarchy; new user instructions override project defaults.

## Product and budget constraints

- Solo entrant; CultureLoop exchanges physical books. Scope: 2-6 members/room, up to 3 books and 3 interests/member, cycles of length 2 or 3.
- **Free tiers only**, explicitly required by the user. No purchases, top-ups, upgrades, paid subscriptions/domains, or trials becoming paid. Record quota failures and pursue free alternatives. Record any later explicit budget change.
- Prefer one web app and one agent. Keep training, global matching, marketplaces, and social features outside submission scope.
- No subagents or other-chat creation/messaging without explicit applicable authorization.

## Sources of truth and context discipline

| File | Owns | When to read |
| --- | --- | --- |
| `PHASE_TRACKER.md` | Current phase, task IDs, dependencies, evidence, next actions | Every session |
| `SESSION_HANDOFF.md` | Short resume note, verified environment, immediate dependencies | Every session |
| `docs/DECISIONS.md` | Durable choices, rationale, unresolved decisions | When choosing or changing architecture/scope |
| `docs/BUILD_PLAN.md` | Detailed product workflow and matching contract | When implementing a feature or acceptance check |
| `docs/QLOO_API_REFERENCE.md` | Qloo usage notes and primary links | Before changing Qloo integration |
| `docs/RESOURCES_AND_DEPLOYMENT.md` | Data sources, free hosting, scaling, deployment procedure | Before provisioning, deploying, or changing providers |
| `docs/FRONTEND_DESIGN.md` | User-supplied UI/UX skill and scoped workflow | Before frontend work |

Keep these three startup files within 1,500 words. Replace stale state; do not append transcripts. Link detailed evidence or commits. Read archives only when needed.

## Implementation requirements

- Resolve real Qloo IDs; inspect live responses. Distinguish synthetic, live, and private cached evidence. Never invent scores, explanations, performance, or user results.
- Missing ranks mean unknown; affinity is not an enjoyment probability. Explicit participant choices override suggestions.
- Separate titles from physical copies. Code prevents self-transfers, duplicate allocation, and overlapping cycles.
- Bind approval to revisions; changed transfers invalidate affected approvals. Acquire holds transactionally; repeated requests must be safe.
- Authorize routes/tools server-side. Invite links cannot authorize another member's decisions. Agents cannot invent acceptance.
- Persist state/cache server-side, independently of process memory and trace retention.
- Verify free model eligibility and tool support; do not inherit scaffold defaults blindly. Check actual eve workflow/sandbox usage and quotas before release. Read current runtime docs.
- For frontend work, read `skills/ui-ux-pro-max/SKILL.md` and the frontend guide; verify/persist the design system before new pages. Load catalogs on demand; preserve scope and budget.

## Secrets and public artifacts

- Never request keys in chat or output secret values/files. Check variable names/presence only.
- Use ignored `.env.local` and host secrets; never `NEXT_PUBLIC_` for credentials. `.env.example` contains placeholders.
- Exclude Qloo responses, participant research, caches, database exports, and secret-bearing traces from public artifacts. `.private/` is ignored.
- Send Qloo cultural signals without personal identifiers; anonymize public test evidence.

## Verify and close each work checkpoint

1. Run appropriate checks: meaningful matching/state/access tests for code; link/state checks for docs. Never invent a test pass.
2. DONE requires observed acceptance plus the check/result and artifact/commit. Distinguish verified, proposed, not run, and external dependencies.
3. Update tracker status/evidence after changes. Summarize failures with the relevant error and next remedy.
4. Replace the handoff before yielding: state, changes, checks/limits, dependencies, next 1-3 actions. No session diary.
5. Record durable decisions or reversals with rationale; explicitly supersede old decisions.
6. Report changes, verification, and next checkpoint. No unsupported deployment, key, or completion claims.

<!-- postman-cli:installation:start -->
Postman CLI is installed on this device, and can be used for API Engineering work.
<!-- postman-cli:installation:end -->
