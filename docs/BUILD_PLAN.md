# CultureLoop build plan

Prepared October 18, 2026, for a solo entrant. This is an implementation plan; no completed features, API measurements, or user results are implied. The project requires **free tiers only**. Completed checks are recorded in [foundation verification](FOUNDATION_VERIFICATION.md).

## Product commitment

Help a student society or local book club turn books members have finished into exchanges they would like to accept. Qloo suggests promising matches from declared cultural interests; the application finds feasible two- and three-person exchange cycles.

API key application statement:

> CultureLoop is an agent-powered book exchange app that uses Qloo to match people's cultural interests with available books and find two- or three-person swap cycles. The agent explains each suggestion and revises exchanges when a participant declines or a book becomes unavailable.

The launch audience is one existing student society or book club. Test this audience hypothesis with participants before claiming demand or impact.

## Fixed submission scope

- Physical books; a listing represents a specific physical copy, separate from the Qloo title identity.
- Guest rooms containing two to six members and up to three offered books per member.
- Up to three confirmed favorites per member, spanning supported cultural categories.
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
4. Proposal: show who gives what to whom, availability, per-recipient evidence, and acceptance status.
5. Review and repair: a member declines a transfer or withdraws a copy; regenerate only the affected proposals and evidence.
6. Agreement: after unanimous approval and successful inventory holds, display a shareable/printable exchange summary.

Desktop can use an exchange ring plus evidence panel. Mobile uses an ordered transfer list with the same information. Chat is a supporting control for requests such as Find another exchange or Explain this choice; the primary workflow uses visible buttons.

## Technical architecture

Default implementation: TypeScript, Next.js for the web application, eve for one tool-calling agent, and SQL storage for room and exchange state. Use AI Gateway for the model, with its model ID and access configured at implementation time. Pin installed versions and read their shipped documentation before writing integration code.

The eve frontend documentation describes a Next.js integration. Verify one browser-to-agent round trip and public guest access in an early deployment before expanding the interface. Public entry must not require a judge to join the entrant's hosting team.

The proposed zero-dollar deployment is Vercel Hobby plus Neon Free Postgres and AI Gateway's free eligible-model tier, subject to checking actual account/runtime access and remaining quotas. See [RESOURCES_AND_DEPLOYMENT.md](RESOURCES_AND_DEPLOYMENT.md). No paid infrastructure, credit purchases, trials that become paid, or automatic upgrades are allowed. Keep matching logic independent of the database adapter.

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
- Proposal: revision, transfers, evidence references, lifecycle state.
- Decision: member, proposal revision, accept/decline, timestamp.
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

Advance when at least 20 usable book identities resolve, fixed-catalog rankings return usable evidence, and the data supports visibly different proposals in some documented scenarios. These are project acceptance targets, not promises about the API.

If explanations are unavailable, show verified request provenance and rank evidence. Never manufacture a specific because-you-like explanation. If coverage is thin, narrow the supported catalog using explicit coverage labels. If rankings remain uninformative, revisit the matching interaction before adding features. Do not present model-generated taste scores as Qloo output.

Keep real responses and research notes in ignored private storage. Use independently authored synthetic fixtures in public tests. A synthetic mode must be visibly labeled and must not count as the final live integration.

## Matching contract

Enumerate cycles of length two or three. Every transfer must reference an available listing, and each participating member must give and receive exactly one item. A person cannot receive their own copy. Selected cycles cannot reuse a member or listing.

Qloo rankings generate suggested recipients. Explicit participant wishes and vetoes override suggestions. Label an edge's evidence as Qloo-suggested or explicitly requested; absent ranking evidence means unknown, not dislike. Participant acceptance remains necessary.

Use within-catalog ranks for the product's ranking heuristic; do not assume raw scores from separate profiles are directly comparable. For supported proposals, prefer more members served, then the strongest weakest recipient rank, then total rank utility. Document the heuristic, ties, and candidate pool. Never label rank utility as a probability of enjoyment.

Proposal states: draft -> awaiting decisions -> held after unanimous approval -> organizer-recorded completion, or declined/stale/expired. Approval applies only to the displayed revision. Changes to transfers invalidate affected approvals. Final holds are acquired in one transaction after checking both availability and revision. Conflicting or repeated requests must not allocate a copy twice.

## Milestones and acceptance checks

| Target | Deliverable | Completion condition |
| --- | --- | --- |
| Oct 18-19 | Foundation and feasibility preparation | Plan saved; seed title list; synthetic cycle cases; basic web-to-agent round trip; API probe ready |
| As soon as key arrives | Live Qloo feasibility | Canonical IDs and actual fixed-catalog responses inspected; limits recorded privately |
| Oct 20-22 | First complete workflow | Three people add books/interests and receive a valid proposal; early hosted preview works |
| Oct 23-25 | Decisions and repair | Separate participants accept/decline; withdrawal produces a valid revision; stale approvals are rejected |
| Oct 26-27 | User validation | Consenting participants try blind comparisons; acceptance, usability, latency, and failures are recorded |
| Oct 28-29 | Submission candidate | Public guest flow, mobile layout, exports, run instructions, license, and Devpost draft complete |
| Oct 30 | Final verification and submission | Fresh-browser end-to-end pass; live demo and public source submitted with time buffer |

Work that can proceed without a Qloo key: project scaffold, synthetic matching cases, room/listing state, responsive interface, acceptance/version logic, request adapter, documentation, and deployment connectivity. Live feasibility remains a separate gate before calling taste matching complete.

If key delivery shifts, overlap independent tasks and protect the final verification window. Record any scope change explicitly.

## Verification and evidence

Meaningful automated cases: a direct swap; a three-person cycle without a direct swap; incompatible inventories; duplicate physical copies of the same title; own-item exclusions; overlapping cycles; missing/tied ranks; withdrawn inventory; stale approvals; concurrent holds; cross-room access rejection.

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

Next deliverable: a local three-member room using labeled synthetic evidence to verify cycle formation, plus the live Qloo probe ready for key configuration. Then replace synthetic evidence with inspected live responses before demonstrating the core taste feature as complete.

## Sources

- [Hackathon overview and submission requirements](https://qloo.devpost.com/)
- [Official rules](https://qloo.devpost.com/rules)
- [Schedule](https://qloo.devpost.com/details/dates)
- [Saved Qloo reference and source links](QLOO_API_REFERENCE.md)
- [Insights API](https://docs.qloo.com/reference/insights-api-deep-dive)
- [Next.js documentation](https://nextjs.org/docs)
- [eve documentation](https://github.com/vercel/eve/blob/main/docs/README.md)
- [eve frontend integration](https://github.com/vercel/eve/blob/main/docs/guides/frontend/overview.mdx)
