import { SettlementReceipt } from './types.js';

export interface SettlementCacheStore {
  get(receiptId: string): Promise<SettlementReceipt | null>;
  set(receiptId: string, receipt: SettlementReceipt, ttlSeconds?: number): Promise<void>;
  has(receiptId: string): Promise<boolean>;
}

export class InMemorySettlementCache implements SettlementCacheStore {
  private store = new Map<string, { receipt: SettlementReceipt; expiresAt: number }>();

  async get(receiptId: string): Promise<SettlementReceipt | null> {
    const entry = this.store.get(receiptId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(receiptId);
      return null;
    }
    return entry.receipt;
  }

  async set(receiptId: string, receipt: SettlementReceipt, ttlSeconds = 3600): Promise<void> {
    this.store.set(receiptId, {
      receipt,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async has(receiptId: string): Promise<boolean> {
    const receipt = await this.get(receiptId);
    return receipt !== null;
  }

  public clear(): void {
    this.store.clear();
  }
}
