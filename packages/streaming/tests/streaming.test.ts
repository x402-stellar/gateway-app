import { describe, it, expect } from 'vitest';
import {
  StreamTokenMeter,
  StreamSettler,
  StreamingPaywallConfig,
} from '../src/index.js';

describe('Streaming Paywall & Token Meter (@stellar-x402/streaming)', () => {
  const baseConfig: StreamingPaywallConfig = {
    pricePerUnit: '0.0001', // 0.0001 USDC per token
    asset: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    recipient: 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6',
    network: 'stellar:testnet',
    pricingModel: 'per_token',
  };

  it('should track token units and compute accurate cost for SSE chunks', () => {
    const meter = new StreamTokenMeter(baseConfig);

    // Simulate OpenAI-compatible streaming chunks
    meter.recordChunk('data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n');
    meter.recordChunk('data: {"choices":[{"delta":{"content":"world! How "}}]}\n\n');
    meter.recordChunk('data: {"choices":[{"delta":{"content":"can I help you today?"}}]}\n\n');
    meter.recordChunk('data: [DONE]\n\n');

    const result = meter.getResult();

    expect(result.unitsStreamed).toBeGreaterThan(0);
    expect(result.rawBytes).toBeGreaterThan(0);
    expect(parseFloat(result.totalCost)).toBeGreaterThan(0);
    expect(result.totalCost).toMatch(/^\d+\.\d{6}$/);
  });

  it('should support per-chunk pricing model', () => {
    const chunkConfig: StreamingPaywallConfig = {
      ...baseConfig,
      pricingModel: 'per_chunk',
      pricePerUnit: '0.005', // 0.005 USDC per chunk
    };

    const meter = new StreamTokenMeter(chunkConfig);
    meter.recordChunk('chunk 1 payload');
    meter.recordChunk('chunk 2 payload');
    meter.recordChunk('chunk 3 payload');

    const result = meter.getResult();

    expect(result.unitsStreamed).toBe(3);
    expect(result.totalCost).toBe('0.015000');
  });

  it('should generate final settlement and encoded receipt header', () => {
    const settler = new StreamSettler(baseConfig);
    const meterResult = {
      unitsStreamed: 150,
      totalCost: '0.015000',
      rawBytes: 600,
      durationMs: 450,
    };

    const settlement = settler.finalizeSettlement(
      'stream_abc123',
      'GBTYXQONX2Q77E5W273FTHYAY2I3G2Z2BVR7XFF5S5KXZ3S6VR2U3K5M',
      meterResult
    );

    expect(settlement.streamId).toBe('stream_abc123');
    expect(settlement.unitsCharged).toBe(150);
    expect(settlement.settledAmount).toBe('0.015000');
    expect(settlement.receiptId).toContain('strm_rcpt_GBTYXQON');

    const header = settler.createReceiptHeader(settlement);
    expect(typeof header).toBe('string');

    const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
    expect(decoded.receiptId).toBe(settlement.receiptId);
  });
});
