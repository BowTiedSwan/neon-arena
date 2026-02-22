import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Neon Arena - Multiplayer Games',
  description: 'Play retro racing and neon tennis with friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scanlines">{children}</body>
    </html>
  );
}