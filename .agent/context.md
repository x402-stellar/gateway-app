# Context: x402-gateway-app

Onboarding for a fresh session, AI or human. Read this before touching code. Updated at phase transitions, not at every commit.

## 1. What x402-gateway-app is

`x402-gateway-app` provides the application, middleware, and daemon tooling that enables API developers to gate their HTTP services behind x402 payments settled on Stellar.

Traditional API monetization requires billing portals, Stripe accounts, API key generation, and database subscriptions. For AI agents making programmatic micro-calls (e.g. $0.005 per inference), this friction makes M2M commerce impossible.

This repository provides two deployment models:
1. **In-Process Middleware**: If the merchant runs Node.js (Express, Fastify, NestJS), they import `@stellar-x402/express` or `@stellar-x402/fastify` and add one middleware function with route pricing rules.
2. **Reverse-Proxy Gateway**: If the merchant runs Python, Go, Rust, Java, or an external API, they deploy the standalone `proxy/` daemon in front of their backend. The proxy intercepts unauthenticated requests, generates HTTP 402 challenges with Stellar payment specs, verifies the `PAYMENT-SIGNATURE` headers, and forwards paid requests to the upstream server.

## 2. Structure of the Monorepo

- `packages/core` (`@stellar-x402/core`): Canonical TypeScript library for building x402 challenge headers, parsing Soroban authorization entries, and verifying on-chain settlement.
- `packages/express` (`@stellar-x402/express`): Express middleware wrapper.
- `packages/fastify` (`@stellar-x402/fastify`): Fastify plugin wrapper.
- `packages/client` (`@stellar-x402/client`): Autonomous AI Agent client that wraps `fetch()` to automatically handle 402 challenges by signing and settling payments on Stellar.
- `proxy/`: High-performance Go daemon with pure-Go SQLite / memory cache and zero CGO dependencies.
- `apps/web`: Next.js 15 App Router merchant analytics dashboard.
- `apps/demo-api`: Reference weather and text inference API for live end-to-end integration tests.

## 3. Tech Stack & Compatibility Constraints

- **Node**: 22 LTS
- **Package Manager**: pnpm 11 (`pnpm-workspace.yaml`)
- **TypeScript**: 5.9.2 with `strict: true`
- **Stellar SDK**: `@stellar/stellar-sdk@16.2.0` (pinned)
- **Go**: 1.23+ with `chi` router and `slog` structured logging.
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, shadcn/ui.
