import {
  parseX402ChallengeHeader,
  createPaymentSignatureHeader,
  PaymentSignature,
  X402Challenge,
} from '@stellar-x402/core';

export interface AgentPayerConfig {
  payerAddress: string;
  signAuthorization: (challenge: X402Challenge) => Promise<{ authEntryXdr: string; nonce: number }>;
  maxPricePerRequest?: string;
  fetchImpl?: typeof fetch;
}

export class StellarX402Client {
  private config: AgentPayerConfig;
  private fetchFn: typeof fetch;

  constructor(config: AgentPayerConfig) {
    this.config = config;
    this.fetchFn = config.fetchImpl || fetch;
  }

  /**
   * Executes a fetch request, automatically handling 402 challenges by signing a payment and retrying.
   */
  async fetch(url: string | URL, init?: RequestInit): Promise<Response> {
    const initialResponse = await this.fetchFn(url, init);

    if (initialResponse.status !== 402) {
      return initialResponse;
    }

    const challengeHeader = initialResponse.headers.get('payment-required');
    if (!challengeHeader) {
      throw new Error('Server returned 402 without a PAYMENT-REQUIRED header');
    }

    const challenge = parseX402ChallengeHeader(challengeHeader);

    // Budget guardrail check
    if (
      this.config.maxPricePerRequest &&
      parseFloat(challenge.price) > parseFloat(this.config.maxPricePerRequest)
    ) {
      throw new Error(
        `Price ${challenge.price} exceeds configured maximum of ${this.config.maxPricePerRequest}`
      );
    }

    // Sign payment authorization
    const { authEntryXdr, nonce } = await this.config.signAuthorization(challenge);

    const paymentSig: PaymentSignature = {
      network: challenge.network,
      paymentType: 'soroban_sac',
      authEntryXdr,
      payer: this.config.payerAddress,
      nonce,
    };

    const sigHeader = createPaymentSignatureHeader(paymentSig);

    const newHeaders = new Headers(init?.headers);
    newHeaders.set('payment-signature', sigHeader);

    // Retry request with signed authorization
    return this.fetchFn(url, {
      ...init,
      headers: newHeaders,
    });
  }
}
