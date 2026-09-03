import {
  createX402ChallengeHeader,
  parseX402ChallengeHeader,
  parsePaymentSignatureHeader,
  X402Challenge,
  PaymentSignature,
} from '@stellar-x402/core';

export interface CliInitOptions {
  framework: 'express' | 'fastify' | 'python' | 'go';
  path: string;
  price: string;
  asset: string;
  recipient: string;
  network?: 'stellar:pubnet' | 'stellar:testnet' | 'stellar:futurenet' | undefined;
}

export function generateChallenge(options: {
  price: string;
  asset: string;
  recipient: string;
  network?: 'stellar:pubnet' | 'stellar:testnet' | 'stellar:futurenet' | undefined;
  validitySeconds?: number | undefined;
}): { challenge: X402Challenge; header: string } {
  const challenge: X402Challenge = {
    version: 'x402-v1',
    network: options.network || 'stellar:testnet',
    asset: options.asset,
    price: options.price,
    recipient: options.recipient,
    validUntil: Math.floor(Date.now() / 1000) + (options.validitySeconds || 300),
  };

  return {
    challenge,
    header: createX402ChallengeHeader(challenge),
  };
}

export function verifySignature(signatureHeader: string): PaymentSignature {
  return parsePaymentSignatureHeader(signatureHeader);
}

export function generateBoilerplate(options: CliInitOptions): string {
  const network = options.network || 'stellar:testnet';

  switch (options.framework) {
    case 'express':
      return `import express from 'express';
import { stellarX402Middleware } from '@stellar-x402/express';

const app = express();

app.use(
  '${options.path}',
  stellarX402Middleware({
    price: '${options.price}',
    asset: '${options.asset}',
    recipient: '${options.recipient}',
    network: '${network}',
  })
);

app.get('${options.path}', (req, res) => {
  res.json({ message: 'Access granted via x402 payment' });
});

app.listen(3000);`;

    case 'fastify':
      return `import Fastify from 'fastify';
import { stellarX402Plugin } from '@stellar-x402/fastify';

const fastify = Fastify();

await fastify.register(stellarX402Plugin, {
  routes: [
    {
      path: '${options.path}',
      price: '${options.price}',
      asset: '${options.asset}',
      recipient: '${options.recipient}',
      network: '${network}',
    },
  ],
});

fastify.get('${options.path}', async (req, reply) => {
  return { message: 'Access granted via x402 payment' };
});

await fastify.listen({ port: 3000 });`;

    case 'python':
      return `from fastapi import FastAPI
from x402 import X402Middleware, RoutePricingPolicy

app = FastAPI()

app.add_middleware(
    X402Middleware,
    policy=RoutePricingPolicy(
        path='${options.path}',
        price='${options.price}',
        asset='${options.asset}',
        recipient='${options.recipient}',
        network='${network}',
    )
)

@app.get('${options.path}')
async def protected_route():
    return {'message': 'Access granted via x402 payment'}`;

    case 'go':
      return `# proxy/config.yaml
port: 8080
upstream_url: "http://localhost:3000"
network: "${network}"
verifier_contract_id: "CATZACNU6KVGZXYF7J4O4NLINRKL5FWC2YAQPHTIQMSQPDAJSSOMRUNL"
routes:
  - path: "${options.path}"
    price: "${options.price}"
    asset: "${options.asset}"
    recipient: "${options.recipient}"`;
  }
}

export function getGasBenchmark(operation: string): {
  cpu: number;
  memoryBytes: number;
  estFeeXlm: string;
} {
  switch (operation) {
    case 'get_nonce':
      return { cpu: 24952, memoryBytes: 10181, estFeeXlm: '<0.00001 XLM' };
    case 'settle_payment':
      return { cpu: 514163, memoryBytes: 156208, estFeeXlm: '~0.00001 XLM' };
    case 'verify_and_split':
      return { cpu: 519514, memoryBytes: 156103, estFeeXlm: '~0.00001 XLM' };
    default:
      return { cpu: 514163, memoryBytes: 156208, estFeeXlm: '~0.00001 XLM' };
  }
}
