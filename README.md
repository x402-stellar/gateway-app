# x402-gateway-app

[![CI](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-ts.yml/badge.svg)](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-ts.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

`x402-gateway-app` is a modular TypeScript and Go monorepo providing developer tooling, API middleware, and an edge-compatible reverse proxy for monetizing Web2 and Web3 APIs using the x402 payment protocol on the Stellar network. It packages `@stellar-x402/core` (XDR challenge encoding and payment signature verification), one-line middlewares for Express and Fastify, an automated AI agent payment client, a high-throughput standalone Go reverse proxy (`proxy/`), and a Next.js 15 merchant portal for real-time settlement telemetry. It allows any service provider to accept Stellar-anchored stablecoin micropayments without altering upstream business logic.

## Monorepo Layout

```
packages/
  core/         # @stellar-x402/core - Challenge construction & signature parsing
  express/      # @stellar-x402/express - One-line Express middleware
  fastify/      # @stellar-x402/fastify - One-line Fastify plugin
  client/       # @stellar-x402/client - AI Agent Auto-Payer SDK
proxy/          # Standalone Go reverse proxy (zero-dependency static binary)
apps/
  web/          # Next.js 15 merchant dashboard
  demo-api/     # Reference API fixture
```

## Quickstart

### 1. Express Middleware
```ts
import express from 'express';
import { stellarX402Middleware } from '@stellar-x402/express';

const app = express();

app.use(
  '/api/v1/weather',
  stellarX402Middleware({
    price: '0.01', // 0.01 USDC
    asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    recipient: 'GD...',
    network: 'stellar:testnet',
  })
);

app.get('/api/v1/weather', (req, res) => {
  res.json({ temp: 72, condition: 'Sunny' });
});

app.listen(3000);
```

### 2. Standalone Go Reverse Proxy
```bash
cd proxy
go run cmd/gateway/main.go --config config.yaml
```

## License
Apache-2.0
