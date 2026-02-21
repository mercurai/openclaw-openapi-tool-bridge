# Logging Standard

## Format

Structured JSON lines to stdout. Each log entry is a JSON object.

## Log Entry Schema

```json
{
  "ts": "2026-02-21T02:10:35.326Z",
  "level": "info",
  "event": "schema.loaded",
  "traceId": "19b74852-a869-4b14-8f29-e0891cf98722",
  "spanId": "optional-span-id",
  "details": { "key": "value" },
  "error": {
    "type": "NETWORK_ERROR",
    "message": "connection refused",
    "stack": "Error: ..."
  },
  "url": "https://api.example.com/spec",
  "http": {
    "request": { "method": "GET" },
    "response": { "status_code": 200 }
  }
}
```

## Levels

- `debug` — local diagnostics, verbose
- `info` — normal lifecycle events
- `warn` — degraded behavior, recoverable issues
- `error` — failed operations

## Required Fields

- `ts` — ISO 8601 timestamp
- `level` — log level
- `event` — what happened (e.g., `schema.loaded`, `fetch.failed`)
- `traceId` — request/operation correlation ID

## Optional Fields

- `spanId` — for distributed tracing
- `details` — contextual data
- `error` — error object with type and message
- `url`, `http.*` — OTel semantic conventions

## Redaction

Always redact sensitive fields:
- `authorization`, `authorization_header`
- `x-api-key`, `api_key`, `apikey`
- `token`, `access_token`, `refresh_token`
- `secret`, `password`, `cookie`
- Any field containing `token`, `secret`, `password`, `key`, or `auth` in the name

## Correlation

Use `traceId` (OTel-compatible term, formerly `correlationId`) to track a single request/operation across components.

## Sinks

- stdout (JSON lines) — primary
- file sink — future
