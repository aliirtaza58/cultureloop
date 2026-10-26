# Prototype setup

Updated October 26, 2026. Free tiers only. The local UI and direct Google model/tool protocol are verified; the combined hosted room assistant is pending. To review the local example without account provisioning, run `npm ci`, `npm run setup:local`, then `npm run dev:local` and open http://127.0.0.1:3017. Setup preserves the session secret privately. See [the README](../README.md) for the review flow.

## What each service does

| Service / setting | Purpose |
| --- | --- |
| Qloo / `QLOO_API_KEY` | Resolves cultural identities and ranks room books; already live-tested |
| Vercel Hobby workspace | Owns the future hosted web project; a workspace name does not establish its plan |
| Google AI Studio / `GOOGLE_GENERATIVE_AI_API_KEY` | Direct Gemini model access; separate from Qloo and hosting |
| `CULTURELOOP_MODEL_PROVIDER` / `GOOGLE_MODEL` | Explicit provider and verified free model selection |
| AI Gateway / `AI_GATEWAY_API_KEY`, `AI_GATEWAY_MODEL` | Optional explicit alternative; no automatic provider fallback |
| PostgreSQL / `DATABASE_URL` | Persists private rooms, decisions, holds and Qloo cache |
| `SESSION_SECRET` | Signs temporary selections of server-resolved identities; setup:local generates/preserves it privately |
| `CULTURELOOP_APP_ORIGIN` | Exact public origin used for request validation; dev:local supplies http://127.0.0.1:3017 |

There is no additional “Qloo agent key.” The assistant will call shared application services. Qloo ranks books; the assistant cannot approve exchanges for real participants.

## 1. Confirm the intended Vercel workspace

