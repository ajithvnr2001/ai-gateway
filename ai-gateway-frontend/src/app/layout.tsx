import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Gateway',
  description: 'AI Routing Gateway Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
