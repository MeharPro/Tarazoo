'use client';

import Link from 'next/link';
import { useSupabaseCart } from 'components/cart/supabase-cart-context';

export default function CartButton() {
  const { itemCount } = useSupabaseCart();

  return (
    <Link
      href="/cart"
      className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:text-white dark:hover:border-neutral-600 md:h-12 md:w-12"
      aria-label="Shopping cart"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
