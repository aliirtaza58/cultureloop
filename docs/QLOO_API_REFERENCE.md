# Qloo API reference

Reviewed October 21, 2026. The full [official hackathon guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide#getting-your-api-key), Search Entities, Entity Type Parameter Guide, and Insights reference were downloaded and read after the web reader failed. Original snapshots remain private; this file contains implementation notes only.

- Request a key through the guide's form. Provisioning is manual; allow several business days and check spam.
- Hackathon base: `https://hackathon.api.qloo.com`. Event keys do not authenticate against production or staging.
- Authenticate using the `X-Api-Key` header, not a Bearer token or query parameter.
- The hackathon guide specifies `GET /v2/insights` with query-string parameters.
- Resolve names through `/search`; obtain tag IDs through `/v2/tags`. Supply valid IDs to Insights.
- Insights requires `filter.type`; CultureLoop targets `urn:entity:book`. Search has its own type rules.
- Do not use `/recs`, `/recommendations`, or `/v2/insights/search`.
- Check each parameter against the selected entity type. Unsupported parameters may be silently ignored.
- Diagnose 401: environment/header/key; 403: unsupported type; 404: path/method; empty 200: filters or coverage.
- Private server caching is allowed. Public repositories must exclude Qloo response data.
- Quotas apply; request increases through Discord `#api-help`. Keys remain active through judging, then expire.

## Additional organizer guidance

Use individually attributable credentials, bounded retries, and small requests. Keep keys out of browser bundles, logs, and repositories. See [API access](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/API_ACCESS.md).

Send cultural signals without personal identifiers. Affinity describes aggregate relationships, not personal enjoyment probabilities. Keep Qloo evidence distinct from application interpretation. See [safe use](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/SAFE_USE.md).

## CultureLoop implementation references

- [Insights API](https://docs.qloo.com/reference/insights-api-deep-dive)
- [Parameters by entity type](https://docs.qloo.com/reference/available-parameters-by-entity-type)
- [Entity search](https://docs.qloo.com/reference/get-search)
- [Official starter kit](https://github.com/qloo/qloo-hackathon-kit)

Live authentication/search passed on October 21 using the ignored .env file. Search uses `types` arrays; observed Insights rows use generic `type: urn:entity` plus `subtype: urn:entity:book`. Validate both shapes. Fixed-catalog coverage and variation are separate checks. The book parameter guide documents filter.results.entities and signal.interests.entities. Observe actual explainability availability before depending on it.

Local scripts load ignored .env followed by .env.local. Shell variables retain Node's precedence. Never publish a populated environment. Feasibility runs allow at most 35 requests, no automatic retry, with private caching and count-only console summaries.
