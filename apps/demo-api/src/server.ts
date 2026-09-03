import express, { Express, Request, Response } from 'express';
import { stellarX402Middleware } from '@stellar-x402/express';
import { StreamTokenMeter, StreamSettler } from '@stellar-x402/streaming';

export const TESTNET_CONTRACT_ID = 'CATZACNU6KVGZXYF7J4O4NLINRKL5FWC2YAQPHTIQMSQPDAJSSOMRUNL';
export const TESTNET_USDC_ASSET = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
export const MERCHANT_RECIPIENT = 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      network: 'stellar:testnet',
      contractId: TESTNET_CONTRACT_ID,
    });
  });

  // 1. Standard per-request HTTP 402 paywall
  app.use(
    '/api/v1/weather',
    stellarX402Middleware({
      price: '0.01',
      asset: TESTNET_USDC_ASSET,
      recipient: MERCHANT_RECIPIENT,
      network: 'stellar:testnet',
    })
  );

  app.get('/api/v1/weather', (_req: Request, res: Response) => {
    res.json({
      temperature: 72,
      condition: 'Clear Sky',
      city: 'San Francisco',
      network: 'stellar:testnet',
    });
  });

  // 2. Streaming AI Token-Metered Endpoint
  const streamConfig = {
    pricePerUnit: '0.0001',
    asset: TESTNET_USDC_ASSET,
    recipient: MERCHANT_RECIPIENT,
    network: 'stellar:testnet' as const,
    pricingModel: 'per_token' as const,
  };

  app.get('/api/v1/stream', (req: Request, res: Response) => {
    const authHeader = req.headers['payment-signature'] as string | undefined;

    if (!authHeader) {
      res.status(402).json({
        error: 'Payment Required',
        message: 'Streaming endpoint requires an initial payment authorization',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const meter = new StreamTokenMeter(streamConfig);
    const settler = new StreamSettler(streamConfig);

    const tokens = ['Hello ', 'from ', 'the ', 'Stellar ', 'x402 ', 'streaming ', 'paywall!'];
    let index = 0;

    const interval = setInterval(() => {
      if (index < tokens.length) {
        const chunk = `data: {"choices":[{"delta":{"content":"${tokens[index]}"}}]}\n\n`;
        meter.recordChunk(chunk);
        res.write(chunk);
        index++;
      } else {
        clearInterval(interval);
        res.write('data: [DONE]\n\n');

        const meterResult = meter.getResult();
        const settlement = settler.finalizeSettlement('stream_live_01', 'GBTY...', meterResult);
        const receiptB64 = settler.createReceiptHeader(settlement);

        res.write(`event: settlement\ndata: ${JSON.stringify({ receipt: receiptB64, totalCost: settlement.settledAmount })}\n\n`);
        res.end();
      }
    }, 15);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const PORT = process.env.PORT || 4020;
  app.listen(PORT, () => {
    console.log(`x402 Reference API running on http://localhost:${PORT}`);
  });
}
