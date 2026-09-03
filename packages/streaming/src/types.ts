import { StellarNetworkId } from '@stellar-x402/core';

export type StreamPricingModel = 'per_token' | 'per_chunk' | 'per_second';

export interface StreamingPaywallConfig {
  pricePerUnit: string;
  asset: string;
  recipient: string;
  network?: StellarNetworkId | undefined;
  pricingModel?: StreamPricingModel | undefined;
  maxAllowedUnits?: number | undefined;
  heartbeatIntervalMs?: number | undefined;
}

export interface StreamMeterResult {
  unitsStreamed: number;
  totalCost: string;
  rawBytes: number;
  durationMs: number;
}

export interface StreamSettlement {
  streamId: string;
  payer: string;
  recipient: string;
  asset: string;
  unitsCharged: number;
  settledAmount: string;
  receiptId?: string | undefined;
  timestamp: number;
}
