'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSupabaseCart } from 'components/cart/supabase-cart-context';
import { formatPrice } from 'lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, tax, total, clearCart } = useSupabaseCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>
        <div className="mt-12 text-center">
          <p className="text-gray-500">Your cart is empty</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>
      
      <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <section aria-labelledby="cart-heading" className="lg:col-span-7">
          <h2 id="cart-heading" className="sr-only">
            Items in your shopping cart
          </h2>

          <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
            {items.map((item) => (
              <li key={item.product.product_id} className="flex py-6 sm:py-10">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-md bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs text-center">
                      {item.product.name.substring(0, 20)}
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm">
                          <span className="font-medium text-gray-700 hover:text-gray-800">
                            {item.product.name}
                          </span>
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">SKU: {item.product.sku}</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {formatPrice(item.product.price_cents / 100)}
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <label htmlFor={`quantity-${item.product.product_id}`} className="sr-only">
                        Quantity, {item.product.name}
                      </label>
                      <select
                        id={`quantity-${item.product.product_id}`}
                        name={`quantity-${item.product.product_id}`}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.product_id, parseInt(e.target.value))}
                        className="max-w-full rounded-md border border-gray-300 py-1.5 text-left text-base font-medium leading-5 text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>

                      <div className="absolute right-0 top-0">
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.product_id)}
                          className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Remove</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium text-gray-900">Order total</dt>
              <dd className="text-base font-medium text-gray-900">{formatPrice(total / 100)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <Link
              href="/checkout"
              className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 flex items-center justify-center"
            >
              Checkout
            </Link>
          </div>

          <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
            <p>
              or{' '}
              <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                Continue Shopping
                <span aria-hidden="true"> &rarr;</span>
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
