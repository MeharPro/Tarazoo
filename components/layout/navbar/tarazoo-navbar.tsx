'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import ScannerButton from './scanner-button';
import CartButton from 'components/layout/navbar/cart-button';
import { useUser } from '@auth0/nextjs-auth0/client';

export function TarazooNavbar() {
  const { user, isLoading } = useUser();
  const defaultMerchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6 border-b">
      <div className="flex items-center">
        <Link
          href="/"
          prefetch={true}
          className="mr-6 flex items-center"
        >
          <div className="text-xl font-bold">Tarazoo</div>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-neutral-600 hover:text-black transition-colors"
          >
            Shop
          </Link>
          {/* Show merchant link only if authenticated */}
          {!isLoading && user && (
            <Link
              href={`/merchant/${defaultMerchantId}`}
              className="text-neutral-600 hover:text-black transition-colors"
            >
              Merchant
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ScannerButton />
        <CartButton />
        {/* Merchant auth controls */}
        {!isLoading && !user && (
          <Link
            href={`/api/auth/login?returnTo=/dashboard&connection=google-oauth2`}
            className="hidden md:inline-block text-sm text-neutral-600 hover:text-black"
          >
            Merchant Sign in
          </Link>
        )}
        {!isLoading && user && (
          <Link
            href="/api/auth/logout?returnTo=/"
            className="hidden md:inline-block text-sm text-neutral-600 hover:text-black"
          >
            Sign out
          </Link>
        )}
      </div>
    </nav>
  );
}
