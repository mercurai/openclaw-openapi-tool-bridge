---
owner: mercur-ai
last-reviewed: 2026-02-21
stability: draft
---

# Architecture

## Modules
- `schema-loader`: load + dereference OpenAPI
- `compiler`: convert operations -> `ToolDef`
- `registry`: maintain current tool set + fingerprint
- `executor`: perform actual HTTP calls
- `openclaw-manifest`: output OpenClaw-compatible metadata
- `server`: expose `/tools`, `/invoke`, `/refresh`

## Data Flow
1. Load schema
2. Compile operations
3. Store in registry
4. Serve manifest
5. Invoke operation by name
6. Refresh on demand to pick updates

## Security model
- Auth profile injected at runtime
- no token logging
- recommend localhost binding and reverse-proxy controls
