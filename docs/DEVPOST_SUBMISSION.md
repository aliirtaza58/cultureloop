# CultureLoop — Devpost submission copy

Prepared October 29, 2026 for the approved submission version. Copy the fields below into Devpost; this file is a draft, not a submitted entry.

## Project name

CultureLoop

## Tagline

Good books. New readers. Exchanges everyone chooses.

## Inspiration

A friend's bookshelf can hold your next favorite book. Finding that book is one problem; arranging an exchange everyone welcomes is another. A direct swap can fail even when a three-person loop would work.

CultureLoop connects cultural discovery to the books a small group actually has. It helps friends and students discover appealing reads, choose what they would accept, and coordinate a feasible local exchange.

## What it does

Readers create a private book circle for two to six people. Each person can offer up to three physical copies and confirm up to three cultural favorites. Qloo uses those confirmed interests to rank the books offered in that room. Readers then explicitly shortlist the titles they would welcome.

CultureLoop finds compatible two- and three-person loops. Each participant sees exactly what they give and receive and approves their own transfer. Unanimous approval reserves the copies and enables a downloadable agreement. If someone withdraws a book or declines, the workflow can repair the proposal while preserving unchanged exchanges. Changed transfers require fresh approval.

A supporting assistant can read the saved room, refresh taste suggestions, find exchanges and explain proposals. Shortlisting, approval and reporting a completed handoff remain participant decisions.

## What makes it Qloo-powered

Qloo provides canonical cultural identities and ranking evidence for the room's fixed book catalog. A reader's favorite films, artists, games or books can help them discover an offered title they would otherwise overlook.

The workflow keeps three things separate: Qloo evidence, the reader's willingness and approval of an exact exchange. A missing rank stays unknown. The assistant uses saved evidence and tools instead of inventing taste scores or treating a generated explanation as consent.

The deterministic solver makes the logistics feasible; Qloo supplies cultural grounding for discovery and ordering. Comparative taste-quality gains have not been measured.

## How it was built

The application uses Next.js, React and TypeScript, hosted on Vercel. An eve agent with direct Google Gemini inference calls bounded domain tools through the AI SDK. Supabase PostgreSQL stores rooms, separate physical copies, shortlists, evidence, cycle revisions, approvals and inventory holds.

Server-side membership checks bind each action and conversation to the current guest. Transactional holds prevent duplicate allocation, and retries preserve the same decision. Qloo responses are normalized and cached privately; displayed evidence identifies live, cached and unknown results. Credentials stay on the server.

## Challenges

The central challenge was joining uncertain recommendation evidence to exact physical transfers. Two copies of one title are different items. A shortlist is different from an approval. Repairing one loop should preserve useful decisions in another.

Other challenges included sparse Qloo coverage, canonical identity confirmation, private guest sessions, streamed agent replies and deploying the web application and agent together within free-tier constraints.

## Accomplishments

The deployed application supports the complete exchange workflow, including revision-bound approvals, repair and agreement export. Hosted checks exercised real SQL, Qloo responses and model/tool execution. Browser review covered the labeled fictional example, separate simulated approvals, agreement download, reload persistence and an assistant reply. Responsive DOM checks covered six screen widths.

These are implementation checks. We have not conducted participant research, verified physical handoffs or established recommendation superiority.

## What we learned

Cultural intelligence becomes more useful when it feeds a concrete decision. Ranking a real inventory is actionable; explicit human choices make the exchange acceptable. Honest unknowns and preserved approvals matter as much as an appealing suggestion.

## What's next

Evaluate the existing workflow with consenting book circles, compare discovery with and without Qloo evidence, and improve catalog coverage and assistant presentation from that feedback. Free-tier capacity and long-term usefulness remain to be measured.

## Built with

Qloo API, eve, Google Gemini, AI SDK, Next.js, React, TypeScript, Supabase PostgreSQL, Vercel, Zod.

## Links

- Live application: [CultureLoop](https://cultureloop-omega.vercel.app/)
- Public source: [aliirtaza58/cultureloop](https://github.com/aliirtaza58/cultureloop)
- License: [MIT](https://github.com/aliirtaza58/cultureloop/blob/main/LICENSE)

## Judge quickstart

1. Open the live application and choose **Try the example**. Its readers, books, ranks and decisions are explicitly fictional.
2. Open **Your shortlist**, choose **Use example shortlists**, then open **The exchange** and find exchanges.
3. Review each give/receive transfer. Use **Simulate a reader** to approve separately as all three fictional participants, then download the agreement.
4. Ask the supporting assistant about the saved room. Replies do not record participant approval.
5. To try Qloo-backed discovery, create a real room and join through its invitation in a second browser profile or isolated session. Confirm offered titles and favorites, request suggestions, shortlist acceptable books and approve separately. Missing ranks are valid unknowns.

The example demonstrates the workflow with authored ranks. Real Qloo ranking is requested inside real rooms after interests are confirmed.

Check book condition and arrange handoffs directly. An agreement in the application does not establish that a physical exchange happened. Live services have finite free-tier quotas.
