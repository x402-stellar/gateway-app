import React from 'react';

const routes = [
  { path: '/api/v1/forecast', asset: 'USDC', price: '0.005', requests24h: 1420, volume: '7.10 USDC' },
  { path: '/api/v1/market-depth', asset: 'USDC', price: '0.020', requests24h: 890, volume: '17.80 USDC' },
  { path: '/api/v1/embeddings', asset: 'XLM', price: '0.100', requests24h: 3100, volume: '310.00 XLM' },
];

export default function DashboardPage() {
  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '32px', borderBottom: '1px solid #262930', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>x402 Merchant Gateway</h1>
        <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
          Network: <span style={{ color: '#60a5fa' }}>Stellar Testnet</span> | Verifier Contract: <code style={{ background: '#1e222b', padding: '2px 6px', borderRadius: '4px' }}>CATZACNU6KVGZXYF7J4O4NLINRKL5FWC2YAQPHTIQMSQPDAJSSOMRUNL</code>
        </p>
      </header>

      {/* Metrics Row */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#13161c', border: '1px solid #262930', borderRadius: '8px', padding: '20px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>24h Total Revenue</span>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#34d399' }}>$24.90 USDC</div>
        </div>
        <div style={{ background: '#13161c', border: '1px solid #262930', borderRadius: '8px', padding: '20px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Total Calls Settled</span>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px' }}>5,410</div>
        </div>
        <div style={{ background: '#13161c', border: '1px solid #262930', borderRadius: '8px', padding: '20px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Settlement Fee</span>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#60a5fa' }}>0.25% (25 bps)</div>
        </div>
      </section>

      {/* Route Pricing Table */}
      <section style={{ background: '#13161c', border: '1px solid #262930', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0' }}>Active Paid Routes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #262930', color: '#9ca3af' }}>
              <th style={{ padding: '10px 0' }}>Route Path</th>
              <th>Asset</th>
              <th>Price Per Call</th>
              <th>24h Volume</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.path} style={{ borderBottom: '1px solid #1e222b' }}>
                <td style={{ padding: '14px 0', fontFamily: 'monospace', color: '#e5e7eb' }}>{r.path}</td>
                <td>{r.asset}</td>
                <td>{r.price} {r.asset}</td>
                <td>{r.volume}</td>
                <td>
                  <span style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
