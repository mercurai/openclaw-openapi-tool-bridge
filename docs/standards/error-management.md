# Error Management Standard

## Taxonomy

All errors are typed. Use one of:

| Type | Meaning |
|------|---------|
| `VALIDATION_ERROR` | Schema validation failed, invalid input |
| `CONTEXT_ERROR` | Missing or invalid context (e.g., no active schema) |
| `POLICY_DENY` | Action denied by policy |
| `NETWORK_ERROR` | Network request failed (connection, timeout) |
| `UPSTREAM_ERROR` | External API returned error (4xx, 5xx) |
| `INTERNAL_ERROR` | Unexpected internal error |

## Error Response Format

All command handlers return envelope errors:

```json
{
  "ok": false,
  "command": "use",
  "data": null,
  "error": {
    "type": "VALIDATION_ERROR",
    "code": "VALIDATION_ERROR",
    "message": "Failed to fetch schema: 404",
    "details": { "url": "..." }
  },
  "meta": {
    "schemaVersion": "cli.v1",
    "timestamp": "2026-02-21T02:10:35.326Z"
  }
}
```

## Propagation Rules

1. Throw typed errors internally
2. Convert to envelope at CLI boundary
3. Never leak secrets in error messages or details
4. Include actionable next steps when possible

## Error Type Detection

Errors are automatically classified by pattern matching on error message:

- `VALIDATION_ERROR` — message contains "validation", "invalid schema", "openapi"
- `CONTEXT_ERROR` — message contains "not found", "missing"
- `POLICY_DENY` — message contains "denied", "forbidden", "policy"
- `NETWORK_ERROR` — message contains "fetch", "network", "connect", "econn"
- `UPSTREAM_ERROR` — message contains "4xx", "5xx", "upstream", "external"
- `INTERNAL_ERROR` — everything else

## Retry Policy

- Retry only idempotent GET requests
- No implicit retry for unsafe operations (POST, PUT, DELETE)
- Respect retry-after headers

## User-Facing Errors

- Concise, actionable, deterministic
- Include next-step hints when possible
- Use the proper error type so consumers can programmatically handle
