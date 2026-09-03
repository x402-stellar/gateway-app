import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { createApp, TESTNET_CONTRACT_ID, TESTNET_USDC_ASSET } from '../src/server.js';
import { parseX402ChallengeHeader, createPaymentSignatureHeader } from '@stellar-x402/core';
import { X402Client } from '@stellar-x402/client';

describe('End-to-End System Verification (x402 Gateway + Testnet Verifier)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as { port: number };
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should serve /health with live Testnet contract ID', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.network).toBe('stellar:testnet');
    expect(body.contractId).toBe(TESTNET_CONTRACT_ID);
  });

  it('should intercept unpaid request with 402 challenge', async () => {
    const res = await fetch(`${baseUrl}/api/v1/weather`);
    expect(res.status).toBe(402);

    const paymentRequiredHeader = res.headers.get('payment-required');
    expect(paymentRequiredHeader).toBeDefined();

    const challenge = parseX402ChallengeHeader(paymentRequiredHeader!);
    expect(challenge.version).toBe('x402-v1');
    expect(challenge.network).toBe('stellar:testnet');
    expect(challenge.price).toBe('0.01');
    expect(challenge.asset).toBe(TESTNET_USDC_ASSET);
  });

  it('should allow payment and deliver payload when valid signature is attached', async () => {
    // 1. Trigger 402 challenge
    const challengeRes = await fetch(`${baseUrl}/api/v1/weather`);
    const challengeHeader = challengeRes.headers.get('payment-required')!;
    const challenge = parseX402ChallengeHeader(challengeHeader);

    // 2. Client signs authorization entry
    const client = new X402Client({
      payerAddress: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      signAuthorization: async (ch) => ({
        authEntryXdr: 'AAAAAgAAAAEAAAA...',
        nonce: 1,
      }),
    });

    // 3. Automated fetch through X402Client
    const paidRes = await client.fetch(`${baseUrl}/api/v1/weather`);
    expect(paidRes.status).toBe(200);

    const data = await paidRes.json();
    expect(data.city).toBe('San Francisco');
    expect(data.temperature).toBe(72);
  });

  it('should stream tokens and deliver settlement receipt over SSE', async () => {
    const mockSig = createPaymentSignatureHeader({
      network: 'stellar:testnet',
      paymentType: 'soroban_sac',
      authEntryXdr: 'AAAA...',
      payer: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      nonce: 1,
    });

    const res = await fetch(`${baseUrl}/api/v1/stream`, {
      headers: {
        'payment-signature': mockSig,
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const text = await res.text();
    expect(text).toContain('Hello ');
    expect(text).toContain('[DONE]');
    expect(text).toContain('event: settlement');
    expect(text).toContain('receipt');
  });
});
