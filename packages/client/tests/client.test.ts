import { describe, it, expect, vi } from 'vitest';
import { StellarX402Client } from '../src/client.js';
import { createX402ChallengeHeader } from '@stellar-x402/core';

describe('StellarX402Client (Agent Auto-Payer)', () => {
  it('should pass through non-402 responses unchanged', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const client = new StellarX402Client({
      payerAddress: 'GB_TEST',
      signAuthorization: async () => ({ authEntryXdr: 'AAAA', nonce: 1 }),
      fetchImpl: mockFetch as any,
    });

    const res = await client.fetch('https://api.example.com/free');
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should intercept 402, sign authorization, and retry with payment-signature', async () => {
    const challengeHeader = createX402ChallengeHeader({
      version: 'x402-v1',
      network: 'stellar:testnet',
      asset: 'USDC_ADDR',
      price: '0.01',
      recipient: 'MERCHANT_ADDR',
      validUntil: Math.floor(Date.now() / 1000) + 300,
    });

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Payment Required' }), {
          status: 402,
          headers: { 'payment-required': challengeHeader },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'paid_content' }), {
          status: 200,
        })
      );

    const client = new StellarX402Client({
      payerAddress: 'GB_TEST_PAYER',
      signAuthorization: async (challenge) => {
        expect(challenge.price).toBe('0.01');
        return { authEntryXdr: 'MOCK_AUTH_XDR', nonce: 1 };
      },
      fetchImpl: mockFetch as any,
    });

    const res = await client.fetch('https://api.example.com/paid');
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw if price exceeds configured maxPricePerRequest guardrail', async () => {
    const challengeHeader = createX402ChallengeHeader({
      version: 'x402-v1',
      network: 'stellar:testnet',
      asset: 'USDC_ADDR',
      price: '1.00', // Exceeds $0.10 cap
      recipient: 'MERCHANT_ADDR',
      validUntil: Math.floor(Date.now() / 1000) + 300,
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Payment Required' }), {
        status: 402,
        headers: { 'payment-required': challengeHeader },
      })
    );

    const client = new StellarX402Client({
      payerAddress: 'GB_TEST_PAYER',
      maxPricePerRequest: '0.10',
      signAuthorization: async () => ({ authEntryXdr: 'MOCK_AUTH_XDR', nonce: 1 }),
      fetchImpl: mockFetch as any,
    });

    await expect(client.fetch('https://api.example.com/paid')).rejects.toThrow(/exceeds configured maximum/);
  });
});
