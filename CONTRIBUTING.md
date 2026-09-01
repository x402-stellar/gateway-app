# Contributing to x402-gateway-app

## Monorepo Standards
- TypeScript: `strict: true`, no `any`.
- Go: `gofmt` formatted, all errors wrapped with `%w`.
- Commit format: `type(scope): description` (e.g. `feat(core): implement challenge builder`).
- Run `pnpm test` and `cd proxy && go test ./...` before pushing.
