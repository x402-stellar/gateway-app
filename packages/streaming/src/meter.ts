import { StreamMeterResult, StreamingPaywallConfig } from './types.js';

export class StreamTokenMeter {
  private units = 0;
  private bytes = 0;
  private startTime = Date.now();

  constructor(private readonly config: StreamingPaywallConfig) {}

  public recordChunk(chunk: string | Buffer): void {
    const rawString = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
    this.bytes += Buffer.byteLength(rawString);

    if (this.config.pricingModel === 'per_chunk') {
      this.units += 1;
      return;
    }

    // OpenAI SSE format inspection: `data: {"choices":[{"delta":{"content":"..."}}]}\n\n`
    if (rawString.startsWith('data:')) {
      const lines = rawString.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:') && !line.includes('[DONE]')) {
          try {
            const jsonStr = line.replace(/^data:\s*/, '').trim();
            if (jsonStr) {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string') {
                // Heuristic: roughly 1 token per 4 chars, minimum 1 token per delta
                this.units += Math.max(1, Math.ceil(delta.length / 4));
                continue;
              }
            }
          } catch {
            // Fallback to text chunk estimation
          }
        }
      }
    }

    // Default heuristic for general text or non-OpenAI streams: 1 token per 4 characters
    if (this.units === 0 && rawString.length > 0) {
      this.units += Math.max(1, Math.ceil(rawString.length / 4));
    }
  }

  public getResult(): StreamMeterResult {
    const durationMs = Date.now() - this.startTime;

    // Fixed-point calculation: pricePerUnit * units
    const priceFloat = parseFloat(this.config.pricePerUnit);
    const totalCostNumber = this.units * priceFloat;
    const totalCost = totalCostNumber.toFixed(6);

    return {
      unitsStreamed: this.units,
      totalCost,
      rawBytes: this.bytes,
      durationMs,
    };
  }

  public get currentUnits(): number {
    return this.units;
  }
}
