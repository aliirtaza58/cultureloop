# CultureLoop

A prototype for friends and students exchanging physical books locally. Qloo ranks a room's catalog from voluntary cultural interests. Members explicitly shortlist acceptable books, then review proposed two- or three-person exchanges and approve their own transfers.

Source: [aliirtaza58/cultureloop](https://github.com/aliirtaza58/cultureloop). Licensed under [MIT](LICENSE). Development and hosting use **free tiers only**.

## Run the local prototype

Requires Node.js 24 or newer and npm.

```powershell
npm ci
npm run setup:local
npm run dev:local
```

Open **http://127.0.0.1:3017**. The setup command preserves an existing valid session secret or creates one privately in ignored `.env.local`. The local server uses file-backed embedded PostgreSQL under ignored `.private/prototype-db`, independently of any hosted database URL. Port 3000 is not used. To choose another port, set `PORT` before starting.

The example needs no Qloo/model key. Try the example, open **Your shortlist**, load the explicitly labeled example choices, then open **The exchange** and find exchanges. Simulate each fictional reader separately to approve; withdraw a copy and update exchanges to explore repair. Approved exchanges can be downloaded as a text agreement or printed. Completion requires a separate explicit confirmation.

For live rooms, configure your Qloo key privately, create a room, share its invitation and join from separate browser profiles. Resolve/confirm offered books and favorites, request Qloo suggestions, then shortlist acceptable books. No LLM is required for these deterministic exchange controls; the planned assistant remains a separate gate. Check edition/condition and arrange handoffs directly with your group.

## Verify

```powershell
npm test
npm run typecheck
npm run demo
npm run setup:check
npm run build
```

The command-line demo and public fixtures are independently authored **synthetic** examples. They make no live Qloo or model calls, change no real inventory and record no real participant approvals. Tests cover matching, embedded PostgreSQL transactions, membership isolation, holds, repair, caching, agreement export and request safeguards. Local HTTP/browser checks and restart persistence have passed; hosted concurrency remains unverified.

With the local server running, `npm run verify:local` checks fictional workflows and access safeguards. `npm run verify:local -- --qloo` additionally uses a bounded two-title research scenario and at most three new Qloo calls (two searches and one rank request); private cache reuse reduces this. Identity ambiguity stops the check for private review. These are fictional inventory/decisions, not participant research. `--resume` verifies the saved agreement after restarting the local server. Do not treat localhost checks as hosted release verification.

The solver separates titles from physical copies and prioritizes members served, weakest recipient rank utility, then total utility. This utility is an application heuristic, not an enjoyment probability. Shortlists remain separate from ranks; missing evidence stays unknown. Unchanged disjoint cycles retain approvals during repair; changed transfers require fresh approval.

## Current prototype status

The local web prototype provides the bookshelf, confirmed cultural favorites, evidence-aware shortlists, exchange review, approvals, withdrawal/repair, completion and agreement download. Qloo-backed HTTP research checks passed using live responses/private cache, with fictional ownership and decisions. Browser example approvals and download passed. Missing Qloo results remain unknown. There is **no hosted application yet**.

The eve 0.80.1 scaffold has no default model. The intended free hosting account, model authentication/eligibility, hosted database and a real hosted agent tool turn must be verified before release. Retain eve only if the four-hour hosted feasibility checkpoint succeeds; otherwise use the bounded AI SDK fallback described in the plan.

The entrant will extensively test and explicitly approve the prototype before the final submission version is prepared. Live hosted model/database access, a real assistant/tool turn, public judge access and production hardening remain outstanding.

## Private configuration and Qloo checks

Follow the [setup guide](docs/SETUP.md). Variable names are in [.env.example](.env.example); credentials belong in ignored `.env.local` and host secrets. Scripts also read an existing ignored `.env`, with `.env.local` taking precedence. Never commit captured Qloo responses.

```powershell
npm run qloo:probe -- --help
npm run qloo:probe -- search book "The Hobbit"
npm run setup:check -- --gateway
```

The search command makes one live GET with no automatic retries, saving responses privately. The optional Gateway diagnostic reads model/credit metadata only and makes no inference request. `npm run qloo:verify` performs a bounded research study of up to 35 new requests; it reuses private captures and requires review of ambiguous identities. Do not rerun merely to verify a build.

## Project references

- [Setup](docs/SETUP.md): account, model and database configuration; outstanding gates.
- [Backend verification](docs/PROTOTYPE_BACKEND_VERIFICATION.md): observed checks and limitations.
- [Build plan](docs/BUILD_PLAN.md): workflow, matching contract and checkpoints.
- [Qloo API reference](docs/QLOO_API_REFERENCE.md): usage and official sources.
- [Hackathon kit notes](docs/QLOO_KIT_NOTES.md): useful workflows, provenance and MCP deployment limits.
- [Resources and deployment](docs/RESOURCES_AND_DEPLOYMENT.md): data, free hosting and scaling.
- [Decision log](docs/DECISIONS.md): durable choices.
- [Initial foundation verification](docs/FOUNDATION_VERIFICATION.md): historical first-checkpoint results.
