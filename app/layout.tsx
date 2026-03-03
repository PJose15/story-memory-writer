import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { StoryProvider } from '@/lib/store';
import { ToastProvider } from '@/components/toast';
import { ConfirmProvider } from '@/components/confirm-dialog';

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
  title: 'Story Memory Writer',
  description: 'A narrative copilot that remembers your entire story.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} dark`}>
      <body className="bg-zinc-950 text-zinc-100 font-sans antialiased min-h-screen flex flex-col md:flex-row" suppressHydrationWarning>
        <StoryProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-zinc-900/50 md:rounded-tl-3xl border-t md:border-t-0 md:border-l border-zinc-800 relative shadow-2xl">
                {children}
              </main>
            </ConfirmProvider>
          </ToastProvider>
        </StoryProvider>
      </body>
    </html>
  );
}