1. Sign into [Vercel](https://vercel.com/dashboard) using your intended account.
2. Select your intended workspace in the dashboard workspace selector. Open its Settings / Billing and confirm **Hobby**, not a Pro trial. An unfamiliar workspace name may still be yours; verify ownership and plan rather than renaming or upgrading it.
3. If the connected Vercel app is authorized against another account, open its connection settings and reconnect while signed into the intended account. Use the authorization flow; never paste a Vercel token into chat. If the same workspace remains visible, provide its non-secret slug and confirm its plan so the target can be checked.
4. The local web scaffold is ready; a CultureLoop hosting project does not exist yet. Confirm account/plan access before linking the project or provisioning shared resources. Importing alone does not establish a working deployment or agent.

[Hobby documentation](https://vercel.com/docs/plans/hobby). If dashboard access works but the connector remains on another account, a local CLI login is an alternative: `npx vercel@latest login`, then `npx vercel@latest switch` to select the intended workspace. This CLI login does not reconnect the app connector. Do not run a deploy command yet. [CLI scope selection](https://vercel.com/docs/cli/switch).

## 2. Configure the model separately

1. Open [Google AI Studio](https://aistudio.google.com/api-keys), select the intended Free project and save its key as `GOOGLE_GENERATIVE_AI_API_KEY` in ignored `.env.local`. Do not enable paid billing. Check actual quota in AI Studio; a valid key alone does not establish it.
2. Set `CULTURELOOP_MODEL_PROVIDER=google` and `GOOGLE_MODEL` to the verified `googlePrototypeModel` in [configuration](../src/server/assistant-configuration.ts). The prototype rejects other Google model IDs. Check [Google pricing](https://ai.google.dev/gemini-api/docs/pricing) and [model capabilities](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) before changing it. Free-tier request content may be used for product improvement; keep model context pseudonymous.
3. Preserve existing Qloo/session settings. Keep `CULTURELOOP_FREE_AI_VERIFIED=false` until the intended account's Free status, credentials and model eligibility have been checked. The flag itself is not evidence.
4. Run read-only metadata diagnostics:

   ```powershell
   npm run setup:check
   npm run setup:check -- --google
   ```

   Expected: `googleModelsHttp: 200`, `configuredGoogleModelInCatalog: true`, `googleGenerationSupported: true`. No inference/database call occurs; diagnostics print no credentials or provider bodies.
5. After free account verification, enable the model gate and run `npm run model:verify -- --live`. It performs at most two model steps, one synthetic calculator tool execution, 256 output tokens per step and no automatic retry. This verifies live model/tool protocol, not hosted room authorization or database persistence. The direct application model caps each request at 512 output tokens in addition to existing session limits.

Gateway remains available only through explicit `CULTURELOOP_MODEL_PROVIDER=gateway` with its own verified `AI_GATEWAY_MODEL` and Gateway key/OIDC. `npm run setup:check -- --gateway` reads its catalog/credits without inference. Google errors never switch providers automatically. Gateway has a finite restricted-model free allowance; no purchases/top-ups are authorized. [Gateway pricing](https://vercel.com/docs/ai-gateway/pricing).

## 3. Prepare hosted persistence

1. After the hosting target is confirmed, sign into [Neon](https://console.neon.tech). Select an organization on the **Free** plan and create a small `cultureloop` project, without a paid trial/add-on. Verify the actual plan and allowance. [Plans](https://neon.com/pricing).
2. Open **Connect**, select the intended development branch/database/role, and choose a pooled PostgreSQL connection. Save its connection string privately as `DATABASE_URL` in `.env.local`. Preserve its SSL parameters. [Connection instructions](https://neon.com/docs/get-started/connect-neon).
3. Report only that the free database is ready and its non-secret project/branch name. The implementation session will verify the target, apply [the schema](../db/001_rooms.sql), and test transactions. Keep `CULTURELOOP_HOSTED_DB_VERIFIED=false` until this check. Entering a URL does not establish connectivity or schema installation.
4. Local embedded PostgreSQL is available for tests and later local prototype development, using `CULTURELOOP_LOCAL_PROTOTYPE=true`. It stores data under ignored `.private/prototype-db`. Never enable embedded storage on Vercel; it is not hosted persistence.
5. Run only one server process against this embedded directory at a time. The standalone eve runtime and web app were checked sequentially. Their combined service deployment requires the shared hosted PostgreSQL target; do not start both against the same local files.

## 4. Deploy and test after free account access is verified

The source now contains a programmatic `vercel.ts` service graph: the existing Next.js app and one eve runtime build together. Only `/cultureloop/rooms/:roomId/messages` and `/stream` are added as custom agent routes; existing room APIs stay on Next.js. The standard eve session API remains denied, with a public health probe. This configuration uses [Vercel Services, currently beta on all plans](https://vercel.com/docs/services); actual account allowances and hosted behavior remain unverified.

After the free shared database has been verified, stop the standalone web/agent servers, run `npm run services:check`, then `npm run dev:services`. The latter uses the pinned official Vercel CLI in local-only mode and listens on 127.0.0.1:3017. The preflight refuses missing/unverified database settings and embedded storage before downloading the CLI or starting services. It confirms configuration presence, not database connectivity or free eligibility. The Node service launchers preserve the public origin, accept service-assigned ports, and reject port 3000. Combined startup is still pending a real shared database.

1. Link the repository to a `cultureloop` project in the confirmed Hobby workspace. Complete the eve/free-service check first; its active implementation timebox is four hours. If it cannot complete a free hosted round trip, use the planned bounded Next.js AI SDK fallback with the same domain services. Neither path bypasses free model eligibility.
2. In the project's environment settings, add server-only Qloo, database, session-secret and model settings, plus `CULTURELOOP_APP_ORIGIN` matching its exact HTTPS origin. Use supported project OIDC for Gateway where possible; otherwise store its private Gateway key. Do not use `NEXT_PUBLIC_` for credentials. Confirm database target/plan/schema before enabling the hosted DB opt-in. Keep local embedded mode off.
3. Deploy a preview; verify browser → API → database → Qloo/model → response behavior, persistence across reloads, separate participant sessions and transactional holds.
4. Provide the entrant a working prototype URL for extensive testing and feedback. Obtain explicit prototype approval before final hardening/submission work.
5. Later, publish a stable public URL without Vercel-team login requirements and test judge access from a fresh browser. Devpost submission remains the entrant's action.

Outstanding: entrant prototype review, broader separate-browser usability checks, free account/model verification, hosted migration/concurrency, verifying the prepared service graph and a live tool turn, assistant UI integration, public release hardening and final submission preparation. The agent tools and protected transport have local service/HTTP checks in [assistant verification](ASSISTANT_VERIFICATION.md). Those checks do not establish hosted gates. Local examples and research rooms are fictional; no human usefulness or real physical exchange has been verified.
