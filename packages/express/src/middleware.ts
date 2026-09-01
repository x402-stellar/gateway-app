import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  createX402ChallengeHeader,
  parsePaymentSignatureHeader,
  RoutePricingPolicy,
  X402Challenge,
} from '@stellar-x402/core';

export interface ExpressX402Options extends RoutePricingPolicy {
  validitySeconds?: number;
  facilitatorUrl?: string;
}

export function stellarX402Middleware(options: ExpressX402Options): RequestHandler {
  const {
    price,
    asset,
    recipient,
    network = 'stellar:testnet',
    validitySeconds = 300,
    facilitatorUrl,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      res.setHeader('PAYMENT-REQUIRED', challengeB64);
      res.setHeader('WWW-Authenticate', `x402 challenge="${challengeB64}"`);
      res.status(402).json({
        error: 'Payment Required',
        message: 'This endpoint requires an x402 payment settled on Stellar',
        challenge,
      });
      return;
    }

    try {
      const signature = parsePaymentSignatureHeader(authHeader);
      if (signature.network !== network) {
        res.status(400).json({
          error: 'Network Mismatch',
          message: `Expected payment on ${network}, received ${signature.network}`,
        });
        return;
      }

      // Attach verified payment context to request
      (req as any).x402Payment = signature;
      next();
    } catch (err: any) {
      res.status(400).json({
        error: 'Invalid Payment Signature',
        message: err.message,
      });
      return;
    }
  };
}
