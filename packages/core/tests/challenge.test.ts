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
      acceptedPaymentTypes: ['soroban_sac', 'stellar_classic'],
    };

    const header = createX402ChallengeHeader(challenge);
    expect(typeof header).toBe('string');

    const decoded = parseX402ChallengeHeader(header);
    expect(decoded).toEqual(challenge);
  });

  it('should encode and decode a Soroban SAC payment signature', () => {
    const sig: PaymentSignature = {
      network: 'stellar:testnet',
      paymentType: 'soroban_sac',
      authEntryXdr: 'AAAAAgAAAA...',
      payer: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      nonce: 1,
    };

    const header = createPaymentSignatureHeader(sig);
    const decoded = parsePaymentSignatureHeader(header);
    expect(decoded).toEqual(sig);
  });

  it('should encode and decode a Stellar Classic transaction payment signature', () => {
    const sig: PaymentSignature = {
      network: 'stellar:testnet',
      paymentType: 'stellar_classic',
      transactionEnvelopeXdr: 'AAAAAgAAAAC...',
      payer: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      memo: 'invoice_9824',
      amount: '1.50',
    };

    const header = createPaymentSignatureHeader(sig);
    const decoded = parsePaymentSignatureHeader(header);
    expect(decoded).toEqual(sig);
  });

  it('should encode and decode a Channel Voucher payment signature', () => {
    const sig: PaymentSignature = {
      network: 'stellar:testnet',
      paymentType: 'channel_voucher',
      channelId: 'chn_98a72b1',
      voucherIndex: 42,
      cumulativeAmount: '0.042',
      payer: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      voucherSignature: 'sig_ed25519_...',
    };

    const header = createPaymentSignatureHeader(sig);
    const decoded = parsePaymentSignatureHeader(header);
    expect(decoded).toEqual(sig);
  });

  it('should reject payment signatures with missing required fields for paymentType', () => {
    // Missing authEntryXdr for soroban_sac
    const invalidSoroban: any = {
      network: 'stellar:testnet',
      paymentType: 'soroban_sac',
      payer: 'GB...',
      nonce: 1,
    };
    expect(() => createPaymentSignatureHeader(invalidSoroban)).toThrow();

    // Missing transactionEnvelopeXdr for stellar_classic
    const invalidClassic: any = {
      network: 'stellar:testnet',
      paymentType: 'stellar_classic',
      payer: 'GB...',
    };
    expect(() => createPaymentSignatureHeader(invalidClassic)).toThrow();
  });

  it('should reject invalid challenge payloads', () => {
    expect(() => parseX402ChallengeHeader('invalid-base64')).toThrow();
  });
});
