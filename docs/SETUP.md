# Prototype setup

Updated October 22, 2026. Free tiers only. The local UI is available; no hosted deployment or live model turn is verified. To review the local example without account provisioning, run `npm ci`, `npm run setup:local`, then `npm run dev:local` and open http://127.0.0.1:3017. Setup generates/preserves the session secret without displaying it. See [the README](../README.md) for the review flow.

## What each service does

| Service / setting | Purpose |
| --- | --- |
| Qloo / `QLOO_API_KEY` | Resolves cultural identities and ranks room books; already live-tested |
| Vercel Hobby workspace | Owns the future hosted web project; a workspace name does not establish its plan |
| AI Gateway / `AI_GATEWAY_API_KEY` | Authenticates the assistant's model requests; separate from Qloo and Vercel account tokens |
| `AI_GATEWAY_MODEL` | Exact model ID, eligible for free credit and capable of tool calling |
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

1. In the confirmed workspace, open **AI Gateway**. Check its Credits/Billing area: use included free credit only, with auto top-up disabled. Do not purchase credits or upgrade. If free access requires a purchase or is unavailable, record the blocker and use a different verified free route.
2. Open AI Gateway → **API Keys** → **Create key**. Name it `cultureloop-prototype`. Copy it directly into `AI_GATEWAY_API_KEY` in your ignored `.env.local`. This must be a Gateway key, not the Qloo key or a general Vercel access token. [Official key instructions](https://vercel.com/docs/ai-gateway/authentication-and-byok/api-keys).
3. Browse the [Free Tier model catalog](https://vercel.com/ai-gateway/models?freeTier=true). Choose a text model with tool calling and copy its exact `provider/model` ID into `AI_GATEWAY_MODEL`. The unrestricted catalog alone does not prove free eligibility. If uncertain, configure the key first and let the implementation session verify/select the model from the current eligible list.
4. Save `.env.local`. Preserve the existing Qloo key and session secret. Do not copy the blank template over your environment files.
5. From the repository, run:

   ```powershell
   npm run setup:check
   npm run setup:check -- --gateway
   ```

   The second command only reads the public model catalog and authenticated credit endpoint. Expected metadata checks: `configuredModelInCatalog: true`, `gatewayCreditsHttp: 200`. A 401 means the key is invalid or inaccessible; create/check a key in the correct workspace. Diagnostics never print keys or provider response bodies.
6. Confirm the workspace slug and that free credit is available/top-ups are off. The implementation session must still verify account eligibility and one bounded real tool-calling turn. HTTP 200/catalog membership alone do not pass that gate. Keep `CULTURELOOP_FREE_AI_VERIFIED=false` until free eligibility, credentials and disabled top-ups have been checked; setting the flag is not evidence of verification.

Gateway currently documents $5/month of included credit for a restricted model subset. This is a metered allowance, not unlimited free inference. [Pricing and free eligibility](https://vercel.com/docs/ai-gateway/pricing).

## 3. Prepare hosted persistence

1. After the hosting target is confirmed, sign into [Neon](https://console.neon.tech). Select an organization on the **Free** plan and create a small `cultureloop` project, without a paid trial/add-on. Verify the actual plan and allowance. [Plans](https://neon.com/pricing).
2. Open **Connect**, select the intended development branch/database/role, and choose a pooled PostgreSQL connection. Save its connection string privately as `DATABASE_URL` in `.env.local`. Preserve its SSL parameters. [Connection instructions](https://neon.com/docs/get-started/connect-neon).
3. Report only that the free database is ready and its non-secret project/branch name. The implementation session will verify the target, apply [the schema](../db/001_rooms.sql), and test transactions. Keep `CULTURELOOP_HOSTED_DB_VERIFIED=false` until this check. Entering a URL does not establish connectivity or schema installation.
4. Local embedded PostgreSQL is available for tests and later local prototype development, using `CULTURELOOP_LOCAL_PROTOTYPE=true`. It stores data under ignored `.private/prototype-db`. Never enable embedded storage on Vercel; it is not hosted persistence.
5. Run only one server process against this embedded directory at a time. The standalone eve runtime and web app were checked sequentially. Their combined service deployment requires the shared hosted PostgreSQL target; do not start both against the same local files.

## 4. Deploy and test after free account access is verified

1. Link the repository to a `cultureloop` project in the confirmed Hobby workspace. Complete the eve/free-service check first; its active implementation timebox is four hours. If it cannot complete a free hosted round trip, use the planned bounded Next.js AI SDK fallback with the same domain services. Neither path bypasses free model eligibility.
2. In the project's environment settings, add server-only Qloo, database, session-secret and model settings, plus `CULTURELOOP_APP_ORIGIN` matching its exact HTTPS origin. Use supported project OIDC for Gateway where possible; otherwise store its private Gateway key. Do not use `NEXT_PUBLIC_` for credentials. Confirm database target/plan/schema before enabling the hosted DB opt-in. Keep local embedded mode off.
3. Deploy a preview; verify browser → API → database → Qloo/model → response behavior, persistence across reloads, separate participant sessions and transactional holds.
4. Provide the entrant a working prototype URL for extensive testing and feedback. Obtain explicit prototype approval before final hardening/submission work.
5. Later, publish a stable public URL without Vercel-team login requirements and test judge access from a fresh browser. Devpost submission remains the entrant's action.

Outstanding: entrant prototype review, broader separate-browser usability checks, free account/model verification, hosted migration/concurrency, mounting the custom agent channel and verifying a live tool turn, assistant UI integration, public release hardening and final submission preparation. The agent tools and protected transport have local service/HTTP checks in [assistant verification](ASSISTANT_VERIFICATION.md). Those checks do not establish hosted gates. Local examples and research rooms are fictional; no human usefulness or real physical exchange has been verified.
