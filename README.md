# openclaw-openapi-tool-bridge

Dynamic **OpenAPI → Tool Bridge** for OpenClaw.

This project turns an OpenAPI schema (URL or file) into a runtime tool registry and exposes:

- `GET /tools` — OpenClaw-compatible tool manifest
- `POST /invoke/:name` — invoke generated tool by name
- `POST /refresh` — reload schema and hot-update tools

## Why

Most schema-to-tool projects are one-shot generators. This bridge is designed for **always-up-to-date schemas**:

- live schema refresh
- operation diff/fingerprint
- auth profiles (bearer/api key)
- deterministic tool naming (`openapi.<service>.<operationId>`)

## Install

### Global install (recommended)

```bash
npm install -g openclaw-openapi-tool-bridge
openapi-bridge --help
```

### Local development install

```bash
npm install
npm run build
npm link
openapi-bridge --help
```

## CLI (Primary Workflow)

```bash
# Select once (normalize + validate + compile cached internally)
openapi-bridge use ./test/sample.openapi.json --service tickets

# Discover endpoints
openapi-bridge list --format json
openapi-bridge show createTicket --format json

# Execute
openapi-bridge run createTicket --param priority=high --body '{"message":"hello"}'

# Shorthand alias (defaults to run)
openapi-bridge createTicket --param priority=high --body '{"message":"hello"}'

# Agent-friendly help
openapi-bridge help-json
```

## CLI (Advanced)

```bash
openapi-bridge inspect -s ./test/sample.openapi.json --service tickets
openapi-bridge manifest -s ./test/sample.openapi.json --service tickets -o manifest.json
openapi-bridge normalize -s ./test/sample.openapi.json -o normalized.json
openapi-bridge validate -s ./test/sample.openapi.json --python-strict
openapi-bridge serve -s ./test/sample.openapi.json --service tickets --port 8788
openapi-bridge catalog sync
openapi-bridge catalog list -n 20
openapi-bridge catalog enable -a stripe.com -o bridge.config.json
openapi-bridge diff --old old.json --new new.json
```

## OpenClaw integration (current approach)

Use this bridge as a local runtime service and map it into your OpenClaw workflow via plugin/skill wrappers.

Recommended pattern:
1. Run bridge as systemd service
2. Add wrapper commands/tools that call `/tools` and `/invoke/:name`
3. Schedule `/refresh` on schema update intervals

## Security

- Never log API tokens
- Prefer env vars for secrets
- Restrict bridge network exposure (localhost or trusted LAN)
- Add request size/time limits in production

## Roadmap

- Native OpenClaw plugin adapter
- OAuth2 auth provider support
- multi-schema merge
- per-operation policy controls
- websocket push on schema updates

## License

MIT
