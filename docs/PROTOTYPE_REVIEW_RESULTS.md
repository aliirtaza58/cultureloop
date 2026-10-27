# Deployed prototype review

Reviewed October 27, 2026 at [cultureloop-omega.vercel.app](https://cultureloop-omega.vercel.app/). **Result: blocked at room entry.** This review does not constitute entrant approval or a submission release.

## Blocking findings

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

## Next checkpoint

Configure the existing verified server settings for **Production**, including the database URL/inline CA, session secret, Qloo settings, explicit Google provider/model credentials and verified-free flags. Use the existing [setup guide](SETUP.md); keep values private and retain the free-only budget. Do not assume Preview variables are inherited by Production.

Deploy current source to the intended environment, then rerun this exact URL through the [prototype review script](PROTOTYPE_REVIEW.md): example, two independent guests, canonical books/interests, shortlists, proposals, separate approvals, repair, reload/export and consecutive assistant questions. Keep protection settings unchanged unless the entrant makes a separate decision.

This review changed no deployment, hosting configuration, source code or account settings. Entrant feedback and explicit approval remain required before final submission work.
