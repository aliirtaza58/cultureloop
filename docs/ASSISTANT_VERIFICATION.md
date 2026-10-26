# Assistant implementation checks

Updated October 26, 2026. Application services have synthetic-provider/embedded-SQL checks. A direct Google model/tool protocol check now passes; hosted eve workflow and shared persistence remain unverified.

Direct Google integration: 82 project tests and TypeScript passed. The adapter is pinned to the existing AI SDK's provider version. Tests verify credential separation, free/model gates, direct Google routing, header-only key handling, the 512-token request cap and no alternate-provider request on a quota error. The existing room authorization tests remain passing.

One bounded live `model:verify -- --live` check against the configured free Gemini model passed: one synthetic calculator tool execution, two model steps, 226 input tokens and 19 output tokens. It used no participant/Qloo data and made no database request. Google model listing also returned HTTP200. This establishes model/tool protocol, not an eve room turn or public deployment.

The newly built eve server also accepted an authenticated local room message (HTTP200) and streamed a completed turn (HTTP200, 18 events), using embedded PostgreSQL and the real Google model. Its read_room tool succeeded and returned the actual test-room counts: one reader and zero books. The two steps reported 1,800 input and 95 output tokens. The first probe attached before the conversation address was registered; a bounded wait resolved the startup race. This is local runtime evidence, not the shared/hosted gate. The temporary server was stopped.

Supabase's CA fixed certificate-chain verification. Login still returned PostgreSQL `28P01`; no schema/data operation was performed. The entrant deferred further login attempts until the next session. The hosted database gate remains disabled.

Hosted connection configuration now supplies explicit certificate/hostname verification and a local-file or inline CA. It removes accepted URL `sslmode` options before pg can replace the explicit policy, rejects weaker/competing TLS settings, retains the three-connection pool and requires the verified target flag. All 86 tests, TypeScript, web and eve builds passed. Offline tests exercise these guards without connecting to Supabase. These checks do not establish hosted schema, private grants/RLS or transaction behavior.

The assistant tool boundary supports reading the current room, resolving identity candidates, ranking available books, finding exchanges and explaining an exact proposal revision. Room authority is supplied by the server; schemas reject room/member overrides. Shortlisting, approvals, declines, withdrawals and completion are participant controls, outside this tool set.

`tests/assistant-tools.test.ts` verifies membership before provider access, identity confirmation requirements, alias/capability redaction, explicit willingness, unchanged ranks/shortlists, stale evidence rejection, exact-revision explanations and preservation after provider failure. Ranking and generation share operations with the button routes.

The custom eve channel derives its conversation address from the verified guest session and room. Clients cannot choose a transcript ID or member authority. The standard eve session API rejects every caller; its public health probe remains available. The home channel is disabled. Every runtime tool rechecks the current verified principal; it never inherits an earlier initiator. Model dispatch requires explicit free-access opt-in and credentials, plus a persisted hourly message limit.

All 75 project tests and TypeScript passed, including transcript isolation, invalid principals, revoked membership, blocked model configuration and a fake dispatch exercising the SQL request limit. That fake dispatch does not call or validate a model.

The eve production build also passed. Model selection is resolved at runtime and checks the free-access gate before each model step. An explicitly configured, pinned just-bash sandbox provides an in-process filesystem; default model shell/file tools and automatic package installation remain disabled. This configuration does not establish network isolation or hosted quota eligibility.

The built server was started alone on loopback port 3018 with inference explicitly disabled. Observed HTTP checks: health 200; standard session creation 401; unauthenticated room message 403; authenticated room message 409 with the free-model gate; no existing conversation 404 even with a supplied foreign session ID. No Qloo/model request or hosted service was used. An initial missing bundled PGlite data asset was corrected by loading the installed local WASM/data assets explicitly, then the agent was rebuilt and these checks passed. Private runtime evidence stays outside Git.

On October 25 the web production server separately passed the example-room HTTP workflow, rank preservation, changed-copy fresh approval, membership/origin isolation and agreement export. These checks used synthetic example rankings, with zero Qloo/model calls. The web and agent servers were run sequentially against local embedded storage.

The `vercel.ts` service graph now routes the custom channel explicitly alongside the existing web app. All 78 project tests and TypeScript passed. Routing tests evaluate the actual eve helper output; they check custom endpoints, preservation of web room APIs, embedded/unverified database rejection and service ports/origins. Running `services:check` with the current missing database correctly stopped before service startup. These are static configuration and launcher checks, not a running combined deployment.

Pending: run the combined services with verified shared PostgreSQL, verify account-eligible free model execution and hosted persistence, then run a browser-to-agent tool round trip. The entrant is configuring Hobby, AI Gateway and a free PostgreSQL target. The chat UI stays deferred until real free inference works, following the reviewed prototype design. No missing gate is represented by a synthetic test pass.
