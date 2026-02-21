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

```bash
npm install
npm run build
```

## CLI

```bash
# Inspect generated tools
npx openapi-bridge inspect -s ./test/sample.openapi.json --service tickets

# Generate manifest JSON
npx openapi-bridge manifest -s ./test/sample.openapi.json --service tickets -o manifest.json

# Serve runtime bridge
npx openapi-bridge serve -s ./test/sample.openapi.json --service tickets --port 8788
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
