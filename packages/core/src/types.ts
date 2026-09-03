import { z } from 'zod';

export type StellarNetworkId = 'stellar:pubnet' | 'stellar:testnet' | 'stellar:futurenet';

export type StellarPaymentType = 'soroban_sac' | 'stellar_classic' | 'channel_voucher';

export const X402ChallengeSchema = z.object({
  version: z.literal('x402-v1'),
  network: z.enum(['stellar:pubnet', 'stellar:testnet', 'stellar:futurenet']),
  asset: z.string().min(1, 'Asset contract address or code is required'),
  price: z.string().min(1, 'Price amount string is required'),
  recipient: z.string().min(1, 'Recipient Stellar address is required'),
  validUntil: z.number().int().positive(),
  nonce: z.string().optional(),
  facilitatorUrl: z.string().url().optional(),
  acceptedPaymentTypes: z
    .array(z.enum(['soroban_sac', 'stellar_classic', 'channel_voucher']))
    .default(['soroban_sac'])
    .optional(),
});

export type X402Challenge = z.infer<typeof X402ChallengeSchema>;

export const PaymentSignatureSchema = z
  .object({
    network: z.enum(['stellar:pubnet', 'stellar:testnet', 'stellar:futurenet']),
    payer: z.string().min(1, 'Payer Stellar address is required'),
    paymentType: z
      .enum(['soroban_sac', 'stellar_classic', 'channel_voucher'])
      .default('soroban_sac'),
    // Soroban SAC fields
    authEntryXdr: z.string().optional(),
    nonce: z.number().int().nonnegative().optional(),
    // Stellar Classic payment fields
    transactionEnvelopeXdr: z.string().optional(),
    memo: z.string().optional(),
    amount: z.string().optional(),
    // Channel voucher fields
    channelId: z.string().optional(),
    voucherIndex: z.number().int().nonnegative().optional(),
    cumulativeAmount: z.string().optional(),
    voucherSignature: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentType === 'soroban_sac') {
        return !!data.authEntryXdr && data.nonce !== undefined;
      }
      if (data.paymentType === 'stellar_classic') {
        return !!data.transactionEnvelopeXdr;
      }
      if (data.paymentType === 'channel_voucher') {
        return (
          !!data.channelId &&
          data.voucherIndex !== undefined &&
          !!data.voucherSignature
        );
      }
      return true;
    },
    {
      message: 'Payment fields must match the specified paymentType',
    }
  );

export type PaymentSignature = z.infer<typeof PaymentSignatureSchema>;

export interface RoutePricingPolicy {
  path?: string | undefined;
  price: string;
  asset: string;
  recipient: string;
  network?: StellarNetworkId | undefined;
  acceptedPaymentTypes?: StellarPaymentType[] | undefined;
}
