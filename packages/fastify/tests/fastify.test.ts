import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { fastifyX402 } from '../src/plugin.js';
import { createPaymentSignatureHeader, PaymentSignature } from '@stellar-x402/core';

describe('Fastify x402 Plugin', () => {
  const pluginOptions = {
    price: '0.01',
    asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    recipient: 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6',
    network: 'stellar:testnet' as const,
    paths: ['/api/v1/protected'],
  };

  it('should return 402 with PAYMENT-REQUIRED header when payment is missing', async () => {
    const fastify = Fastify();
    await fastify.register(fastifyX402, pluginOptions);

    fastify.get('/api/v1/protected', async () => ({ status: 'success' }));

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/v1/protected',
    });

    expect(res.statusCode).toBe(402);
    expect(res.headers['payment-required']).toBeDefined();
    expect(res.headers['www-authenticate']).toContain('x402 challenge=');
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Payment Required');
    expect(body.challenge.price).toBe('0.01');
  });

  it('should allow requests with valid Payment-Signature header', async () => {
    const fastify = Fastify();
    await fastify.register(fastifyX402, pluginOptions);

    fastify.get('/api/v1/protected', async (req) => ({
      status: 'success',
      payer: req.x402Payment?.payer,
    }));

    const validPayload: PaymentSignature = {
      version: 'x402-v1',
      network: 'stellar:testnet',
      authEntryXdr: 'AAAA...',
      payer: 'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      nonce: 1,
      signedAt: Math.floor(Date.now() / 1000),
    };

    const headerVal = createPaymentSignatureHeader(validPayload);

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/v1/protected',
      headers: {
        'payment-signature': headerVal,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('success');
    expect(body.payer).toBe('GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M');
  });

  it('should bypass unprotected routes when paths filter is configured', async () => {
    const fastify = Fastify();
    await fastify.register(fastifyX402, pluginOptions);

    fastify.get('/api/v1/public', async () => ({ public: true }));

    const res = await fastify.inject({
      method: 'GET',
      url: '/api/v1/public',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.public).toBe(true);
  });
});
