'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseCart } from 'components/cart/supabase-cart-context';
import { createOrder } from 'lib/supabase';
import { formatPrice } from 'lib/utils';

const MERCHANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Demo merchant

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, tax, total, clearCart } = useSupabaseCart();
  const DISCOUNT_LABEL = 'Hack The North Discount';
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedCode = discountCode.trim().toUpperCase();
  const discountCents = discountApplied && normalizedCode === 'HTNDEV' ? total : 0;
  const finalTotal = Math.max(0, total - discountCents);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Show a brief loading screen to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare order items
      const orderItems = items.map(item => ({
        sku: item.product.sku,
        qty: item.quantity,
        price_cents: item.product.price_cents
      }));

      // Create order in Supabase
      // Important: send totals BEFORE discount to Supabase (track discount separately)
      const order = await createOrder(
        MERCHANT_ID,
        orderItems,
        subtotal,
        tax,
        total,
        discountCents > 0 ? DISCOUNT_LABEL : undefined,
        discountCents > 0 ? discountCents : undefined
      );

      if (order) {
        // Clear the cart
        clearCart();
        
        // Redirect to success page
        router.push(`/checkout/success?orderId=${order.order_id}`);
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
      {isProcessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white px-8 py-6 shadow-xl">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            <p className="text-gray-800">Processing payment...</p>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Checkout</h1>

      <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <section aria-labelledby="cart-heading" className="lg:col-span-7">
          <h2 id="cart-heading" className="sr-only">Items in your cart</h2>

          <form onSubmit={handleCheckout}>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Contact information</h3>
              <div className="mt-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="mt-10">
              <h3 className="text-lg font-medium text-gray-900">Shipping information</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                    First name
                  </label>
                  <input
                    type="text"
                    id="first-name"
                    name="first-name"
                    autoComplete="given-name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="last-name"
                    name="last-name"
                    autoComplete="family-name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Street address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    autoComplete="street-address"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State / Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    autoComplete="address-level1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">
                    ZIP / Postal code
                  </label>
                  <input
                    type="text"
                    id="postal-code"
                    name="postal-code"
                    autoComplete="postal-code"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment section removed */}

            {error && (
              <div className="mt-6 rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mt-10">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Complete Order'}
              </button>
            </div>
          </form>
        </section>

        {/* Order summary */}
        <section
          aria-labelledby="summary-heading"
          className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
        >
          <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
            Order summary
          </h2>

          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Subtotal</dt>
              <dd className="text-sm font-medium text-gray-900">{formatPrice(subtotal / 100)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="flex text-sm text-gray-600">
                <span>Tax (13%)</span>
              </dt>
              <dd className="text-sm font-medium text-gray-900">{formatPrice(tax / 100)}</dd>
            </div>
            {discountCents > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-sm font-medium text-green-700">{DISCOUNT_LABEL}</dt>
                <dd className="text-sm font-medium text-green-700">- {formatPrice(discountCents / 100)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium text-gray-900">Order total</dt>
              <dd className="text-base font-medium text-gray-900">{formatPrice(finalTotal / 100)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter code (e.g., HTNDEV)"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setDiscountApplied(true)}
                className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                Apply
              </button>
            </div>
            {discountApplied && normalizedCode !== 'HTNDEV' && (
              <p className="mt-2 text-sm text-red-600">Invalid code</p>
            )}
            {discountCents > 0 && (
              <p className="mt-2 text-sm text-green-700">Code applied: 100% off</p>
            )}
          </div>

          {/* Extra clarity: show original total and savings */}
          <div className="mt-4 text-sm text-gray-600">
            <p>Original total: <span className="font-medium text-gray-900">{formatPrice(total / 100)}</span></p>
            {discountCents > 0 && (
              <p>You save: <span className="font-medium text-green-700">{formatPrice(discountCents / 100)}</span></p>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Items</h3>
            <dl className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.product.product_id} className="flex justify-between text-sm">
                  <dt className="text-gray-600">
                    {item.product.name} x {item.quantity}
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {formatPrice((item.product.price_cents * item.quantity) / 100)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
