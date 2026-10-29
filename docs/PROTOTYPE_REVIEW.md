# Entrant prototype review

The entrant approved the current version for final submission on October 29. This script is retained as an optional reference, not an additional release gate. Follow the [final checklist](SUBMISSION_CHECKLIST.md); use focused checks for changes.

This is a test script, not a completed study. Run it on the latest provided preview, record problems privately, and explicitly approve the prototype only after the changes you need are tested. The preview currently uses Vercel protection by the entrant's choice; hosting access is separate from membership in a book circle.

The October 27 [review of the supplied Production URL](PROTOTYPE_REVIEW_RESULTS.md) found missing Production configuration and an older deployment. Resolve that room-entry blocker before running the full script on that URL. Earlier Preview results do not transfer automatically to a different environment.

## First pass: fictional example

1. Open the example. Confirm that its readers, inventory, ranks and simulated decisions are visibly labeled fictional.
2. Explore the bookshelf and shortlist. Load the example shortlists explicitly. Check that taste order remains visible and shortlisting has not approved an exchange.
3. Find exchanges. Read each person's exact give/receive transfer. Simulate one reader's approval and confirm that other readers remain undecided.
4. Complete the remaining simulated approvals. Reload and download/print the agreement. Check titles, direction, revision and held status.
5. In a fresh example, approve one reader's proposal, then withdraw an involved copy. Update exchanges and check that the changed transfers need fresh approval. No withdrawn copy should be allocated.
6. Try the room assistant when available. Ask what to do next and ask about the current proposal. Its answer should reflect the saved room, explain unknown evidence honestly and direct you to participant controls for decisions.

The example checks interaction and state behavior. It does not prove live Qloo quality or real willingness.

## Second pass: real room

Use two separate browser profiles or isolated sessions. Each must pass the current hosting protection, then join the app independently. A shared hosting login must not make one browser the other reader inside CultureLoop. Use aliases and only books/interests you are comfortable sending through the configured services.

1. Create a room in session A. Copy the invitation and join as a different reader in session B. Refresh both and check the membership count.
2. Offer a physical book from each reader. Confirm the exact search identity; ambiguous or missing identities must be resolved explicitly. Check the edition and condition directly with the other reader.
3. Add confirmed cultural favorites. Request taste suggestions and inspect whether the evidence is live, cached, unknown or unavailable. A missing rank must not appear as a probability or invented score.
4. Shortlist only books each reader would accept. Toggle a choice and check that the Qloo ranking remains intact. Try generating before there is a compatible set; a no-match result is valid.
5. Generate a compatible exchange if one exists. Approve separately in each session. Verify that another reader cannot approve your transfer through an invitation or copied room URL.
6. Reload in both sessions. Check the same cycle revision, approvals and copy holds. Download the agreement once unanimously approved.
7. In another trial room, withdraw or decline and regenerate. Check fresh approval on changed transfers. If you can create two disjoint cycles, verify that changing one leaves the other intact.
8. Ask two consecutive assistant questions. The second must not reuse the first answer. Try stopping the wait, refreshing and using the visible controls afterward. A stopped browser wait may leave a server turn running; inspect the refreshed room before retrying an action.
9. Record a physical handoff only after it actually happens. An agreement or held copy is not evidence of completed delivery.

## Usability and failure checks

Try a narrow phone viewport, tablet and desktop; also use only the keyboard. Check long titles, visible focus, readable evidence and touch controls. Test reload, a temporarily lost connection and a failed request. Valid saved proposals must survive provider failures, and stale data must not silently authorize new transfers.

Record: task, expected behavior, what happened, viewport/browser, whether repeatable, and a redacted screenshot if useful. Keep secrets, raw responses, participant identities and detailed observations outside public source. List blocking bugs separately from preferences.

## Approval and optional research

Send concrete feedback and state explicitly whether the prototype is approved for final submission work. Approval is still pending until the entrant says so.

If the entrant later recruits consenting testers, compare identical inventories and constraints with/without Qloo evidence, blind the order when practical, and record losses, ties, failures and unknowns. Ask whether they would actually accept the proposed books. This is an optional evaluation plan, not a claim that recruitment or research has happened. Do not infer usefulness from Qloo scoring its own suggestions. See [submission checklist](SUBMISSION_CHECKLIST.md) for unresolved release gates.
