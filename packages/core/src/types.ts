import { z } from 'zod';

export type StellarNetworkId = 'stellar:pubnet' | 'stellar:testnet' | 'stellar:futurenet';

export const X402ChallengeSchema = z.object({
  version: z.literal('x402-v1'),
  network: z.enum(['stellar:pubnet', 'stellar:testnet', 'stellar:futurenet']),
  asset: z.string().min(1, 'Asset contract address or code is required'),
  price: z.string().min(1, 'Price amount string is required'),
  recipient: z.string().min(1, 'Recipient Stellar address is required'),
  validUntil: z.number().int().positive(),
  nonce: z.string().optional(),
  facilitatorUrl: z.string().url().optional(),
});

export type X402Challenge = z.infer<typeof X402ChallengeSchema>;

export const PaymentSignatureSchema = z.object({
  network: z.enum(['stellar:pubnet', 'stellar:testnet', 'stellar:futurenet']),
  authEntryXdr: z.string().min(1, 'Soroban authorization entry XDR is required'),
  payer: z.string().min(1, 'Payer Stellar address is required'),
  nonce: z.number().int().nonnegative(),
});

export type PaymentSignature = z.infer<typeof PaymentSignatureSchema>;

export interface RoutePricingPolicy {
  path: string;
  price: string;
  asset: string;
  recipient: string;
  network?: StellarNetworkId;
}
