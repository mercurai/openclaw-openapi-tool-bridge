---
owner: mercur-ai
last-reviewed: 2026-02-21
stability: draft
---

# Reference Analysis — agency-swarm OpenAPI Conversion

## What was referenced
Repository: `https://github.com/VRSEN/agency-swarm`

Relevant implementation:
- `src/agency_swarm/tools/tool_factory_utils/openapi_importer.py`
- `docs/core-framework/tools/openapi-schemas.mdx`
- `tests/test_tools_modules/test_tool_factory_openapi.py`

## Key behaviors identified
1. Converts OpenAPI operations to tool objects
2. Supports headers/query params injection
3. Generates schema-based validation wrappers
4. Allows schema source from file or URL

## Gaps to improve for OpenClaw use-case
1. Primarily generator-style; limited runtime refresh orchestration
2. No first-class OpenClaw adapter contract
3. Limited operational telemetry and policy controls
4. Not optimized around schema drift workflows

## Decisions in this project
- Runtime-first registry (`refresh`, fingerprint diff)
- Deterministic naming for stable agent prompts
- Explicit OpenClaw manifest adapter endpoint
- Lightweight HTTP runtime for easier deployment
