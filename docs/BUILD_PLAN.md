# CultureLoop build plan

Updated October 29, 2026. The entrant selected the current prototype as the final submission version and requested focused checks instead of broad suites after every small change. Scope is frozen: complete the [submission checklist](SUBMISSION_CHECKLIST.md) and [Devpost fields](DEVPOST_SUBMISSION.md). The workflow below remains the implementation contract; dated milestones describe the build history. Preserve the working app. **Free tiers only.**

## Product commitment

Help friends and students exchange physical books locally. Qloo helps participants discover appealing books already offered in their room; participants explicitly shortlist acceptable books; the deterministic solver finds feasible two- and three-person exchanges.

API key application statement:

> CultureLoop is an agent-powered book exchange app that uses Qloo to match people's cultural interests with available books and find two- or three-person swap cycles. The agent explains each suggestion and revises exchanges when a participant declines or a book becomes unavailable.

The initial audience is a small group of friends or students. Human usefulness remains a hypothesis until consenting participants try the product; do not fabricate research or contact testers without authorization.

## Prototype approval gate

**Satisfied October 29:** explicit entrant instruction to use the current prototype for final submission. This supersedes the pending-approval state in earlier checkpoints; it does not establish user research or unmeasured outcomes.

Build the prototype first, following this plan and preserving existing code. The entrant will test it extensively and provide feedback. Do not treat a prototype checkpoint as approval for the final submission version. After explicit prototype approval, incorporate feedback and proceed to final hardening/submission preparation. A hosted prototype is a review environment, not an authorized Devpost submission.

A local prototype may use embedded PostgreSQL in ignored storage while hosted account access is pending. Keep the same transactional store/domain services. Label local persistence and synthetic examples honestly; real Qloo data remains live/private-cache evidence. Embedded local storage is never a substitute for verified hosted persistence or model execution.

The local warm/bookish prototype was implemented on October 22. Local HTTP/browser and restart checks passed; the hosted prototype and entrant approval remain separate gates. See [assistant verification](ASSISTANT_VERIFICATION.md) for the current tool checkpoint.

## Fixed submission scope

- Physical books; a listing represents a specific physical copy, separate from the Qloo title identity.
- Guest rooms containing two to six members and up to three offered books per member.
- Up to three confirmed favorites per member, spanning supported cultural categories.
- Store explicit acceptable-book shortlists separately from Qloo evidence. Only acceptable books enter matching; shortlisting is not approval. Shortlisted unranked books remain eligible with unknown evidence.
- A shared inventory and two- or three-person cycles; a member gives and receives one book in a selected cycle.
- Multiple cycles may be proposed if they do not share members or physical copies.
- Individual accept/decline controls, book withdrawal, repair, and an exchange summary.
- Public judge entry point with a labeled sample room and the ability to create a fresh room.
- English interface and documentation.

Exclude payments, shipping, resale pricing, marketplace scraping, social feeds, digital-account trading, and automatic claims that a physical exchange has happened. These are outside the selected product scope.

## User journey and screens

1. Start: explain the value with a simple exchange-ring illustration; offer Try an example and Create a room.
2. Room: join through an invite link, choose an alias, add offered books, and confirm resolved book identities.
3. Interests: search for favorites and confirm canonical matches. Ambiguous results require a selection.
4. Shortlist: review the room's Qloo-ranked books and explicitly mark acceptable titles. Preserve rankings when willingness changes.
5. Proposal: show who gives what to whom, availability, evidence origin, unknown ranks, and decisions.
6. Review and repair: decline or withdraw; preserve unchanged disjoint cycles and approvals. Changed cycles require fresh approval. Never widen willingness automatically.
7. Agreement: after unanimous approval and transactional inventory holds, display a printable exchange summary.

Desktop can use an exchange ring plus evidence panel. Mobile uses an ordered transfer list with the same information. Chat is a supporting control for requests such as Find another exchange or Explain this choice; the primary workflow uses visible buttons.

## Technical architecture

Default implementation: TypeScript, Next.js for the web application, eve for one tool-calling agent, and SQL storage for room and exchange state. Use direct Google AI Studio access to the verified free Gemini model; Gateway remains an explicit alternative with no automatic fallback. Pin compatible SDK/provider versions and read their shipped documentation before changing integration code.

Timebox eve's free hosted round trip to four focused implementation hours. If access or complexity prevents success, use one bounded AI SDK agent inside Next.js, retaining shared domain services. Record focused time and the actual failure before switching. Missing free inference blocks either framework; fallback does not solve model access.

The eve frontend documentation describes a Next.js integration. Verify one browser-to-agent round trip and public guest access in an early deployment before expanding the interface. Public entry must not require a judge to join the entrant's hosting team.

