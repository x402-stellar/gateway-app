# CLAUDE.md: x402-gateway-app

**Project**: `x402-gateway-app`
**Role**: TypeScript SDK, API middlewares, Go reverse proxy, and Next.js merchant portal
**Sibling Repo**: `github.com/x402-stellar/gateway-contract`
**Current Phase**: Phase 7 (App & Middleware Implementation)

## Non-Negotiables
- Node 22 LTS, pnpm 11, TypeScript 5.9.2 (`strict: true`)
- `@stellar/stellar-sdk`: 16.2.0 pinned
- Go 1.23+ in `proxy/`, `CGO_ENABLED=0` static compilation
- No `any`, no unresolved `@ts-ignore`
- All errors typed with `X402Error` subclasses

## Authoritative Documentation
- System Prompt: `docs/planning/system-prompt.md`
- Context & Architecture: `.agent/context.md`
- Decision Log: `.agent/decisions.md`
