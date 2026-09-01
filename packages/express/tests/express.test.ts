import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { stellarX402Middleware } from '../src/middleware.js';
import { createPaymentSignatureHeader } from '@stellar-x402/core';

describe('Express x402 Middleware', () => {
  const app = express();
  app.use(express.json());

  app.get(
    '/api/data',
    stellarX402Middleware({
      price: '0.05',
      asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      recipient: 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6',
      network: 'stellar:testnet',
    }),
    (req, res) => {
      res.json({ success: true, payload: 'secret_ai_data' });
    }
  );

  it('should return 402 with PAYMENT-REQUIRED header when unauthenticated', async () => {
    const res = await request(app).get('/api/data');
    expect(res.status).toBe(402);
    expect(res.headers['payment-required']).toBeDefined();
    expect(res.body.error).toBe('Payment Required');
    expect(res.body.challenge.price).toBe('0.05');
  });

  it('should pass through when a valid PAYMENT-SIGNATURE header is provided', async () => {
    const sigHeader = createPaymentSignatureHeader({
      network: 'stellar:testnet',
      authEntryXdr: 'AAAAAgAAAA...',
      payer: 'GB...',
      nonce: 1,
    });

    const res = await request(app)
      .get('/api/data')
      .set('payment-signature', sigHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payload).toBe('secret_ai_data');
  });

  it('should return 400 when network does not match policy', async () => {
    const sigHeader = createPaymentSignatureHeader({
      network: 'stellar:pubnet',
      authEntryXdr: 'AAAAAgAAAA...',
      payer: 'GB...',
      nonce: 1,
    });

    const res = await request(app)
      .get('/api/data')
      .set('payment-signature', sigHeader);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Network Mismatch');
  });
});
