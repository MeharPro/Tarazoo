'use client';
import { CartProvider } from 'components/cart/supabase-cart-context';
import { CartProvider as ShopifyCartProvider } from 'components/cart/cart-context';
import type { Cart } from 'lib/shopify/types';
import React from 'react';

export function Providers({ children, cartPromise }: { children: React.ReactNode; cartPromise: Promise<Cart | undefined> }) {
  return (
    <CartProvider>
      <ShopifyCartProvider cartPromise={cartPromise}>{children}</ShopifyCartProvider>
    </CartProvider>
  );
}
