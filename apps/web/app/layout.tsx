import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Stellar x402 Merchant Gateway',
  description: 'Manage routes, inspect settlements, and configure revenue splits',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0a0b0d', color: '#f3f4f6' }}>
        {children}
      </body>
    </html>
  );
}
