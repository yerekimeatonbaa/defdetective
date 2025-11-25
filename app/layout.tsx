import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'Definition Detective',
  description: 'An endless word puzzle game with a twist.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5b7" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>
          <div className="relative flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
