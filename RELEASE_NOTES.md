# Release v0.1.0 - Stellar x402 Gateway Suite

**Release Tag**: `v0.1.0`  
**Documentation**: [https://x402-stellar.mintlify.app](https://x402-stellar.mintlify.app)  
**License**: Apache-2.0

---

## What's Included in v0.1.0

### 1. Multi-Primitive Payment Support (@stellar-x402/core)
* **`soroban_sac`**: Smart contract token invocations with signed authorization entries (`authEntryXdr`) and monotonic nonces.
* **`stellar_classic`**: Horizon-compatible transaction envelopes (`transactionEnvelopeXdr`) with optional memo identifiers for native XLM and trustline transfers.
* **`channel_voucher`**: Pre-authorized micropayment channel vouchers for high-frequency micro-calls.

### 2. Gasless Relaying & Concurrency Control (@stellar-x402/facilitator)
* `FacilitatorService`: Sponsoring transaction submission fees for gasless client interactions.
* `NonceSequencer`: FIFO transaction sequencing preventing `tx_bad_seq` sequence number collisions.
* Typed `X402ErrorCode` taxonomy across all error handling paths.

### 3. Streaming AI Token-Metering Paywall (@stellar-x402/streaming)
* Server-Sent Events (SSE) token and chunk meter for LLM completions (OpenAI, Anthropic, vLLM).
* Emits deterministic cryptographic stream receipts (`x402-stream-receipt`).

### 4. Middleware & Reverse Proxy
* `@stellar-x402/express`: Express middleware.
* `@stellar-x402/fastify`: Fastify plugin with route-level gating.
* `stellar-x402` (Python): Native ASGI and FastAPI middleware (`packages/python/`).
* `proxy/`: Zero-dependency standalone Go reverse proxy binary for non-Node backends.

### 5. Client & Developer Tooling
* `@stellar-x402/client`: AI agent payment client with automated 402 interception, budget guardrails, and retries.
* `apps/web`: Next.js 15 merchant portal with automated Vercel continuous deployment.
* `apps/demo-api`: Reference implementation and 4/4 passing end-to-end integration tests.
