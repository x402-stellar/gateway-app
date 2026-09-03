import { describe, it, expect } from 'vitest';
import {
  FacilitatorService,
  FacilitatorConfig,
  SettlementRequest,
  X402ErrorCode,
  FacilitatorError,
  NonceSequencer,
} from '../src/index.js';
import { X402Challenge, PaymentSignature } from '@stellar-x402/core';

describe('FacilitatorService & Gasless Relayer', () => {
  const baseConfig: FacilitatorConfig = {
    network: 'stellar:testnet',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    sponsorSecretKey: 'SB7X...',
    settlementContractId: 'CATZACNU6KVGZXYF7J4O4NLINRKL5FWC2YAQPHTIQMSQPDAJSSOMRUNL',
    acceptedTokens: ['CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'],
  };

  const validChallenge: X402Challenge = {
    version: 'x402-v1',
    network: 'stellar:testnet',
    asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    price: '0.01',
    recipient: 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6',
    validUntil: Math.floor(Date.now() / 1000) + 300,
  };

  const validSignature: PaymentSignature = {
    version: 'x402-v1',
    network: 'stellar:testnet',
    authEntryXdr: 'AAAA...',
    payer: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
    nonce: 1,
    signedAt: Math.floor(Date.now() / 1000),
  };

  it('should verify and settle valid payment request synchronously', async () => {
    const service = new FacilitatorService(baseConfig);
    const request: SettlementRequest = {
      signature: validSignature,
      challenge: validChallenge,
    };

    const receipt = await service.processSettlement(request);

    expect(receipt.status).toBe('settled');
    expect(receipt.payer).toBe(validSignature.payer);
    expect(receipt.recipient).toBe(validChallenge.recipient);
    expect(receipt.transactionHash).toBeDefined();
    expect(receipt.receiptId).toContain('rcpt_GBTYXQON_1');

    const cached = await service.getReceipt(receipt.receiptId);
    expect(cached).toEqual(receipt);
  });

  it('should support optimistic acceptance mode', async () => {
    const service = new FacilitatorService({
      ...baseConfig,
      optimisticAcceptance: true,
    });

    const request: SettlementRequest = {
      signature: validSignature,
      challenge: validChallenge,
    };

    const receipt = await service.processSettlement(request);

    expect(receipt.status).toBe('optimistic_accepted');
    expect(receipt.receiptId).toBeDefined();
  });

  it('should reject request when network does not match config', async () => {
    const service = new FacilitatorService(baseConfig);
    const request: SettlementRequest = {
      signature: {
        ...validSignature,
        network: 'stellar:pubnet',
      },
      challenge: validChallenge,
    };

    await expect(service.processSettlement(request)).rejects.toThrow(
      /X402_NETWORK_MISMATCH/
    );
  });

  it('should reject unsupported tokens when whitelist is active', async () => {
    const service = new FacilitatorService(baseConfig);
    const request: SettlementRequest = {
      signature: validSignature,
      challenge: {
        ...validChallenge,
        asset: 'CUNSUPPORTED_TOKEN_ADDRESS',
      },
    };

    await expect(service.processSettlement(request)).rejects.toThrow(
      /X402_ASSET_UNSUPPORTED/
    );
  });

  it('should reject expired challenge authorizations', async () => {
    const service = new FacilitatorService(baseConfig);
    const request: SettlementRequest = {
      signature: validSignature,
      challenge: {
        ...validChallenge,
        validUntil: Math.floor(Date.now() / 1000) - 60, // 1 minute ago
      },
    };

    await expect(service.processSettlement(request)).rejects.toThrow(
      /X402_AUTH_EXPIRED/
    );
  });

  it('should sequence concurrent tasks sequentially in NonceSequencer', async () => {
    const sequencer = new NonceSequencer();
    const order: number[] = [];

    const task1 = sequencer.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 20));
      order.push(1);
      return 1;
    });

    const task2 = sequencer.enqueue(async () => {
      order.push(2);
      return 2;
    });

    await Promise.all([task1, task2]);
    expect(order).toEqual([1, 2]);
  });
});
