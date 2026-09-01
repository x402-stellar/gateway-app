import { X402Challenge, X402ChallengeSchema } from './types.js';

export function createX402ChallengeHeader(challenge: X402Challenge): string {
  const validated = X402ChallengeSchema.parse(challenge);
  const jsonStr = JSON.stringify(validated);
  return Buffer.from(jsonStr, 'utf-8').toString('base64');
}

export function parseX402ChallengeHeader(headerValue: string): X402Challenge {
  try {
    const rawJson = Buffer.from(headerValue, 'base64').toString('utf-8');
    const parsed = JSON.parse(rawJson);
    return X402ChallengeSchema.parse(parsed);
  } catch (err: any) {
    throw new Error(`Invalid x402 challenge header format: ${err.message}`);
  }
}
