# CultureLoop

### Good books. New readers. Exchanges everyone chooses.

[![Live demo](https://img.shields.io/badge/Live_demo-Open_CultureLoop-713b22?style=flat-square)](https://cultureloop-omega.vercel.app/)
[![Qloo powered](https://img.shields.io/badge/Qloo-Cultural_intelligence-566b50?style=flat-square)](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-43853d?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-b59052?style=flat-square)](LICENSE)

![CultureLoop — Qloo-powered local book exchanges](public/cultureloop-thumbnail.png)

CultureLoop helps friends and students exchange physical books locally. Qloo ranks the books already offered in a room using confirmed cultural interests. Readers choose what they would accept, then approve a two- or three-person exchange.

**[Open the app](https://cultureloop-omega.vercel.app/) · [Judge walkthrough](#for-judges) · [Run locally](#run-locally) · [Project structure](#project-structure)**

## For judges

The hosted app is ready to use. No account, installation or API key is needed to explore it.

1. Choose **Try the example**.
2. Open **Your shortlist** and select **Use example shortlists**.
3. Open **The exchange** and select **Find exchanges**. Review each person's give/receive transfer.
4. Use **Simulate a reader** to approve separately as all three fictional participants. Download the agreement after unanimous approval.
5. Expand **A hand with the exchange** and ask about the saved room.

> The example's readers, titles, ranks and decisions are fictional. It demonstrates the exchange workflow. For real Qloo suggestions, create a room, invite another reader in a separate browser profile, confirm books and favorites, then request taste suggestions.

To explore repair, withdraw an involved copy from **The bookshelf**, then update exchanges. Changed transfers require fresh approval. An in-app agreement is separate from a physical handoff.

## What makes it Qloo-powered?

Qloo resolves canonical identities and ranks a room's fixed catalog from confirmed interests, including books, films, artists and games. Recommendations stay grounded in books the group actually offers.

CultureLoop keeps three decisions separate:

| Layer | Purpose |
| --- | --- |
| **Taste evidence** | Qloo's ordering, retrieval source and available explanation status |
| **Willingness** | Each reader explicitly shortlists acceptable titles |
| **Approval** | Each participant accepts the exact displayed transfers and revision |

Missing evidence remains **unknown**, and rank is not an enjoyment probability. A bounded assistant can read, rank, find and explain exchanges; it cannot shortlist, approve or report completion for a participant.

The solver prevents self-transfers, overlapping participants and duplicate physical-copy allocation. Transactional holds protect unanimously approved copies. Repair preserves unchanged disjoint exchanges and their decisions.

## Project structure

| Path | What to look at |
| --- | --- |
| [`app/`](app/) | Next.js pages, room controls and API routes |
| [`agent/`](agent/) | eve agent, authenticated channels, tools and model configuration |
| [`src/domain/`](src/domain/) | Matching, physical-copy allocation, approvals, repair and agreements |
| [`src/server/`](src/server/) | Membership, SQL transactions, shared operations, cache and request limits |
| [`src/integrations/`](src/integrations/) | Qloo requests and response normalization |
| [`src/client/`](src/client/) | Bounded streamed-reply handling |
| [`src/fixtures/`](src/fixtures/) | Authored example inventory used by the application |
| [`db/`](db/) / [`supabase/migrations/`](supabase/migrations/) | Local and hosted database schema |
| [`scripts/`](scripts/) | Setup and development launchers |
| [`public/`](public/) | Project artwork and licensed fonts |
| [`vercel.ts`](vercel.ts) | Combined web/agent deployment and routing |

**Stack:** Next.js · React · TypeScript · Qloo · eve · AI SDK · Google Gemini · Supabase PostgreSQL · Vercel.

## Run locally

Requires **Node.js 24+** and npm.

~~~sh
git clone https://github.com/aliirtaza58/cultureloop.git
cd cultureloop
npm ci
npm run setup:local
npm run dev:local
~~~

Open **http://127.0.0.1:3017**.

This starts the web example with file-backed embedded PostgreSQL under ignored `.private/prototype-db`. Setup creates or preserves a private session secret. It needs no Qloo or model key for the authored example. Port 3000 is not used.

The optional assistant is a separate service; `dev:local` starts only the web app. Use the hosted demo to review the integrated assistant.

## Configure live integrations

Keep credentials in ignored `.env.local` and server-only host settings. Use [`.env.example`](.env.example) as the variable reference; preserve the `SESSION_SECRET` created by setup. Never prefix credentials with `NEXT_PUBLIC_`.

| Configuration | Purpose |
| --- | --- |
| `QLOO_API_KEY` | Qloo cultural identity lookup and catalog ranking |
| `QLOO_BASE_URL` | Hackathon API host: `https://hackathon.api.qloo.com` |
| `SESSION_SECRET` | At least 32 random characters; local setup generates it |
| `DATABASE_URL` | Dedicated Supabase PostgreSQL transaction-pooler connection |
| `DATABASE_SSL_CA` **or** `DATABASE_SSL_CA_FILE` | Verified TLS: inline CA on the host, ignored CA file locally |
| `CULTURELOOP_MODEL_PROVIDER=google` | Explicit direct Google provider |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini Developer API key |
| `GOOGLE_MODEL=gemini-3.5-flash-lite` | Model supported by this version |
| `CULTURELOOP_FREE_AI_VERIFIED=true` | Enable only after confirming eligible free access and disabled top-ups |
| `CULTURELOOP_HOSTED_DB_VERIFIED=true` | Enable after confirming the dedicated Free database and schema |
| `CULTURELOOP_LOCAL_PROTOTYPE=false` | Required for hosted/shared database operation |
| `CULTURELOOP_APP_ORIGIN` | Your exact HTTPS application origin |

The Gateway settings in `.env.example` are an explicitly selected alternative; there is no automatic provider fallback. Free allowances are finite.

<details>
<summary><strong>Deploy your own complete application</strong></summary>

1. Create a dedicated **Supabase Free** project. Save its transaction-pooler URL with the database password URL-encoded. Download the project's CA certificate and configure one CA source. Certificate and hostname verification stay enabled.
2. Obtain Qloo and eligible Google API access. Verify your accounts' free plans and quota before enabling the opt-in flags. Configure the variables above privately.
3. Inspect the dedicated schema, then apply it using your non-secret project reference:

   ~~~sh
   npm run db:setup -- --project-ref YOUR_PROJECT_REF
   npm run db:setup -- --project-ref YOUR_PROJECT_REF --apply
   ~~~

   The setup helper checks the target and private-table access and applies the versioned migration atomically. It stops if unrelated public tables are present. Enable the hosted-database flag only after verifying the setup.
4. Link the repository to your **Vercel Hobby** project. Add the server variables to **Production** and, if needed, **Preview** separately. These environments do not inherit each other's values. Use inline `DATABASE_SSL_CA` on Vercel and keep local embedded mode off.
5. Deploy from the project root:

   ~~~sh
   npx --yes vercel@59.16.0 link
   npx --yes vercel@59.16.0 deploy --prod
   ~~~

   [`vercel.ts`](vercel.ts) builds the existing Next.js web application and eve agent together. Only the assistant endpoints route to eve; room APIs remain on Next.js. Dependencies and the lockfile are pinned.
6. Confirm the public URL works, then create/join a room, confirm identities, request taste suggestions, shortlist and approve independently.

For configuration-presence diagnostics, use `npm run setup:check`. It does not prove credentials or account eligibility. `npm run services:check` checks shared-service configuration; the combined local `dev:services` launcher remains unverified.

</details>

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run setup:local` | Prepare the private local session secret |
| `npm run dev:local` | Run the standalone example at port 3017 |
| `npm run setup:check` | Inspect configuration presence without displaying credentials |
| `npm run db:setup -- --project-ref …` | Inspect/bootstrap the dedicated hosted schema |
| `npm run typecheck` | Generate route types and check application TypeScript |
| `npm run build` | Build the Next.js application |
| `npm run agent:build` | Build the eve runtime |

## Limits and data

Rooms contain **2–6 members**, with up to **3 physical copies and 3 interests per member**. Exchanges have **2 or 3 participants**. Invite links permit joining; each member's private cookie authorizes their own decisions.

Qloo coverage can be sparse. The application preserves unknown evidence instead of inventing a score. Responses are cached privately. Only cultural entity signals are sent to Qloo, without reader aliases.

The assistant is bounded by request/token limits. Stopping the browser wait may leave a server turn running; refresh the room before retrying. Its output is plain text. General load capacity and remaining free-tier headroom are unmeasured. No participant study, recommendation-quality gain or completed physical handoff is claimed.

## License

[MIT](LICENSE). Font licenses are retained in [`public/fonts/`](public/fonts/). Project artwork is included for the CultureLoop demo.
