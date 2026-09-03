import { StreamingPaywallConfig, StreamSettlement, StreamMeterResult } from './types.js';

export class StreamSettler {
  constructor(private readonly config: StreamingPaywallConfig) {}

  public finalizeSettlement(
    streamId: string,
    payer: string,
    meterResult: StreamMeterResult
  ): StreamSettlement {
    const timestamp = Math.floor(Date.now() / 1000);
    const receiptId = `strm_rcpt_${payer.slice(0, 8)}_${streamId.slice(0, 8)}_${timestamp}`;

    return {
      streamId,
      payer,
      recipient: this.config.recipient,
      asset: this.config.asset,
      unitsCharged: meterResult.unitsStreamed,
      settledAmount: meterResult.totalCost,
      receiptId,
      timestamp,
    };
  }

  public createReceiptHeader(settlement: StreamSettlement): string {
    return Buffer.from(JSON.stringify(settlement), 'utf-8').toString('base64');
  }
}
