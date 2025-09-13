'use client';

import CartButton from 'components/layout/navbar/cart-button';
import Link from 'next/link';
import ScannerButton from './scanner-button';

export function TarazooNavbar() {
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
          <Link
            href={`/merchant/${defaultMerchantId}`}
            className="text-neutral-600 hover:text-black transition-colors"
          >
            Merchant
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ScannerButton />
        <CartButton />
      </div>
    </nav>
  );
}
