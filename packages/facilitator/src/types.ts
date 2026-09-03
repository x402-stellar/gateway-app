import { z } from 'zod';
import { PaymentSignature, X402Challenge } from '@stellar-x402/core';

export enum X402ErrorCode {
  AUTH_MISSING = 'X402_AUTH_MISSING',
  AUTH_INVALID_FORMAT = 'X402_AUTH_INVALID_FORMAT',
  AUTH_EXPIRED = 'X402_AUTH_EXPIRED',
  NONCE_STALE = 'X402_NONCE_STALE',
  NETWORK_MISMATCH = 'X402_NETWORK_MISMATCH',
  ASSET_UNSUPPORTED = 'X402_ASSET_UNSUPPORTED',
  AMOUNT_INSUFFICIENT = 'X402_AMOUNT_INSUFFICIENT',
  SPONSOR_BALANCE_LOW = 'X402_SPONSOR_BALANCE_LOW',
  RPC_SIMULATION_FAILED = 'X402_RPC_SIMULATION_FAILED',
  SUBMISSION_REVERTED = 'X402_SUBMISSION_REVERTED',
  RATE_LIMITED = 'X402_RATE_LIMITED',
  ESCROW_LOCKED = 'X402_ESCROW_LOCKED',
  CHANNEL_EXHAUSTED = 'X402_CHANNEL_EXHAUSTED',
  INTERNAL_RELAYER_ERROR = 'X402_INTERNAL_RELAYER_ERROR',
}

export interface FacilitatorConfig {
  network: 'stellar:pubnet' | 'stellar:testnet' | 'stellar:futurenet';
  sorobanRpcUrl: string;
  horizonUrl: string;
  sponsorSecretKey: string;
  settlementContractId: string;
  acceptedTokens?: string[];
  maxGasFeeStroops?: number;
  optimisticAcceptance?: boolean;
}

export interface SettlementRequest {
  signature: PaymentSignature;
  challenge: X402Challenge;
  clientIp?: string;
  metadata?: Record<string, any>;
}

export type SettlementStatus = 'pending' | 'settled' | 'failed' | 'optimistic_accepted';

export interface SettlementReceipt {
  receiptId: string;
  status: SettlementStatus;
  payer: string;
  recipient: string;
  asset: string;
  amount: string;
  nonce: number;
  transactionHash?: string;
  ledgerSequence?: number;
  timestamp: number;
  errorCode?: X402ErrorCode;
  errorMessage?: string;
}

export class FacilitatorError extends Error {
  constructor(
    public readonly code: X402ErrorCode,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'FacilitatorError';
  }
}
