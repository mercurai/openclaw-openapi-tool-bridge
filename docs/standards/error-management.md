# Error Management Standard

## Taxonomy
- `VALIDATION_ERROR`
- `CONTEXT_ERROR`
- `POLICY_DENY`
- `NETWORK_ERROR`
- `UPSTREAM_ERROR`
- `INTERNAL_ERROR`

## Wrapping
All command handlers return envelope errors:
`{ ok:false, command, data:null, error:{code,message,details}, meta }`

## Propagation
- Throw typed errors internally.
- Convert to envelope in CLI boundary.
- Never leak secrets in messages.

## Retries
- Retry only idempotent GETs by policy.
- No implicit retry for unsafe write operations.

## User-facing errors
- concise, actionable, deterministic
- include next step hints when possible
