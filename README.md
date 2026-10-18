# CultureLoop

An agent-powered book exchange app that uses Qloo to match cultural interests with available books and find exchanges between two or three people.

Source: [aliirtaza58/cultureloop](https://github.com/aliirtaza58/cultureloop). Licensed under [MIT](LICENSE); the supplied UI/UX skill retains its [upstream license](skills/ui-ux-pro-max/LICENSE).

## Run the Phase 1 foundation

Requires Node.js 24 or newer and npm. Install the pinned dependencies with `npm ci`.

```powershell
npm test
npm run typecheck
npm run demo
```

The command-line demo is an independently authored **synthetic** three-person exchange. It makes no Qloo or model calls, changes no real inventory, and records no participant approvals. Tests cover the matching contract and mocked Qloo transport behavior. No web UI or hosted application exists yet.

The solver separates canonical book identities from physical copies, finds compatible two-/three-person cycles, and prioritizes coverage, weakest recipient rank utility, then total utility. Utility is an application ranking heuristic, not an enjoyment probability. Missing evidence is unknown; explicit wishes and vetoes constrain suggestions.

## Qloo feasibility probe

Configure the issued key privately in ignored `.env.local`, using [.env.example](.env.example) for variable names. Never commit the key or captured Qloo responses.

```powershell
npm run qloo:probe -- --help
npm run qloo:probe -- search book "The Hobbit"
```

Each search/rank invocation makes at most one GET request, with a timeout and no automatic retries. Actual responses are saved only under ignored `.private/qloo-probes/` for inspection. The adapter is not yet verified against the entrant's live key; inspect returned IDs, coverage, ranks, and explanation warnings before connecting it to proposals.

## Agent scaffold

The eve 0.80.1 scaffold exposes one synthetic sample-preview tool, with optional default tools disabled. It deliberately has no default model. Model execution requires an account-verified free-tier tool-capable `AI_GATEWAY_MODEL` and private model authentication; no model request or hosted runtime has been verified. Session token limits are not an account-wide spending guarantee.

Room storage, membership authorization, participant approvals, browser UI, and deployment remain later checkpoints. Follow the phase tracker before attempting agent development or hosted setup.

## Resume a session

Start with [AGENTS.md](AGENTS.md), [PHASE_TRACKER.md](PHASE_TRACKER.md), and [SESSION_HANDOFF.md](SESSION_HANDOFF.md). These contain the rules, current phase, and next actions. The user requires **free tiers only**.

## Project references

- [Build plan](docs/BUILD_PLAN.md): scope, milestones, architecture, validation, and submission preparation.
- [Qloo API reference](docs/QLOO_API_REFERENCE.md): authentication, supported request flow, troubleshooting, and source links.
- [Resources and deployment](docs/RESOURCES_AND_DEPLOYMENT.md): data acquisition, free hosting, scaling, and judge access.
- [Decision log](docs/DECISIONS.md): durable choices and open architecture decisions.
- [Environment template](.env.example): proposed variable names, with no credentials.
- [Frontend design workflow](docs/FRONTEND_DESIGN.md): supplied UI/UX skill, scope, and future design-system checkpoint.

Read the Qloo reference before implementing or changing API calls. Recheck its linked official documentation when choosing parameters or investigating a changed response.

Current task status and verification belong in the phase tracker. Read the relevant references on demand rather than loading the entire project history.
