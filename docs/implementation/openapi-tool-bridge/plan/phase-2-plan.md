---
owner: mercur-ai
last-reviewed: 2026-02-21
stability: draft
---

# Phase 2 Plan — Normalization, Validation, Catalog, Diff

## Executive Summary
Phase 2 adds production-grade schema operations and ecosystem integration:
1. normalization via ReadMe OAS tooling
2. strict validation path via python validator
3. APIs.guru catalog bootstrap for instant API enablement
4. bump CLI schema diff command

## Success Criteria
- `normalize` command outputs valid normalized OpenAPI JSON
- `validate` command confirms schema validity and optional strict Python validation
- `catalog sync/list/enable` workflow creates valid bridge config
- `diff` command runs bump and surfaces output or clear missing-tool errors

## Risks
- third-party CLI/package API changes
- large catalog index size (~MBs)
- platform dependency for Python validator

## Dependencies
- npm package: `oas-normalize`
- optional system package: `openapi-spec-validator`
- optional system package: `bump` CLI
- API source: `https://api.apis.guru/v2/list.json`

## Tasks

- [ ] Task 1 — Integrate OAS normalization
  - [ ] 1.1 Add `oas-normalize` dependency
  - [ ] 1.2 Implement `src/phase2/normalizer.ts`
  - [ ] 1.3 Add `openapi-bridge normalize` CLI command

- [ ] Task 2 — Strict validation path
  - [ ] 2.1 Implement python validator adapter
  - [ ] 2.2 Add `openapi-bridge validate` command
  - [ ] 2.3 Add graceful error behavior when python validator missing

- [ ] Task 3 — APIs.guru catalog integration
  - [ ] 3.1 Implement `catalog sync` to local cache
  - [ ] 3.2 Implement `catalog list`
  - [ ] 3.3 Implement `catalog enable` to generate `bridge.config.json`

- [ ] Task 4 — Schema diff integration
  - [ ] 4.1 Implement bump wrapper adapter
  - [ ] 4.2 Add `openapi-bridge diff --old --new`
  - [ ] 4.3 Return actionable error when bump CLI missing

- [ ] Task 5 — Validation + release
  - [ ] 5.1 Build + tests green
  - [ ] 5.2 README update with new commands
  - [ ] 5.3 Commit + push phase-2 changes

## Validation Commands
- `npm run build`
- `npm test`
- `node dist/cli.js normalize -s test/sample.openapi.json`
- `node dist/cli.js validate -s test/sample.openapi.json`
- `node dist/cli.js catalog sync`
- `node dist/cli.js catalog list -n 5`

## Rollback
- revert to pre-phase-2 commit
- keep phase-1 bridge runtime unchanged if external tools fail
