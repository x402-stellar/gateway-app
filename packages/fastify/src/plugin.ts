import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import {
  createX402ChallengeHeader,
  parsePaymentSignatureHeader,
  RoutePricingPolicy,
  X402Challenge,
  PaymentSignature,
} from '@stellar-x402/core';

declare module 'fastify' {
  interface FastifyRequest {
    x402Payment?: PaymentSignature;
  }
}

export interface FastifyX402Options extends RoutePricingPolicy {
  validitySeconds?: number;
  facilitatorUrl?: string;
  paths?: string[];
}

const fastifyX402PluginAsync: FastifyPluginAsync<FastifyX402Options> = async (
  fastify: FastifyInstance,
  options: FastifyX402Options
) => {
  const {
    price,
    asset,
    recipient,
    network = 'stellar:testnet',
    validitySeconds = 300,
    facilitatorUrl,
    paths,
  } = options;

  fastify.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    // If specific paths are supplied, skip untargeted routes
    if (paths && !paths.some((p) => req.url.startsWith(p))) {
      return;
    }

    const authHeader = req.headers['payment-signature'] as string | undefined;

    if (!authHeader) {
      const challenge: X402Challenge = {
        version: 'x402-v1',
        network,
        asset,
        price,
        recipient,
        validUntil: Math.floor(Date.now() / 1000) + validitySeconds,
        facilitatorUrl,
      };

      const challengeB64 = createX402ChallengeHeader(challenge);
      reply
        .status(402)
        .header('PAYMENT-REQUIRED', challengeB64)
        .header('WWW-Authenticate', `x402 challenge="${challengeB64}"`)
        .send({
          error: 'Payment Required',
          message: 'This endpoint requires an x402 payment settled on Stellar',
          challenge,
        });
      return reply;
    }

    try {
      const signature = parsePaymentSignatureHeader(authHeader);
      if (signature.network !== network) {
        reply.status(400).send({
          error: 'Network Mismatch',
          message: `Expected payment on ${network}, received ${signature.network}`,
        });
        return reply;
      }

      req.x402Payment = signature;
    } catch (err: any) {
      reply.status(400).send({
        error: 'Invalid Payment Signature',
        message: err.message,
      });
      return reply;
    }
  });
};

export const fastifyX402 = fp(fastifyX402PluginAsync, {
  fastify: '>=4.0.0',
  name: '@stellar-x402/fastify',
});
