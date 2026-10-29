# CultureLoop

A prototype for friends and students exchanging physical books locally. Qloo ranks a room's catalog from voluntary cultural interests. Members explicitly shortlist acceptable books, then review proposed two- or three-person exchanges and approve their own transfers.

Source: [aliirtaza58/cultureloop](https://github.com/aliirtaza58/cultureloop). Licensed under [MIT](LICENSE). Development and hosting use **free tiers only**.

**Live app:** [cultureloop-omega.vercel.app](https://cultureloop-omega.vercel.app/). Start with **Try the example**; its readers, titles, ranks and decisions are explicitly fictional. For live Qloo suggestions, create a real room and join from separate browser sessions.

The entrant selected this prototype as the final submission version on October 29. See the [final checklist](docs/SUBMISSION_CHECKLIST.md) and [Devpost submission copy](docs/DEVPOST_SUBMISSION.md).

## Run the local prototype

Requires Node.js 24 or newer and npm.

```powershell
npm ci
npm run setup:local
npm run dev:local
```

Open **http://127.0.0.1:3017**. The setup command preserves an existing valid session secret or creates one privately in ignored `.env.local`. The local server uses file-backed embedded PostgreSQL under ignored `.private/prototype-db`, independently of any hosted database URL. Port 3000 is not used. To choose another port, set `PORT` before starting.

The example needs no Qloo/model key. Try the example, open **Your shortlist**, load the explicitly labeled example choices, then open **The exchange** and find exchanges. Simulate each fictional reader separately to approve; withdraw a copy and update exchanges to explore repair. Approved exchanges can be downloaded as a text agreement or printed. Completion requires a separate explicit confirmation.

For live rooms, configure your Qloo key privately, create a room, share its invitation and join from separate browser profiles. Resolve/confirm offered books and favorites, request Qloo suggestions, then shortlist acceptable books. No LLM is required for these deterministic exchange controls. The optional assistant needs the separately configured Google/eve service graph described in [setup](docs/SETUP.md); plain local web mode does not start that service. Check edition/condition and arrange handoffs directly with your group.

## Verify

```powershell
npm test
npm run typecheck
npm run demo
npm run setup:check
npm run build
```

The command-line demo and public fixtures are independently authored **synthetic** examples. They make no live Qloo or model calls, change no real inventory and record no real participant approvals. Tests cover matching, PostgreSQL transactions, membership isolation, holds, repair, caching, agreement export and request safeguards. Local HTTP/browser checks and restart persistence have passed. Bounded hosted SQL tests also passed concurrent approval retries and unique holds; general load capacity remains unmeasured.

With the local server running, `npm run verify:local` checks fictional workflows and access safeguards. `npm run verify:local -- --qloo` additionally uses a bounded two-title research scenario and at most three new Qloo calls (two searches and one rank request); private cache reuse reduces this. Identity ambiguity stops the check for private review. These are fictional inventory/decisions, not participant research. `--resume` verifies the saved agreement after restarting the local server. Do not treat localhost checks as hosted release verification.

The solver separates titles from physical copies and prioritizes members served, weakest recipient rank utility, then total utility. This utility is an application heuristic, not an enjoyment probability. Shortlists remain separate from ranks; missing evidence stays unknown. Unchanged disjoint cycles retain approvals during repair; changed transfers require fresh approval.

## Submission version

The web prototype provides the bookshelf, confirmed cultural favorites, evidence-aware shortlists, exchange review, approvals, withdrawal/repair, completion and agreement download. Qloo-backed HTTP checks passed using live responses/private cache, with fictional ownership and decisions. Browser example approvals and download passed. Missing Qloo results remain unknown.

Production runs Next.js and eve with shared Supabase PostgreSQL and direct Google inference. Hosted creation/joining, saved-room reload, guest isolation, Qloo lookup, a real `read_room` tool result and completed eve workflow passed. The Git deployment schema issue and missing Production settings were resolved in `3c02ffb`. Earlier Preview URLs were removed at the entrant's request. See [assistant verification](docs/ASSISTANT_VERIFICATION.md) for evidence and its limits.

The supporting assistant panel accepts explicit questions, streams plain-text replies and refreshes the room. It can read, rank, find and explain exchanges; participants still shortlist and approve themselves. New replies ignore older transcript completions; stopping the browser wait does not cancel a server turn. Production browser checks passed example generation, three separate simulated approvals, agreement download, reload persistence and a completed assistant reply. Six responsive DOM widths showed no control/page overflow. The public Production URL opened without hosting-team login; no protection setting was changed during this work.

Known limits: sparse Qloo coverage can leave ranks unknown; the example does not call Qloo; assistant Markdown appears as plain text; hosted resource headroom is unmeasured. No real-participant study or physical handoff is claimed. Additional comprehensive testing is deferred by the entrant's October 29 decision; submission preparation uses focused checks.

## Private configuration and Qloo checks

Follow the [setup guide](docs/SETUP.md). Variable names are in [.env.example](.env.example); credentials belong in ignored `.env.local` and host secrets. Scripts also read an existing ignored `.env`, with `.env.local` taking precedence. Never commit captured Qloo responses.

```powershell
npm run qloo:probe -- --help
npm run qloo:probe -- search book "The Hobbit"
npm run setup:check -- --gateway
```

The search command makes one live GET with no automatic retries, saving responses privately. `npm run setup:check -- --google` reads model metadata without inference; `npm run model:verify -- --live` performs a bounded synthetic calculator/tool protocol check after free access is verified. Gateway diagnostics remain an explicit alternative. See [setup](docs/SETUP.md). `npm run qloo:verify` performs a bounded study of up to 35 new requests; it reuses private captures and requires review of ambiguous identities. Do not rerun merely to verify a build.

## Project references

- [Setup](docs/SETUP.md): account, model and database configuration; outstanding gates.
- [Backend verification](docs/PROTOTYPE_BACKEND_VERIFICATION.md): observed checks and limitations.
- [Hosted checks](docs/HOSTED_EXCHANGE_VERIFICATION.md): exchange lifecycle, live/cached evidence and assistant results.
- [Prototype review](docs/PROTOTYPE_REVIEW.md): entrant testing and feedback before final approval.
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md): current requirements and outstanding release gates.
- [Build plan](docs/BUILD_PLAN.md): workflow, matching contract and checkpoints.
- [Qloo API reference](docs/QLOO_API_REFERENCE.md): usage and official sources.
- [Hackathon kit notes](docs/QLOO_KIT_NOTES.md): useful workflows, provenance and MCP deployment limits.
- [Resources and deployment](docs/RESOURCES_AND_DEPLOYMENT.md): data, free hosting and scaling.
- [Decision log](docs/DECISIONS.md): durable choices.
- [Initial foundation verification](docs/FOUNDATION_VERIFICATION.md): historical first-checkpoint results.
