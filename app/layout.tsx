import { Providers } from 'components/providers';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { TarazooNavbar } from 'components/layout/navbar/tarazoo-navbar';
import { WelcomeToast } from 'components/welcome-toast';
import { GeistSans } from 'geist/font/sans';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import './globals.css';
import { baseUrl } from 'lib/utils';
import { getCart } from 'lib/shopify';

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Tarazoo - Unified Commerce Platform',
    template: `%s | Tarazoo`
  },
  robots: {
    follow: true,
    index: true
  }
};

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  // Provide Shopify cart context for components relying on useCart
  const shopifyCartPromise = getCart();
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
        <UserProvider>
          <Providers cartPromise={shopifyCartPromise}>
            <TarazooNavbar />
            <main>
              {children}
              <Toaster closeButton />
              <WelcomeToast />
            </main>
          </Providers>
        </UserProvider>
      </body>
    </html>
  );
}
