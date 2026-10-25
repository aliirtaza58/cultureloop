# Assistant implementation checks

Updated October 25, 2026. These checks verify application services with synthetic provider fixtures and embedded PostgreSQL. They do not verify a live model, hosted eve workflow or deployment.

The assistant tool boundary supports reading the current room, resolving identity candidates, ranking available books, finding exchanges and explaining an exact proposal revision. Room authority is supplied by the server; schemas reject room/member overrides. Shortlisting, approvals, declines, withdrawals and completion are participant controls, outside this tool set.

`tests/assistant-tools.test.ts` verifies membership before provider access, identity confirmation requirements, alias/capability redaction, explicit willingness, unchanged ranks/shortlists, stale evidence rejection, exact-revision explanations and preservation after provider failure. Ranking and generation share operations with the button routes.

The custom eve channel derives its conversation address from the verified guest session and room. Clients cannot choose a transcript ID or member authority. The standard eve session API rejects every caller; its public health probe remains available. The home channel is disabled. Every runtime tool rechecks the current verified principal; it never inherits an earlier initiator. Model dispatch requires explicit free-access opt-in and credentials, plus a persisted hourly message limit.

All 75 project tests and TypeScript passed, including transcript isolation, invalid principals, revoked membership, blocked model configuration and a fake dispatch exercising the SQL request limit. That fake dispatch does not call or validate a model.

The eve production build also passed. Model selection is resolved at runtime and checks the free-access gate before each model step. An explicitly configured, pinned just-bash sandbox provides an in-process filesystem; default model shell/file tools and automatic package installation remain disabled. This configuration does not establish network isolation or hosted quota eligibility.

The built server was started alone on loopback port 3018 with inference explicitly disabled. Observed HTTP checks: health 200; standard session creation 401; unauthenticated room message 403; authenticated room message 409 with the free-model gate; no existing conversation 404 even with a supplied foreign session ID. No Qloo/model request or hosted service was used. An initial missing bundled PGlite data asset was corrected by loading the installed local WASM/data assets explicitly, then the agent was rebuilt and these checks passed. Private runtime evidence stays outside Git.

On October 25 the web production server separately passed the example-room HTTP workflow, rank preservation, changed-copy fresh approval, membership/origin isolation and agreement export. These checks used synthetic example rankings, with zero Qloo/model calls. The web and agent servers were run sequentially against local embedded storage.

Pending: mount the custom channel in the hosted service graph, verify account-eligible free model execution and hosted persistence, then run a browser-to-agent tool round trip. The entrant is configuring Hobby, AI Gateway and a free PostgreSQL target. No missing gate is represented by a synthetic test pass.
