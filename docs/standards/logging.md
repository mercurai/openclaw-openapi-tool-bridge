# Logging Standard

## Levels
- `debug` (local diagnostics)
- `info` (normal lifecycle)
- `warn` (degraded behavior)
- `error` (failed operation)

## Structured schema
Minimum fields:
- `ts`
- `level`
- `event`
- `command`
- `correlationId`
- `details`

## Redaction rules
Always redact:
- Authorization headers
- API keys/tokens
- cookies/session material
- PII fields when known

## Correlation IDs
Every command execution should attach a `correlationId` propagated through invoke path.

## Sinks
- stdout (default)
- file/json sink (optional, future)
