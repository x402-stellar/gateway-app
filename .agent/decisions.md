# Architecture Decision Records: x402-gateway-app

Append-only. Never rewrite an entry. If a decision is reversed, append a new ADR that supersedes the old one.

---

## ADR-001: pnpm Workspace Monorepo with Isolated Go Module

Date: 2026-09-01
Status: accepted

### Context
The application repository contains both TypeScript libraries (SDKs, middlewares, web frontend) and a Go reverse-proxy daemon.

### Decision
Use `pnpm-workspace.yaml` for all TypeScript workspaces (`packages/*`, `apps/*`). Keep `proxy/` as an isolated Go module with its own `go.mod`. CI runs separate workflows for TypeScript (`ci-ts.yml`) and Go (`ci-go.yml`).

---

## ADR-002: Pin @stellar/stellar-sdk at 16.2.0

Date: 2026-09-01
Status: accepted

### Context
`@stellar/stellar-sdk@16.2.0` includes complete Soroban RPC clients, XDR parsers, and SAC token helpers. Version 17 is still in release-candidate stage.

### Decision
Pin `@stellar/stellar-sdk` at `16.2.0` across all packages. Declare peer dependency range as `>=16.2.0 <17.0.0`.

---

## ADR-003: CAIP-2 Stellar Network Identifiers in x402 Headers

Date: 2026-09-01
Status: accepted

### Context
The x402 protocol specification uses CAIP-2 network identifiers in `PAYMENT-REQUIRED` headers to distinguish chains and networks (e.g. `stellar:pubnet`, `stellar:testnet`).

### Decision
Format all x402 challenges with standard CAIP-2 identifiers:
- Testnet: `stellar:testnet`
- Mainnet: `stellar:pubnet`
- Futurenet: `stellar:futurenet`

---

## ADR-004: In-Memory Signature Replay Cache with TTL

Date: 2026-09-01
Status: accepted

### Context
To achieve sub-15ms proxy latency, the Go reverse proxy must avoid querying the blockchain for signature verification on every identical request while preventing replay.

### Decision
Maintain an LRU in-memory cache of verified `PAYMENT-SIGNATURE` hashes with an expiration time matched to the challenge's `valid_until` timestamp.

---

## ADR-005: Dual Packaging (ESM + CommonJS) via tsup

Date: 2026-09-01
Status: accepted

### Context
Consumers may use modern ESM runtimes or legacy CommonJS Node setups (e.g. older Express servers).

### Decision
Build all `@stellar-x402/*` packages using `tsup` targeting both ESM and CJS formats with TypeScript declarations emitted to `dist/index.d.ts`.
