# Submission readiness

Reviewed October 27, 2026. This is a release checklist, not evidence that CultureLoop is ready to submit. The entrant must test and explicitly approve the prototype before the final submission version.

## Published requirements

The deadline is **October 30, 2026, 11:45 pm EDT**, equivalent to **October 31, 08:45 PKT**. The overview requires a working Qloo-integrated agentic application, an externally hosted usable demo, public source with runnable instructions/assets, a feature description explaining Qloo's role, and an open-source license visible on the repository page. A demo video is explicitly optional. [Devpost overview](https://qloo.devpost.com/)

The rules require accurate functionality claims, English materials or translations, authorized third-party assets/integrations, and entrant ownership. Confirm personal eligibility and Devpost registration before submitting. Keep judge testing free and available through November 5, 2026, 11:45 pm Eastern Time. [Official rules, sections 1–4](https://qloo.devpost.com/rules)

**Access conflict:** the overview excludes submissions relying on private access; the rules also describe login instructions for private websites. The current SSO-protected preview is a prototype, not verified submission access. Preserve the entrant's instruction to keep Vercel protection enabled. Resolve compliant release access before submission; a private CLI test or a video does not resolve this conflict. [Overview](https://qloo.devpost.com/), [rules, Testing](https://qloo.devpost.com/rules)

The four equally weighted criteria cover technical implementation, design, potential impact and idea quality. Eligibility/theme/API fit is checked first. [Official rules, section 6](https://qloo.devpost.com/rules)

## Release gates

- [x] Public repository contains an MIT license and setup instructions; recheck the published repository's license detection before submission.
- [x] Hosted PostgreSQL schema, private access and transaction checks passed. See [assistant verification](ASSISTANT_VERIFICATION.md).
- [x] A protected Vercel preview completed a real Google/eve `read_room` turn against hosted SQL. This is runtime evidence, not a full browser acceptance pass.
- [ ] Complete [entrant prototype review](PROTOTYPE_REVIEW.md), record feedback privately, fix failures and obtain explicit approval.
- [ ] Verify the latest assistant UI in a browser on mobile and desktop, including waiting, error, interruption and repeated-question behavior.
- [ ] Verify the final hosted book-exchange flow from separate browser sessions, with live Qloo evidence and reload/export checks. Label fictional inventory and simulated approvals.
- [ ] Resolve release access and test the exact submitted URL from a fresh browser without developer assistance.
- [ ] Configure and verify the release environment; do not assume Preview settings also exist in Production.
- [ ] Record current resource usage and remaining headroom; test quota/timeout behavior without purchasing capacity.
- [ ] Refresh README and testing instructions to match the released revision. Record the commit and URL in release evidence.
- [ ] Entrant completes the Devpost fields, checks all links and submits before the deadline. No automated submission is authorized.

## Free-runtime checks

The Vercel connector independently reported the intended workspace's plan as Hobby on October 27. Google Free and Supabase Free were confirmed by the entrant. The hosted model/tool check is separately observed. No capacity guarantee follows from these facts.

Current published Hobby allowances include **50,000 Workflow events/month and 1 GB Workflow data written**. Workflow also uses Queues and Functions, so include those meters in the check. [Workflow pricing](https://vercel.com/docs/workflows/pricing) Queues includes the first **1,000,000 operations** on Hobby. [Queues pricing](https://vercel.com/docs/queues/pricing)

Finished Hobby workflow payloads remain readable for one day; durable room state must remain in PostgreSQL. [Workflow retention](https://vercel.com/docs/workflows/retention)

The source selects an in-process just-bash filesystem with automatic installation and default model tools disabled. A project-scoped named-sandbox listing returned zero entries after the hosted turn; this does **not** prove zero historical or ephemeral Sandbox usage. Sandbox Hobby has bounded included usage and pauses creation when exhausted. [Sandbox pricing](https://vercel.com/docs/sandbox/pricing)

Actual Workflow/Queues/Functions/Sandbox usage and remaining allowance are still unverified. Both the connector billing read and scoped CLI usage request returned `404 costs_not_found` / `Costs not found`; that is unavailable evidence, not zero cost or zero consumption. Before release, inspect the project's Workflows run details and the workspace Usage dashboard, recording only aggregate counts/sizes privately. Also check Google request/token limits, Qloo quota and Supabase database/egress headroom. A failed free allowance is a blocker to solve within free options, never permission to upgrade.

## Submission story and evidence

Explain the complete loop: confirmed cultural favorites → Qloo ranks the actual room inventory → each reader explicitly shortlists acceptable books → the solver proposes two-/three-person transfers → each participant approves the displayed revision. Show repair when a copy is withdrawn, preserving unchanged disjoint cycles.

Demonstrate what Qloo changes using the same inventory and constraints, with and without its evidence. A repeated match or sparse Qloo coverage is a result to report, not hide. A good narrative connects discovery to a feasible physical exchange while distinguishing taste evidence, willingness and approval.

Use screenshots of inventory, evidence, transfers and repair if useful. Show only consented/anonymized material. Do not publish raw Qloo captures, participant notes, cookies, keys or traces. Describe automated checks as automated; prototype approval, user research, preference gains and actual handoffs require their own observed evidence.
