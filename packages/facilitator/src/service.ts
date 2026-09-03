import {
  FacilitatorConfig,
  SettlementRequest,
  SettlementReceipt,
  X402ErrorCode,
  FacilitatorError,
} from './types.js';
import { NonceSequencer } from './queue.js';
import { InMemorySettlementCache, SettlementCacheStore } from './cache.js';

export class FacilitatorService {
  private sequencer: NonceSequencer;
  private cache: SettlementCacheStore;

  constructor(
    private readonly config: FacilitatorConfig,
    cache?: SettlementCacheStore
  ) {
    this.sequencer = new NonceSequencer();
    this.cache = cache || new InMemorySettlementCache();
  }

  public async processSettlement(request: SettlementRequest): Promise<SettlementReceipt> {
    const { signature, challenge } = request;

    // 1. Network validation
    if (signature.network !== challenge.network || signature.network !== this.config.network) {
      throw new FacilitatorError(
        X402ErrorCode.NETWORK_MISMATCH,
        `Expected network ${this.config.network}, received ${signature.network}`
      );
    }

    // 2. Token whitelist validation
    if (
      this.config.acceptedTokens &&
      this.config.acceptedTokens.length > 0 &&
      !this.config.acceptedTokens.includes(challenge.asset)
    ) {
      throw new FacilitatorError(
        X402ErrorCode.ASSET_UNSUPPORTED,
        `Asset ${challenge.asset} is not accepted by this gateway`
      );
    }

    // 3. Expiration verification
    const now = Math.floor(Date.now() / 1000);
    if (challenge.validUntil < now) {
      throw new FacilitatorError(
        X402ErrorCode.AUTH_EXPIRED,
        `Challenge expired at ${challenge.validUntil}, current time is ${now}`
      );
    }

    // 4. Generate deterministic receipt identifier
    const receiptId = `rcpt_${signature.payer.slice(0, 8)}_${signature.nonce}_${now}`;

    // 5. Check replay in cache
    const existing = await this.cache.get(receiptId);
    if (existing && existing.status === 'settled') {
      throw new FacilitatorError(
        X402ErrorCode.NONCE_STALE,
        `Payment with receipt ID ${receiptId} has already been settled`
      );
    }

    // 6. Optimistic acceptance mode
    if (this.config.optimisticAcceptance) {
      const optimisticReceipt: SettlementReceipt = {
        receiptId,
        status: 'optimistic_accepted',
        payer: signature.payer,
        recipient: challenge.recipient,
        asset: challenge.asset,
        amount: challenge.price,
        paymentType: signature.paymentType,
        nonce: signature.nonce,
        timestamp: now,
      };

      await this.cache.set(receiptId, optimisticReceipt);

      // Submit on-chain settlement asynchronously in queue
      this.sequencer.enqueue(async () => {
        await this.executeOnChainSettlement(request, receiptId);
      });

      return optimisticReceipt;
    }

    // 7. Synchronous settlement via sequencer
    return this.sequencer.enqueue(async () => {
      return this.executeOnChainSettlement(request, receiptId);
    });
  }

  private async executeOnChainSettlement(
    request: SettlementRequest,
    receiptId: string
  ): Promise<SettlementReceipt> {
    const { signature, challenge } = request;
    const now = Math.floor(Date.now() / 1000);

    try {
      // In production, the facilitator wraps signature.authEntryXdr or classic envelope into a transaction,
      // signs fee sponsor envelope using this.config.sponsorSecretKey, and posts to RPC/Horizon.
      const simulatedHash = `tx_${Buffer.from(signature.payer + (signature.nonce ?? 0) + now).toString('hex').slice(0, 32)}`;

      const receipt: SettlementReceipt = {
        receiptId,
        status: 'settled',
        payer: signature.payer,
        recipient: challenge.recipient,
        asset: challenge.asset,
        amount: challenge.price,
        paymentType: signature.paymentType,
        nonce: signature.nonce,
        transactionHash: simulatedHash,
        ledgerSequence: 105820,
        timestamp: now,
      };

      await this.cache.set(receiptId, receipt);
      return receipt;
    } catch (err: any) {
      const failedReceipt: SettlementReceipt = {
        receiptId,
        status: 'failed',
        payer: signature.payer,
        recipient: challenge.recipient,
        asset: challenge.asset,
        amount: challenge.price,
        paymentType: signature.paymentType,
        nonce: signature.nonce,
        timestamp: now,
        errorCode: X402ErrorCode.SUBMISSION_REVERTED,
        errorMessage: err.message || 'On-chain settlement failed',
      };

      await this.cache.set(receiptId, failedReceipt);
      throw new FacilitatorError(
        X402ErrorCode.SUBMISSION_REVERTED,
        `On-chain settlement failed: ${err.message}`
      );
    }
  }

  public async getReceipt(receiptId: string): Promise<SettlementReceipt | null> {
    return this.cache.get(receiptId);
  }
}
