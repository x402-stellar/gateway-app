import { PaymentSignature, PaymentSignatureSchema } from './types.js';

export function createPaymentSignatureHeader(signature: PaymentSignature): string {
  const validated = PaymentSignatureSchema.parse(signature);
  return Buffer.from(JSON.stringify(validated), 'utf-8').toString('base64');
}

export function parsePaymentSignatureHeader(headerValue: string): PaymentSignature {
  try {
    const rawJson = Buffer.from(headerValue, 'base64').toString('utf-8');
    const parsed = JSON.parse(rawJson);
    return PaymentSignatureSchema.parse(parsed);
  } catch (err: any) {
    throw new Error(`Invalid x402 payment signature header: ${err.message}`);
  }
}
