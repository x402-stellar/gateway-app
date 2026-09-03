# gateway-app

[![CI](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-ts.yml/badge.svg)](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-ts.yml)
[![Docs](https://img.shields.io/badge/docs-mintlify-blue.svg)](https://github.com/x402-stellar/docs)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

x402-gateway-app lets API developers put HTTP 402 paywalls in front of their endpoints on Stellar. It includes an Express middleware, a Fastify plugin, a client library for automated AI agent payments, and a standalone Go reverse proxy that runs in front of non-Node backends. APIs can charge per request in USDC or XLM without changing their core business logic or building custom billing infrastructure.

## Monorepo Layout

```
packages/
  core/         # @stellar-x402/core - Challenge generation and signature parsing
  express/      # @stellar-x402/express - Express middleware
  fastify/      # @stellar-x402/fastify - Fastify plugin
  client/       # @stellar-x402/client - AI Agent payment client
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
