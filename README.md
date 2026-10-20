# CultureLoop

A prototype for friends and students exchanging physical books locally. Qloo ranks a room's catalog from voluntary cultural interests. Members explicitly shortlist acceptable books, then review proposed two- or three-person exchanges and approve their own transfers.

Source: [aliirtaza58/cultureloop](https://github.com/aliirtaza58/cultureloop). Licensed under [MIT](LICENSE). Development and hosting use **free tiers only**.

## Verify the backend

Requires Node.js 24 or newer and npm. Install pinned dependencies with `npm ci`.

```powershell
npm test
npm run typecheck
npm run demo
npm run setup:check
```

The command-line demo and public fixtures are independently authored **synthetic** examples. They make no live Qloo or model calls, change no real inventory and record no participant approvals. Tests include embedded PostgreSQL transactions, membership isolation, holds, repair, caching and request safeguards. Hosted concurrency and browser flows remain unverified.

The solver separates titles from physical copies and prioritizes members served, weakest recipient rank utility, then total utility. This utility is an application heuristic, not an enjoyment probability. Shortlists remain separate from ranks; missing evidence stays unknown. Unchanged disjoint cycles retain approvals during repair; changed transfers require fresh approval.

## Current prototype status

Live Qloo authentication, identity resolution and fixed-catalog ranking were verified privately. Room/domain services, a PostgreSQL schema, signed identity selections and Next.js API handlers are implemented. API handlers have not yet passed an HTTP/browser integration check. There is **no web UI or hosted application yet**.

The eve 0.80.1 scaffold has no default model. The intended free hosting account, model authentication/eligibility, hosted database and a real hosted agent tool turn must be verified before release. Retain eve only if the four-hour hosted feasibility checkpoint succeeds; otherwise use the bounded AI SDK fallback described in the plan.

The entrant will test and approve the prototype before the final submission version is prepared. UI work is deferred to the next session.

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
- [Resources and deployment](docs/RESOURCES_AND_DEPLOYMENT.md): data, free hosting and scaling.
- [Decision log](docs/DECISIONS.md): durable choices.
- [Initial foundation verification](docs/FOUNDATION_VERIFICATION.md): historical first-checkpoint results.
