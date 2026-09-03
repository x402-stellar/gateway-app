# Contributing to x402-gateway-app

Thank you for contributing to the Stellar x402 Gateway suite.

---

## 1. Monorepo Architecture

This monorepo manages all off-chain components of the Stellar x402 ecosystem:
* `packages/core`: Challenge parsing, signature verification, and multi-primitive schemas.
* `packages/express`: Express HTTP middleware.
* `packages/fastify`: Fastify plugin with route-level gating.
* `packages/facilitator`: Gasless fee-sponsoring relayer and concurrency sequencer.
* `packages/client`: Automated AI agent payment client.
* `proxy/`: Standalone Go reverse proxy binary for non-Node backends.
* `apps/web`: Next.js 15 merchant portal.

---

## 2. Development Setup

### Prerequisites
* Node.js >= 22.13.0
* pnpm 11.1.3 (`corepack enable && corepack prepare pnpm@11.1.3 --activate`)
* Go 1.23+ (for proxy)

### Commands
```bash
# Install all dependencies
pnpm install

# Build all packages in topological order
pnpm build

# Run TypeScript typechecks across all packages
pnpm typecheck

# Run test suite
pnpm test

# Test Go proxy
cd proxy && go test -v -race ./...
```

---

## 3. Code Standards & Invariants

* **Strict TypeScript**: `noImplicitAny: true`, `exactOptionalPropertyTypes: true`. No untyped casts.
* **Error Taxonomy**: Always use typed `X402ErrorCode` constants when generating or throwing errors.
* **Go Proxy Formatting**: Run `gofmt` on all Go code; ensure all errors are properly wrapped with `%w`.
* **Testing**: Every new feature or bug fix must include corresponding tests in the relevant package `tests/` directory.

---

## 4. Git & Commit Guidelines

We enforce Conventional Commits:
* `feat(scope): ...`
* `fix(scope): ...`
* `test(scope): ...`
* `docs(scope): ...`
* `chore: ...`

Always run `pnpm build`, `pnpm typecheck`, and `pnpm test` before pushing commits to verify that CI will pass.