The selected zero-dollar setup is Vercel Hobby, Supabase Free PostgreSQL and direct Google AI Studio free model access, subject to actual account/runtime verification. Neon/Gateway remain alternatives. See [RESOURCES_AND_DEPLOYMENT.md](RESOURCES_AND_DEPLOYMENT.md). No paid infrastructure, purchases, paid trials or automatic upgrades are allowed. Keep matching logic independent of the database adapter.

| Layer | Responsibility |
| --- | --- |
| Browser | Room setup, canonical choices, visual proposals, member decisions |
| Server routes | Authorization, validation, inventory state, rate limits |
| Qloo adapter | Entity lookup, catalog ranking, normalized response shape, private cache |
| Matching module | Enumerate valid cycles and select compatible proposals |
| eve agent | Interpret requests, call bounded tools, explain and coordinate revisions |
| SQL store | Members, listings, evidence versions, proposals, approvals, holds |

Planned agent tools are read_room, resolve_entities, rank_available_books, find_exchange_cycles, and explain_proposal. Tool inputs use validated IDs and room access. The server determines the caller's room; the model cannot authorize arbitrary room access.

Accept, decline, and withdraw are participant actions handled by application routes. The agent cannot invent approvals or complete an exchange on anyone's behalf.

## Data model

- Room: invite capability, creation time, inventory/preferences revision.
- Membership: room ID, alias, private session capability.
- Cultural interest: member ID, confirmed Qloo ID, type, display label.
- Book identity: canonical title ID and user-confirmed identifying information.
- Listing: physical-copy ID, owner, book identity, condition, availability.
- Taste evidence: member, catalog snapshot, request inputs, retrieval time, ranks, returned explanation status, live/cache origin.
- Shortlist decision: member, canonical book, acceptable flag and change revision; separate from evidence snapshots.
- Proposal: revision, transfers, evidence references, lifecycle state.
- Decision: member, cycle revision and exact displayed transfers, accept/decline, timestamp. Unrelated room changes do not reset unchanged cycles.
- Hold: physical copy, approved proposal, expiration/status.

Room links allow joining; possession of the general room link must not let someone approve for another member. An anonymous guest can own a membership through a private cookie without a full account system.

## Qloo feasibility milestone

Read [QLOO_API_REFERENCE.md](QLOO_API_REFERENCE.md) before implementation.

Prepare 20-30 candidate book titles and five different cultural interest profiles. Titles are research inputs, not a claim of available physical inventory. Test:

1. Resolve titles and favorites; inspect ambiguous and absent identities.
2. Rank the same fixed book catalog for each profile.
3. Inspect actual response shapes, missing entities, ties, and returned explanation warnings.
4. Change one taste input while holding the catalog fixed; record whether rankings change.
5. Measure latency and count requests for an initial three-member room.

Advance when live coverage and variation across five distinct profiles are useful, with missing results, explanation status, latency, and request usage recorded. Target 20 usable identities; reaching that number alone does not pass the gate. Narrow the supported catalog when observed coverage warrants it.

If explanations are unavailable, show verified request provenance and rank evidence. Never manufacture a specific because-you-like explanation. If coverage is thin, narrow the supported catalog using explicit coverage labels. If rankings remain uninformative, revisit the matching interaction before adding features. Do not present model-generated taste scores as Qloo output.

Keep real responses and research notes in ignored private storage. Use independently authored synthetic fixtures in public tests. A synthetic mode must be visibly labeled and must not count as the final live integration.

## Matching contract

Enumerate cycles of length two or three. Every transfer must reference an available listing, and each participating member must give and receive exactly one item. A person cannot receive their own copy. Selected cycles cannot reuse a member or listing.

Only explicitly shortlisted acceptable books generate transfer edges. Qloo rank evidence stays separate and unchanged when a participant shortlists. Absent evidence is unknown, not dislike. Shortlisted unranked books remain eligible; zero is only their documented solver tie-break contribution, never a displayed affinity. Shortlisting is not approval.

Use within-catalog ranks for the product's ranking heuristic; do not assume raw scores from separate profiles are directly comparable. For supported proposals, prefer more members served, then the strongest weakest recipient rank, then total rank utility. Document the heuristic, ties, and candidate pool. Never label rank utility as a probability of enjoyment.

Cycle states: awaiting decisions -> held after unanimous approval -> explicitly recorded completion, or declined/stale/expired. Approval applies to that cycle's revision and displayed transfers. Preserve unchanged disjoint cycles and approvals during repair; changed cycles start fresh. Acquire holds transactionally after checking availability/revision; retries are idempotent. Withdrawal releases affected holds. Completed exchanges cannot be rewritten. Provider failure preserves existing proposals.

