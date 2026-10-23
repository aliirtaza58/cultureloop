# Assistant implementation checks

Updated October 23, 2026. These checks verify application services with synthetic provider fixtures and embedded PostgreSQL. They do not verify a live model, hosted eve workflow or deployment.

The assistant tool boundary supports reading the current room, resolving identity candidates, ranking available books, finding exchanges and explaining an exact proposal revision. Room authority is supplied by the server; schemas reject room/member overrides. Shortlisting, approvals, declines, withdrawals and completion are participant controls, outside this tool set.

`tests/assistant-tools.test.ts` verifies membership before provider access, identity confirmation requirements, alias/capability redaction, explicit willingness, unchanged ranks/shortlists, stale evidence rejection, exact-revision explanations and preservation after provider failure. Ranking and generation share operations with the button routes. All 68 project tests and TypeScript passed at this checkpoint.

Pending: authenticated eve transport, account-verified free model execution, hosted persistence and a browser-to-agent tool round trip. The entrant is configuring Hobby, AI Gateway and a free PostgreSQL target. No missing gate is represented by a synthetic test pass.
