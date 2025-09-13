'use client';

import CameraScanner from 'components/camera-scanner';
import { useCart } from 'components/cart/cart-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ScannerButton() {
  const [isScanning, setIsScanning] = useState(false);
  const { addCartItem } = useCart();
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setIsScanning(true)}
        className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:text-white dark:hover:border-neutral-600 md:h-12 md:w-12"
        aria-label="Scan barcode"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9V7a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-10 0H5a2 2 0 01-2-2v-2m9-7h.01M12 12h.01M12 16h.01M16 12h.01M8 12h.01"
          />
        </svg>
      </button>

      {isScanning && (
        <CameraScanner
          onProductScanned={(shopifyProduct) => {
            // Use the first variant as default
            const defaultVariant = shopifyProduct.variants[0];
            if (defaultVariant) {
              addCartItem(defaultVariant, shopifyProduct);
            }
            
            // Show a toast or notification
            const message = document.createElement('div');
            message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
            message.textContent = `Added ${shopifyProduct.title} to cart`;
            document.body.appendChild(message);
            setTimeout(() => {
              message.remove();
            }, 3000);

            // Navigate to the product listing
            router.push(`/product/${shopifyProduct.handle}`);
          }}
          onClose={() => setIsScanning(false)}
        />
      )}
    </>
  );
}