## Milestones and acceptance checks

| Target | Deliverable | Completion condition |
| --- | --- | --- |
| Oct 21-22 | External gates | Useful live Qloo evidence; free hosting/database/model verified; hosted tool round trip (eve timebox applies) |
| Oct 22-24 | Persistent workflow | Separate browser members offer books, shortlist, get a live proposal, and reload; early hosted preview |
| Oct 24-25 | Decisions and repair | Unchanged cycles retain approvals; withdrawal/decline repair and transactional holds pass |
| Oct 26-27 | User validation | Consenting participants try blind comparisons; acceptance, usability, latency, and failures are recorded |
| Oct 28-29 | Submission candidate | Public guest flow, mobile layout, exports, run instructions, license, and Devpost draft complete |
| Oct 30 | Final verification and submission | Fresh-browser end-to-end pass; live demo and public source submitted with time buffer |

Work that can proceed without a Qloo key: project scaffold, synthetic matching cases, room/listing state, responsive interface, acceptance/version logic, request adapter, documentation, and deployment connectivity. Live feasibility remains a separate gate before calling taste matching complete.

If key delivery shifts, overlap independent tasks and protect the final verification window. Record any scope change explicitly.

## Verification and evidence

Meaningful automated cases: direct/three-person swaps; physical-copy identity; own-item exclusions; overlapping cycles; rank preservation during shortlisting; shortlisted unknown evidence; unchanged-cycle approval preservation; stale revisions; concurrent holds; retries; cross-room access rejection; persistence and provider failures.

Browser acceptance: create and join in separate sessions, edit inventory, resolve interests, generate, inspect evidence, decline/withdraw, repair, unanimously accept, reload, and export. Check mobile and desktop plus API timeout/quota responses. A failed repair preserves the last valid proposal with its stale/current status visible.

Compare the same model with the same inventory and hard constraints, with and without Qloo evidence. Blind the order when practical and ask real participants whether they would accept proposed books. Aim for 5-8 consenting participants as exploratory validation, not a statistically conclusive study. Do not evaluate usefulness solely by using Qloo to score its own recommendations. Report losses and ties as well as wins.

Track title coverage, participant acceptance, constraint violations, task completion, latency, and request/model usage. Claim only observed results. Measure physical exchange completion separately from agreement inside the app.

## Submission package

- Public end-to-end demo, including an editable sample scenario and new-room workflow.
- Public repository with source, necessary assets, clean setup steps, and a recognized open-source license.
- Written problem statement, audience, Qloo contribution, architecture, limitations, and actual validation findings.
- Screenshots of the exchange ring, evidence, and repair flow.
- A short judge walkthrough: open example, inspect proposal, withdraw a book, repair, accept, export.
- Clearly distinguish fixture participants/inventory from live Qloo evidence and any cache reuse.
- Keep the app, hosting, and model access functioning throughout judging; monitor request capacity without blocking normal judge use.

Target internal submission on October 30 in Pakistan time. The published deadline converts to October 31, 2026, 08:45 PKT. Recheck the event page before final submission.

## Entrant and implementation responsibilities

The entrant submits the API application, configures credentials locally when issued, controls hosting/model budgets and accounts, recruits consenting testers, and submits through their Devpost account. Do not paste keys into chat.

Implementation work covers scaffolding, adapters, matching, UI, persistence, agent tools, verification, and submission documentation. Research claims and test results are reviewed together before publication.

## Current status and next deliverable

See [foundation verification](FOUNDATION_VERIFICATION.md) for completed checks and remaining implementation work.

The live Qloo, hosted agent/tool and approved-version gates are complete. Production is public, and observed browser/HTTP evidence is recorded. The next checkpoint is completing the Devpost entry using the [final checklist](SUBMISSION_CHECKLIST.md) and [prepared copy](DEVPOST_SUBMISSION.md). Preserve current scope and known limits; never substitute synthetic evidence for an unverified result.

## Sources

- [Hackathon overview and submission requirements](https://qloo.devpost.com/)
- [Official rules](https://qloo.devpost.com/rules)
- [Schedule](https://qloo.devpost.com/details/dates)
- [Saved Qloo reference and source links](QLOO_API_REFERENCE.md)
- [Insights API](https://docs.qloo.com/reference/insights-api-deep-dive)
- [Next.js documentation](https://nextjs.org/docs)
- [eve documentation](https://github.com/vercel/eve/blob/main/docs/README.md)
- [eve frontend integration](https://github.com/vercel/eve/blob/main/docs/guides/frontend/overview.mdx)
