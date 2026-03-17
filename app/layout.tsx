import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/app-shell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Zagafy',
  description: 'Your antiquarian narrative workshop.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable}`}>
      <head>
        <link rel="preload" href="/textures/wood-grain.svg" as="image" type="image/svg+xml" />
      </head>
      <body className="bg-mahogany-950 text-cream-100 font-sans antialiased min-h-screen flex flex-col md:flex-row" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-4 focus:left-4 focus:bg-forest-700 focus:text-cream-50 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
