import { describe, it, expect } from 'vitest';
import {
  generateChallenge,
  generateBoilerplate,
  getGasBenchmark,
  verifySignature,
} from '../src/commands.js';
import { createPaymentSignatureHeader } from '@stellar-x402/core';

describe('Developer CLI (@stellar-x402/cli)', () => {
  it('should generate valid challenge header and structure', () => {
    const result = generateChallenge({
      price: '0.02',
      asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      recipient: 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6',
      network: 'stellar:testnet',
    });

    expect(result.header).toBeDefined();
    expect(result.challenge.price).toBe('0.02');
    expect(result.challenge.network).toBe('stellar:testnet');
  });

  it('should generate boilerplate for all supported frameworks', () => {
    const expressCode = generateBoilerplate({
      framework: 'express',
      path: '/api/v1/weather',
      price: '0.01',
      asset: 'CDLZ...',
      recipient: 'GCAL...',
    });
    expect(expressCode).toContain('stellarX402Middleware');
    expect(expressCode).toContain('/api/v1/weather');

    const fastifyCode = generateBoilerplate({
      framework: 'fastify',
      path: '/api/v1/weather',
      price: '0.01',
      asset: 'CDLZ...',
      recipient: 'GCAL...',
    });
    expect(fastifyCode).toContain('stellarX402Plugin');

    const pythonCode = generateBoilerplate({
      framework: 'python',
      path: '/api/v1/weather',
      price: '0.01',
      asset: 'CDLZ...',
      recipient: 'GCAL...',
    });
    expect(pythonCode).toContain('X402Middleware');

    const goCode = generateBoilerplate({
      framework: 'go',
      path: '/api/v1/weather',
      price: '0.01',
      asset: 'CDLZ...',
      recipient: 'GCAL...',
    });
    expect(goCode).toContain('upstream_url:');
  });

  it('should verify payment signatures', () => {
    const sigHeader = createPaymentSignatureHeader({
      network: 'stellar:testnet',
      paymentType: 'soroban_sac',
      authEntryXdr: 'AAAA...',
      payer: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      nonce: 10,
    });

    const parsed = verifySignature(sigHeader);
    expect(parsed.payer).toBe('GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M');
    expect(parsed.nonce).toBe(10);
  });

  it('should return accurate gas benchmarks', () => {
    const quote = getGasBenchmark('settle_payment');
    expect(quote.cpu).toBe(514163);
    expect(quote.memoryBytes).toBe(156208);
  });
});
