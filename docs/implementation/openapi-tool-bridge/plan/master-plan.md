---
owner: mercur-ai
last-reviewed: 2026-02-21
stability: draft
---

# OpenClaw OpenAPI Tool Bridge — Master Implementation Plan

## 1. Executive Summary

### Objective
Build an open-source **runtime** bridge that converts OpenAPI schemas into callable tools for OpenClaw with hot-refresh support.

### Scope
- OpenAPI ingest from file/URL
- Tool compilation and deterministic naming
- Runtime invoke service
- OpenClaw manifest adapter
- Tests, docs, release

### Excluded
- Full OAuth2 flow (phase 2+)
- Deep protocol-specific OpenClaw plugin internals

## 2. Success Criteria
- Bridge serves tools from schema in < 2s on baseline sample
- `inspect`, `manifest`, and `serve` CLI commands working
- Refresh updates fingerprint and tool set
- Test suite green in CI

## 3. Risk Assessment
- High: schema variability across providers
- Medium: auth/header/query edge-cases
- Medium: request/response size and timeout management

### Rollback
- Keep last stable release tag
- Pin deployments to known version

## 4. Dependencies
- Node 20+
- OpenAPI 3.x schemas
- OpenClaw runtime for integration testing

## 5. Resource Requirements
- 1 architect/maintainer
- 1 implementation agent
- 1 QA/test agent

## 6. Implementation Phases

### Phase 0 — Baseline and Design
- [ ] Task 0 — Architecture baseline
  - [ ] 0.1 Define module boundaries (`loader`, `compiler`, `registry`, `executor`, `adapter`, `server`)
  - [ ] 0.2 Define naming spec `openapi.<service>.<operationId>`
  - [ ] 0.3 Define auth profile contract (`none|bearer|apikey`)

### Phase 1 — Core Build
- [ ] Task 1 — Schema ingestion
  - [ ] 1.1 File/URL loading
  - [ ] 1.2 JSON/YAML parse
  - [ ] 1.3 `$ref` resolution
- [ ] Task 2 — Tool compiler
  - [ ] 2.1 Path/method operation extraction
  - [ ] 2.2 parameter + request body schema mapping
  - [ ] 2.3 deterministic name generation and collision handling
- [ ] Task 3 — Runtime invoke
  - [ ] 3.1 path parameter substitution
  - [ ] 3.2 query/body serialization
  - [ ] 3.3 auth injection and error normalization

### Phase 2 — Runtime Service + Adapter
- [ ] Task 4 — Server
  - [ ] 4.1 `/health`
  - [ ] 4.2 `/tools`
  - [ ] 4.3 `/invoke/:name`
  - [ ] 4.4 `/refresh`
- [ ] Task 5 — OpenClaw adapter
  - [ ] 5.1 manifest output format
  - [ ] 5.2 integration examples and scripts

### Phase 3 — Validation, Packaging, Release
- [ ] Task 6 — Tests
  - [ ] 6.1 compiler tests
  - [ ] 6.2 integration test with sample schema
  - [ ] 6.3 error path tests
- [ ] Task 7 — Packaging and publish
  - [ ] 7.1 build + typecheck + test
  - [ ] 7.2 GitHub repo push + release tag

## 7. Validation Plan
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
- Runtime smoke:
  - `openapi-bridge inspect ...`
  - `openapi-bridge serve ...`
  - `curl /tools`

## 8. Observability
- Startup logs: schema source, tool count, fingerprint
- invoke logs: tool name, status, latency bucket

## 9. Audit Trail
- Commit-based log for each phase
- Follow-up issues for roadmap items
