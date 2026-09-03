#!/usr/bin/env node
import {
  generateChallenge,
  verifySignature,
  generateBoilerplate,
  getGasBenchmark,
  CliInitOptions,
} from './commands.js';

function printHelp(): void {
  console.log(`
x402-cli - Developer Tooling for Stellar x402 Gateway

Usage:
  x402 <command> [options]

Commands:
  init          Generate starter paywall boilerplate for Express, Fastify, Python, or Go
  challenge     Generate an encoded HTTP 402 challenge header
  verify        Parse and inspect a base64 payment signature
  quote         Display gas and resource benchmarks for contract operations
  help          Show this help message

Options:
  --framework   express | fastify | python | go (default: express)
  --path        Endpoint path to protect (e.g. /api/v1/data)
  --price       Amount required per request (e.g. 0.01)
  --asset       Stellar token contract or asset identifier
  --recipient   Merchant Stellar public key (G...)
  --network     stellar:pubnet | stellar:testnet (default: stellar:testnet)
  --sig         Base64 payment-signature string to verify
  --op          Contract operation (get_nonce | settle_payment | verify_and_split)
`);
}

function parseArgs(args: string[]): { command: string; flags: Record<string, string> } {
  const command = args[0] || 'help';
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg && arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextVal = args[i + 1];
      if (nextVal && !nextVal.startsWith('--')) {
        flags[key] = nextVal;
        i++;
      } else {
        flags[key] = 'true';
      }
    }
  }

  return { command, flags };
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'init': {
      const framework = (flags['framework'] || 'express') as CliInitOptions['framework'];
      const path = flags['path'] || '/api/v1/resource';
      const price = flags['price'] || '0.01';
      const asset = flags['asset'] || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
      const recipient = flags['recipient'] || 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6';
      const network = (flags['network'] || 'stellar:testnet') as CliInitOptions['network'];

      const code = generateBoilerplate({ framework, path, price, asset, recipient, network });
      console.log(`\n// Generated ${framework} middleware boilerplate:\n`);
      console.log(code);
      break;
    }

    case 'challenge': {
      const price = flags['price'] || '0.01';
      const asset = flags['asset'] || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
      const recipient = flags['recipient'] || 'GCALKSGAZRJLSUEJT3M5W6LN4R7XQOLIRCOS6ZA6EDZVTZDBIIPPFKJ6';
      const network = (flags['network'] || 'stellar:testnet') as any;

      const result = generateChallenge({ price, asset, recipient, network });
      console.log('\n--- x402 Challenge Generated ---');
      console.log('PAYMENT-REQUIRED header:');
      console.log(result.header);
      console.log('\nParsed Payload:');
      console.log(JSON.stringify(result.challenge, null, 2));
      break;
    }

    case 'verify': {
      const sig = flags['sig'];
      if (!sig) {
        console.error('Error: --sig <base64> argument is required for verify');
        process.exit(1);
      }
      try {
        const parsed = verifySignature(sig);
        console.log('\n--- Payment Signature Verified ---');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e: any) {
        console.error('Failed to verify signature:', e.message);
        process.exit(1);
      }
      break;
    }

    case 'quote': {
      const op = flags['op'] || 'settle_payment';
      const quote = getGasBenchmark(op);
      console.log(`\n--- Gas Benchmark: ${op} ---`);
      console.log(`CPU Instructions: ${quote.cpu.toLocaleString()}`);
      console.log(`Memory Usage:     ${quote.memoryBytes.toLocaleString()} bytes`);
      console.log(`Est. Gas Fee:     ${quote.estFeeXlm}`);
      break;
    }

    case 'help':
    default:
      printHelp();
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
