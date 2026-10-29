# Deployed prototype review

Initial review: October 27, 2026 at [cultureloop-omega.vercel.app](https://cultureloop-omega.vercel.app/). **The entry blockers below were subsequently resolved by `3c02ffb` and separate Production configuration.** The fresh Production browser passed example shortlists, generation, three simulated approvals, agreement download, reload and an assistant reply. The entrant selected this version for final submission on October 29. See the [final checklist](SUBMISSION_CHECKLIST.md).

## Initial findings (resolved)

1. **Production has no environment variables.** In the browser, clicking **Try the example** displays **Hosted PostgreSQL is not configured.** A read-only, project-scoped `vercel env ls production` returned no variables. The room-entry path requires hosted PostgreSQL, so the exchange workflow cannot start. Earlier working configuration was scoped to Preview.
2. **The alias serves an older revision.** Vercel reports a Ready Production deployment from commit `3416696` (`set up hosted database`). The reviewed repository is at `f289c95`; the assistant interface was added in `a1187bc`, with stream handling in `83fa448`. Those later features cannot be reviewed through this deployed revision.

## Observed browser checks

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Homepage access | PASS | Opens without a Vercel login in the review browser |
| Desktop presentation | PASS | Warm bookish layout, clear example labeling and entry actions |
| Responsive DOM layout | PASS | At 320, 375, 414, 768, 1024 and 1440px: no page/control horizontal overflow; observed form controls meet the 44px height target |
| Keyboard focus | PASS | Tab reaches Create a room with a visible solid outline |
| Invitation disclosure | PASS | Enter expands it; labeled name/code fields appear |
| Basic field semantics | PASS | Name/code inputs have labels, required validation and length limits |
| Example room entry | FAIL | Database configuration error appears and controls recover from loading |
| Separate-browser live room flow | BLOCKED | Database-dependent steps were not attempted after the first broken boundary |
| Qloo, assistant, decisions, repair and export on this URL | BLOCKED | Requires a working room and the current application revision |

The responsive checks measured the rendered DOM; they are not a complete visual or accessibility audit. A desktop screenshot of the configuration failure and detailed browser metrics are stored privately. Previous automated/Preview checks remain separate evidence; no new model or Qloo inference was needed for this review.

## Follow-up completed

Eleven verified server settings were configured separately for Production. The service-root fix in `3c02ffb` built successfully and replaced the old version at the same public URL. SQL, cached Qloo lookup and real model/tool checks passed there, followed by browser approval/export/assistant checks. Five older deployments were removed at the entrant's request.

On October 29 the entrant approved this version for submission and deferred extensive further testing. The remaining work is the [submission package](SUBMISSION_CHECKLIST.md). Keep protection settings unchanged unless the entrant makes a separate decision.

The initial review itself changed no hosting settings. The later repair and approved release decision are recorded separately above.
