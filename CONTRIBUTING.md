# Contributing

## Development
```bash
npm install
npm run build
npm test
```

## Primary CLI workflow
```bash
openapi-bridge use <schema-url|api-id|local-file> --service <name>
openapi-bridge list --format json
openapi-bridge show <endpoint>
openapi-bridge run <endpoint> --param k=v --body @payload.json
```

## Standards
- Follow `docs/standards/error-management.md`
- Follow `docs/standards/logging.md`
- Follow output contract `docs/contracts/output-contract-v1.md`

## PR requirements
- Build + tests pass
- README updated if behavior changed
- Contract changes require versioned migration note
