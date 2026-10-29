# Prototype setup

Updated October 29, 2026. Free tiers only. The deployed submission version is [CultureLoop](https://cultureloop-omega.vercel.app/); Production SQL, Qloo lookup and a real Google/eve tool turn have passed. The entrant approved the current prototype for submission. To run the local example, use `npm ci`, `npm run setup:local`, then `npm run dev:local` and open http://127.0.0.1:3017. Setup preserves the session secret privately. See [the README](../README.md).

## What each service does

| Service / setting | Purpose |
| --- | --- |
| Qloo / `QLOO_API_KEY` | Resolves cultural identities and ranks room books; already live-tested |
| Vercel Hobby workspace | Hosts the deployed web/agent project; Hobby was independently confirmed |
| Google AI Studio / `GOOGLE_GENERATIVE_AI_API_KEY` | Direct Gemini model access; separate from Qloo and hosting |
| `CULTURELOOP_MODEL_PROVIDER` / `GOOGLE_MODEL` | Explicit provider and verified free model selection |
| AI Gateway / `AI_GATEWAY_API_KEY`, `AI_GATEWAY_MODEL` | Optional explicit alternative; no automatic provider fallback |
| PostgreSQL / `DATABASE_URL` | Persists private rooms, decisions, holds and Qloo cache |
| `DATABASE_SSL_CA` / `DATABASE_SSL_CA_FILE` | Verified database TLS; choose inline PEM on the host or an ignored local CA file |
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

1. Open [Supabase](https://supabase.com/dashboard), confirm the intended organization is **Free**, and use a dedicated `cultureloop-prototype` project. Preserve unrelated projects. If the free project allowance is exhausted, stop before upgrading or creating another billable resource. [Plans](https://supabase.com/pricing).
2. In the dedicated project, disable **Integrations → Data API → Enable Data API**. The app uses server-only PostgreSQL, not browser Supabase data endpoints. Inspect existing tables and apply appropriate private grants/RLS before loading room/cache data; the generic SQL schema alone does not establish Supabase API isolation. [Data API security](https://supabase.com/docs/guides/api/securing-your-api).
3. Open **Connect → Transaction pooler** (port 6543). Save the URI as `DATABASE_URL` in ignored `.env.local`. Replace the entire password placeholder, including its template brackets, with the URL-encoded database password. Use the project's database password, not the Supabase account password/API key. [Connection instructions](https://supabase.com/docs/guides/database/connecting-to-postgres).
4. Under **Database → Settings → SSL Configuration**, download the database CA certificate and save it under ignored `.private/supabase-ca.crt`. Set `DATABASE_SSL_CA_FILE=.private/supabase-ca.crt` locally. For hosting, supply the PEM in the server-only `DATABASE_SSL_CA` environment variable instead; literal newlines or escaped `\n` are supported. Configure only one CA source. Never disable certificate verification to fix a trust error. [SSL guidance](https://supabase.com/docs/guides/platform/ssl-enforcement).
5. Keep `CULTURELOOP_HOSTED_DB_VERIFIED=false` until the dedicated Free target, TLS, login, schema and transaction/access checks pass. The app requires certificate/hostname verification and refuses TLS options that override it. PostgreSQL `28P01` means authentication failed; certificate-chain errors are separate.
6. Run `npm run db:setup -- --project-ref YOUR_PROJECT_REF` to inspect the dedicated target. After confirming Free, run the same command with `--apply`. It refuses unrelated public tables, checks the target, and applies the versioned migration through the pinned Supabase CLI as one atomic statement. Database passwords go through the child environment, not command arguments. The migration preserves the existing schema contract, enables RLS, and revokes browser-role grants only on CultureLoop tables. Then run `npm run db:verify -- --project-ref YOUR_PROJECT_REF`; it exercises synthetic create/join, membership, concurrent approval/hold and rollback behavior against hosted SQL, cleaning up its own fixture. Enable the application hosted flag only after those checks pass.
7. Local embedded PostgreSQL remains available with `CULTURELOOP_LOCAL_PROTOTYPE=true`, under ignored `.private/prototype-db`. Use one process at a time. Never enable it on Vercel or share these files between web/eve processes; combined services need verified network PostgreSQL. Neon remains a compatible alternative, not an additional requirement.

## 4. Deploy and test after free account access is verified

The programmatic `vercel.ts` service graph builds the existing Next.js app and one eve runtime together. Only `/cultureloop/rooms/:roomId/messages` and `/stream` are custom agent routes; room APIs stay on Next.js. The standard eve session API remains denied, with a public health probe. This uses [Vercel Services, beta on all plans](https://vercel.com/docs/services). Hosted behavior has passed; actual remaining allowances are unmeasured.

After the free shared database has been verified, stop the standalone web/agent servers, run `npm run services:check`, then `npm run dev:services`. The latter uses the pinned official Vercel CLI in local-only mode and listens on 127.0.0.1:3017. The preflight refuses missing/unverified database settings and embedded storage before downloading the CLI or starting services. It confirms configuration presence, not database connectivity or free eligibility. The Node service launchers preserve the public origin, accept service-assigned ports, and reject port 3000. The combined local CLI launcher remains unverified after dependency synchronization stalled; the hosted service graph uses the verified shared database successfully.

1. Use the existing `cultureloop` project in the confirmed Hobby workspace. The hosted eve feasibility gate passed; retain the selected runtime and providers. A new checkout still needs its own private configuration and free-plan confirmation.
2. In the project's environment settings, add server-only Qloo, database, session-secret and model settings, plus `CULTURELOOP_APP_ORIGIN` matching its exact HTTPS origin. Use supported project OIDC for Gateway where possible; otherwise store its private Gateway key. Do not use `NEXT_PUBLIC_` for credentials. Confirm database target/plan/schema before enabling the hosted DB opt-in. Keep local embedded mode off.
3. Deploy a preview; verify browser → API → database → Qloo/model → response behavior, persistence across reloads, separate participant sessions and transactional holds.
4. The entrant approved the existing version on October 29. Preserve that scope and use targeted verification for changes.
5. Submit the stable public Production URL listed above. Devpost eligibility attestations and final submission remain the entrant's actions.

Current deployment: eleven verified server settings are configured separately for Production. Its Git service graph, migrations, bounded concurrency/hold checks, Qloo/model integration and assistant UI have observed evidence in [assistant verification](ASSISTANT_VERIFICATION.md). Combined local CLI development remains unverified; plain local example mode works independently. Remaining submission steps and known limits are in the [final checklist](SUBMISSION_CHECKLIST.md). No real participant study or physical exchange has been verified.
