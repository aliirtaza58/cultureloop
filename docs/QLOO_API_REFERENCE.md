# Qloo API reference

Reviewed October 18, 2026. Based on the [official hackathon guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide#getting-your-api-key) read during project research. Recheck the live source for changes.

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

Live calls with the entrant's key have not yet been tested. Validate fixed-catalog ranking and explanation availability before depending on either in the interface.
