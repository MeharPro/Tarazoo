"use client";

import CartButton from 'components/layout/navbar/cart-button';
import Link from 'next/link';
import ScannerButton from './scanner-button';
import { usePathname, useSearchParams } from 'next/navigation';

function ForecastStatus() {
  // Client-only visual; rendered as gray dot by default via noscript
  return (
    <span className="inline-flex items-center gap-1">
      <span>Forecasts</span>
      <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
    </span>
  );
}

export function TarazooNavbar() {
  const defaultMerchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const spMode = (searchParams?.get('mode') || '').toLowerCase();
  const suffixMode = pathname.endsWith('/client') ? 'client' : pathname.endsWith('/user') ? 'user' : '';
  const mode = (spMode === 'client' || spMode === 'user') ? spMode : (suffixMode || 'user');

  const withMode = (href: string) => {
    // Preserve existing query string
    const hasQuery = href.includes('?');
    const u = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    // If path already ends with the explicit suffix, leave it
    if (u.pathname.endsWith('/client') || u.pathname.endsWith('/user')) return href;
    // Prefer query param mode to avoid needing route files
    const urlStr = `${href}${hasQuery ? '&' : '?'}mode=${mode}`;
    return urlStr;
  };
  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6 border-b">
      <div className="flex items-center">
        <Link href="/" prefetch={true} className="mr-6 flex items-center">
          <div className="text-xl font-bold">Tarazoo</div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {mode === 'user' && (
            <Link href={withMode('/')} className="text-neutral-600 hover:text-black transition-colors">Shop</Link>
          )}
          {mode === 'client' && (
            <>
              <Link href={withMode('/dashboard')} className="text-neutral-600 hover:text-black transition-colors">Dashboard</Link>
              <Link href={withMode('/merchant/catalog')} className="text-neutral-600 hover:text-black transition-colors">Catalogue</Link>
              <Link href={withMode('/merchant/sales')} className="text-neutral-600 hover:text-black transition-colors">Sales</Link>
              <Link href={withMode('/merchant/inventory')} className="text-neutral-600 hover:text-black transition-colors">Inventory</Link>
              <Link href={withMode('/merchant/forecasts')} className="text-neutral-600 hover:text-black transition-colors flex items-center gap-1">
                <ForecastStatus />
              </Link>
              <Link href={withMode(`/merchant/${defaultMerchantId}`)} className="text-neutral-600 hover:text-black transition-colors">Merchant</Link>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ScannerButton />
        <CartButton />
      </div>
    </nav>
  );
}
