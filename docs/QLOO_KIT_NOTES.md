# Using the Qloo hackathon kit with CultureLoop

The reviewed kit contains documentation and CLI/MCP starters, not a downloadable cultural-taste dataset. Its manifest requires `@qloo/qloo-harness` 0.1.26 or newer and Node.js 22.19 or newer. CultureLoop's pinned Node requirement is newer. No starter was executed or copied into the application.

## Useful guidance

- `qloo_rank` ranks a specified set of options for cultural signals. This fits CultureLoop's fixed room catalog; a ranking does not establish a participant's willingness to receive a book.
- Resolve names to candidates, ask for confirmation, then rank. Ambiguous matches need a choice; empty and partial results must remain visible. CultureLoop keeps absent ranks unknown instead of manufacturing a score.
- Harness workflows expose `ok`, `empty`, `needs_input`, `partial`, `degraded` and `error` states. This is a useful reference when extending error/provenance presentation; it is not the raw REST response schema.
- Qloo credentials and quota are shared across the supported CLI/chat/MCP surfaces. Installing another surface does not add quota. The chat explorer also requires model-provider access; the kit does not provide free hosted inference.
- Submission evidence should explain the product problem, exact workflow/entity choices, redacted request-to-result path, demo, reproducible setup and limits. Keep Qloo evidence distinct from product interpretation and explicit choices.

## Deployment implications

The kit's `qloo mcp` is a local stdio process, with no hosted Qloo API MCP URL. Its starter targets a persistent VM/container and explicitly excludes serverless functions. CultureLoop therefore retains its existing server-side HTTP adapter and shared domain services; the standalone MCP starter is not a drop-in replacement for Next.js routes. A successful hosted deployment still requires separate verification.

`https://docs.qloo.com/mcp` is a credential-free documentation reference, not the data API. Do not give it a key or use its `execute-request` tool. Do not deploy the docs server as an application tool.

If using `qloo explore` for research, use an isolated folder containing no secrets or private captures. It can send files it reads to the configured model provider. Its `integrate`, `plan` and `build` modes are excluded from the kit's event support; these are harness modes, not restrictions on developing CultureLoop itself.

## References

- [Kit](https://github.com/qloo/qloo-hackathon-kit)
- [MCP starter](https://github.com/qloo/qloo-hackathon-kit/blob/main/starter/mcp-client/README.md)
- [Safe use](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/SAFE_USE.md)
- [Submission guidance](https://github.com/qloo/qloo-hackathon-kit/blob/main/docs/SUBMISSION.md)
- [Direct API guide](https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide)
