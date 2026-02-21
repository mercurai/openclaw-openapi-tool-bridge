# Output Contract v1 (`cli.v1`)

```json
{
  "ok": true,
  "command": "list",
  "data": {},
  "error": null,
  "meta": {
    "schemaVersion": "cli.v1",
    "timestamp": "ISO-8601",
    "context": {}
  }
}
```

## Rules
- Stable top-level keys: `ok, command, data, error, meta`
- `schemaVersion` must be `cli.v1`
- `error` is null on success
- `data` is null on failure
