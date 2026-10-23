# Assistant implementation checks

Updated October 23, 2026. These checks verify application services with synthetic provider fixtures and embedded PostgreSQL. They do not verify a live model, hosted eve workflow or deployment.

The assistant tool boundary supports reading the current room, resolving identity candidates, ranking available books, finding exchanges and explaining an exact proposal revision. Room authority is supplied by the server; schemas reject room/member overrides. Shortlisting, approvals, declines, withdrawals and completion are participant controls, outside this tool set.

`tests/assistant-tools.test.ts` verifies membership before provider access, identity confirmation requirements, alias/capability redaction, explicit willingness, unchanged ranks/shortlists, stale evidence rejection, exact-revision explanations and preservation after provider failure. Ranking and generation share operations with the button routes.

The custom eve channel derives its conversation address from the verified guest session and room. Clients cannot choose a transcript ID or member authority. The standard eve session API and home channel are disabled. Every runtime tool rechecks the current verified principal; it never inherits an earlier initiator. Model dispatch requires explicit free-access opt-in and credentials, plus a persisted hourly message limit.

All 75 project tests and TypeScript passed, including transcript isolation, invalid principals, revoked membership, blocked model configuration and a fake dispatch exercising the SQL request limit. That fake dispatch does not call or validate a model.

Pending: mount the custom channel in the hosted service graph, verify account-eligible free model execution and hosted persistence, then run a browser-to-agent tool round trip. The entrant is configuring Hobby, AI Gateway and a free PostgreSQL target. No missing gate is represented by a synthetic test pass.
