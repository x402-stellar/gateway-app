import { describe, it, expect } from 'vitest';
import { createX402ChallengeHeader, parseX402ChallengeHeader } from '../src/challenge.js';
import { createPaymentSignatureHeader, parsePaymentSignatureHeader } from '../src/signature.js';
import { X402Challenge, PaymentSignature } from '../src/types.js';

describe('x402 Core Package', () => {
  it('should encode and decode an x402 challenge correctly', () => {
    const challenge: X402Challenge = {
      version: 'x402-v1',
      network: 'stellar:testnet',
      asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      price: '0.01',
      recipient: 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6',
      validUntil: Math.floor(Date.now() / 1000) + 300,
    };

    const header = createX402ChallengeHeader(challenge);
    expect(typeof header).toBe('string');

    const decoded = parseX402ChallengeHeader(header);
    expect(decoded).toEqual(challenge);
  });

  it('should encode and decode a payment signature correctly', () => {
    const sig: PaymentSignature = {
      network: 'stellar:testnet',
      authEntryXdr: 'AAAAAgAAAA...',
      payer: 'GB...',
      nonce: 1,
    };

    const header = createPaymentSignatureHeader(sig);
    const decoded = parsePaymentSignatureHeader(header);
    expect(decoded).toEqual(sig);
  });

  it('should reject invalid challenge payloads', () => {
    expect(() => parseX402ChallengeHeader('invalid-base64')).toThrow();
  });
});
