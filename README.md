# gateway-app

[![CI TypeScript](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-ts.yml/badge.svg)](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-ts.yml)
[![CI Go Proxy](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-go.yml/badge.svg)](https://github.com/x402-stellar/gateway-app/actions/workflows/ci-go.yml)
[![Docs](https://img.shields.io/badge/docs-x402--stellar.mintlify.app-blue.svg)](https://x402-stellar.mintlify.app)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

x402-gateway-app lets API developers put HTTP 402 paywalls in front of their endpoints on Stellar. It includes an Express middleware, a Fastify plugin, a gasless settlement relayer, an AI agent payment client, and a standalone Go reverse proxy that runs in front of non-Node backends. APIs can charge per request in USDC or XLM without changing their core business logic or building custom billing infrastructure.

Documentation and integration guides: [https://x402-stellar.mintlify.app](https://x402-stellar.mintlify.app)

---

## Monorepo Layout

```
packages/
  core/         # @stellar-x402/core - Challenge generation, multi-primitive signatures, schemas
  express/      # @stellar-x402/express - Express middleware
  fastify/      # @stellar-x402/fastify - Fastify plugin
  facilitator/  # @stellar-x402/facilitator - Gasless relayer service and nonce sequencer
  streaming/    # @stellar-x402/streaming - Server-Sent Events (SSE) paywall and token meter
  client/       # @stellar-x402/client - AI Agent payment client
  python/       # stellar-x402 - Python ASGI & FastAPI paywall middleware
  cli/          # @stellar-x402/cli - Developer setup and challenge inspection CLI
proxy/          # Standalone Go reverse proxy (zero-dependency static binary)
apps/
  web/          # Next.js 15 merchant portal
  demo-api/     # Reference API fixture
```

---

## Supported Payment Primitives

The gateway suite supports three distinct Stellar payment mechanisms:

1. **`soroban_sac`**: Smart contract token invocations using signed `authEntryXdr` and monotonic replay nonces.
2. **`stellar_classic`**: Horizon-compatible transaction envelopes (`transactionEnvelopeXdr`) with optional memo identifiers, ideal for native XLM and trustline credit assets.
3. **`channel_voucher`**: Pre-authorized micropayment channel vouchers (`channelId`, `voucherIndex`, `voucherSignature`) for high-frequency or streaming API calls without per-call on-chain transactions.

---

## Facilitator & Gasless Relaying

The `@stellar-x402/facilitator` package enables gasless transactions where the merchant or gateway sponsors Soroban transaction fees:

* **Concurrency Sequencer**: `NonceSequencer` FIFO task queue eliminates `tx_bad_seq` sequence number collisions under concurrent load.
* **Optimistic Acceptance**: Sub-15ms approvals with asynchronous on-chain batch submission.
* **Receipt Cache**: In-memory and pluggable receipt verification store.

```ts
import { FacilitatorService } from '@stellar-x402/facilitator';

const facilitator = new FacilitatorService({
  network: 'stellar:testnet',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sponsorSecretKey: process.env.SPONSOR_SECRET_KEY!,
  settlementContractId: 'CATZACNU6KVGZXYF7J4O4NLINRKL5FWC2YAQPHTIQMSQPDAJSSOMRUNL',
  optimisticAcceptance: true,
});

const receipt = await facilitator.processSettlement({ signature, challenge });
```

---

## Streaming AI Paywall (@stellar-x402/streaming)

The `@stellar-x402/streaming` package meters Server-Sent Events (SSE) and token streams for AI inference APIs (OpenAI, Anthropic, or custom LLM endpoints):

* **Token & Chunk Metering**: Inspects streaming chunk deltas and calculates exact token counts.
* **Deterministic Settlement**: Computes settled amounts and emits cryptographic stream receipt headers (`strm_rcpt_<payer>_<streamId>_<timestamp>`).

```ts
import { StreamTokenMeter, StreamSettler } from '@stellar-x402/streaming';

const meter = new StreamTokenMeter({
  pricePerUnit: '0.0001', // 0.0001 USDC per token
  asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  recipient: 'GCAL...',
  pricingModel: 'per_token',
});

meter.recordChunk('data: {"choices":[{"delta":{"content":"Hello world!"}}]}\n\n');
const result = meter.getResult();
```

---

## Quickstart

### 1. Express Middleware
```ts
import express from 'express';
import { stellarX402Middleware } from '@stellar-x402/express';

const app = express();

app.use(
  '/api/v1/data',
  stellarX402Middleware({
    price: '0.01',
    asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    recipient: 'GD...',
    network: 'stellar:testnet',
    acceptedPaymentTypes: ['soroban_sac', 'stellar_classic'],
  })
);

app.get('/api/v1/data', (req, res) => {
  res.json({ status: 'ok', data: 'Protected content delivered' });
});

app.listen(3000);
```

### 2. Standalone Go Reverse Proxy
```bash
cd proxy
go run cmd/gateway/main.go --config config.yaml
```

### 3. FastAPI (Python) Middleware
```python
from fastapi import FastAPI, Request
from x402 import X402Middleware, RoutePricingPolicy

app = FastAPI()

app.add_middleware(
    X402Middleware,
    policy=RoutePricingPolicy(
        path="/api/v1",
        price="0.01",
        asset="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        recipient="GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6",
        network="stellar:testnet",
    )
)

@app.get("/api/v1/forecast")
async def get_forecast(request: Request):
    return {"city": "New York", "temperature": 68}
```

### 4. Developer CLI (@stellar-x402/cli)
```bash
# Generate middleware boilerplate interactively
npx @stellar-x402/cli init --framework express --path /api/v1/data --price 0.01

# Inspect gas and resource benchmarks
npx @stellar-x402/cli quote --op settle_payment

# Generate and verify base64 challenges
npx @stellar-x402/cli challenge --price 0.01 --recipient GCAL... --asset CDLZ...
```

---

## Structured Error Taxonomy

Every error emitted by the gateway uses typed `X402ErrorCode` identifiers:

| Error Code | Description |
|---|---|
| `X402_AUTH_MISSING` | Request omitted payment signature header |
| `X402_AUTH_INVALID_FORMAT` | Malformed base64 or schema validation failure |
| `X402_AUTH_EXPIRED` | Payment challenge timestamp has lapsed |
| `X402_NONCE_STALE` | Nonce already settled or out of monotonic sequence |
| `X402_NETWORK_MISMATCH` | Signature target network differs from gateway configuration |
| `X402_ASSET_UNSUPPORTED` | Asset address or asset code not in route whitelist |
| `X402_RPC_SIMULATION_FAILED` | Transaction simulation rejected by Soroban host |
| `X402_SUBMISSION_REVERTED` | On-chain transaction execution reverted |

---

## Merchant Portal & Vercel Deployment

The merchant analytics dashboard (`apps/web`) is a Next.js 15 application displaying real-time 24-hour volume, active paid routes, and settlement fee metrics.

### Local Development
```bash
cd apps/web
pnpm dev
```

### Vercel Production Deployment
The application includes a preconfigured `apps/web/vercel.json` and a GitHub Actions continuous deployment pipeline (`.github/workflows/deploy-vercel.yml`).

To automate production deployments on push to `main`, set the following repository secrets:
* `VERCEL_TOKEN`: Vercel Personal Access Token
* `VERCEL_ORG_ID`: Vercel Team / Account Identifier
* `VERCEL_PROJECT_ID`: Vercel Project Identifier

## Reference API & End-to-End Testing (apps/demo-api)

The repository includes a reference Express API implementation demonstrating complete end-to-end integration with the Stellar Testnet verifier contract:

* **`/health`**: Open endpoint reporting network and contract ID status.
* **`/api/v1/weather`**: Protected by `stellarX402Middleware` at 0.01 USDC per request.
* **`/api/v1/stream`**: Protected by `@stellar-x402/streaming` with per-token billing over Server-Sent Events (SSE).

### Running the Reference Server
```bash
cd apps/demo-api
pnpm start
```

### Running the End-to-End Integration Tests
```bash
pnpm -C apps/demo-api test
```

---

## License
Apache-2.0
