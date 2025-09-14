"use client";

import CartButton from 'components/layout/navbar/cart-button';
import Link from 'next/link';
import ScannerButton from './scanner-button';
import { useEffect, useState } from 'react';

export function TarazooNavbar() {
  const defaultMerchantId = process.env.NEXT_PUBLIC_MERCHANT_ID_DEFAULT || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const [forecastAvailable, setForecastAvailable] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/forecast/health', { cache: 'no-store' });
        const j = await res.json();
        if (!alive) return;
        setForecastAvailable(Boolean(j.ok));
      } catch {
        if (!alive) return;
        setForecastAvailable(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6 border-b">
      <div className="flex items-center">
        <Link href="/" prefetch={true} className="mr-6 flex items-center">
          <div className="text-xl font-bold">Tarazoo</div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-neutral-600 hover:text-black transition-colors">Shop</Link>
          <Link href="/dashboard" className="text-neutral-600 hover:text-black transition-colors">Dashboard</Link><Link href="/merchent/catalog" className="text-neutral-600 hover:text-black transition-colors">Catalogue</Link>
          <Link href="/sales" className="text-neutral-600 hover:text-black transition-colors">Sales</Link>
          <Link href="/merchent/inventory" className="text-neutral-600 hover:text-black transition-colors">Inventory</Link>
          <Link href="/merchent/forecasts" className="text-neutral-600 hover:text-black transition-colors flex items-center gap-1">
            <span>Forecasts</span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${forecastAvailable ? 'bg-green-500' : 'bg-gray-400'}`}
              title={forecastAvailable ? 'Forecasts available' : 'Using fallback'}
            />
          </Link>
          <Link href={`/merchant/${defaultMerchantId}`} className="text-neutral-600 hover:text-black transition-colors">Merchant</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ScannerButton />
        <CartButton />
      </div>
    </nav>
  );
}
