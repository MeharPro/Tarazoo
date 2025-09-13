'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useProduct } from 'components/product/product-context';
import type { Product as ShopifyProduct, ProductVariant } from 'lib/shopify/types';
import { getProductByName } from 'lib/supabase';
import { useSupabaseCart } from './supabase-cart-context';

function SubmitButton({
  availableForSale,
  selectedVariantId
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
}) {
  const buttonClasses =
    'relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white';
  const disabledClasses = 'cursor-not-allowed opacity-60 hover:opacity-60';

  if (!availableForSale) {
    return (
      <button disabled className={clsx(buttonClasses, disabledClasses)}>
        Out Of Stock
      </button>
    );
  }

  if (!selectedVariantId) {
    return (
      <button
        aria-label="Please select an option"
        disabled
        className={clsx(buttonClasses, disabledClasses)}
      >
        <div className="absolute left-0 ml-4">
          <PlusIcon className="h-5" />
        </div>
        Add To Cart
      </button>
    );
  }

  return (
    <button
      aria-label="Add to cart"
      className={clsx(buttonClasses, {
        'hover:opacity-90': true
      })}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add To Cart
    </button>
  );
}

export function AddToCart({ product }: { product: ShopifyProduct }) {
  const { variants, availableForSale } = product;
  const { addItem } = useSupabaseCart();
  const { state } = useProduct();

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === state[option.name.toLowerCase()]
    )
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
    const finalVariant = variants.find(
    (variant) => variant.id === selectedVariantId
  )!;

  // Prefer the selected variant's availability if present; otherwise use product availability
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const isAvailableForSale = selectedVariant?.availableForSale ?? availableForSale;

  const handleAdd = async () => {
    if (!selectedVariantId) return;
    const name = finalVariant.title === 'Default Title' ? product.title : `${product.title} - ${finalVariant.title}`;
    let supaProduct = await getProductByName(name.toLowerCase());
    if (!supaProduct) {
      // Attempt to sync this product from Shopify into Supabase, then retry
      try {
        await fetch(`/api/sync-products?handle=${encodeURIComponent(product.handle)}`, { method: 'POST' });
        supaProduct = await getProductByName(name.toLowerCase());
      } catch {}
    }
    if (supaProduct) {
      addItem(supaProduct);
      // Optional toast
      const msg = document.createElement('div');
      msg.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      msg.textContent = `Added ${supaProduct.name} to cart`;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2000);
    } else {
      const err = document.createElement('div');
      err.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      err.textContent = 'Product not available in Supabase catalog.';
      document.body.appendChild(err);
      setTimeout(() => err.remove(), 2500);
    }
  };

  return (
    <button onClick={handleAdd} aria-label="Add to cart"
      className={clsx('relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white', {
        'cursor-not-allowed opacity-60': !isAvailableForSale || !selectedVariantId,
        'hover:opacity-90': isAvailableForSale && !!selectedVariantId
      })} disabled={!isAvailableForSale || !selectedVariantId}
    >
      <div className="absolute left-0 ml-4">
        <PlusIcon className="h-5" />
      </div>
      Add To Cart
    </button>
  );
}
