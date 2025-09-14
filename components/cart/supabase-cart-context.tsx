'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem } from '../../packages/shared/types';

const TAX_RATE = 0.13; // 13% tax

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tarazoo_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart from storage');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tarazoo_cart', JSON.stringify(items));
  }, [items]);

    const addItem = (product: Product) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.product_id === product.product_id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevItems, { product, quantity: 1 }];
    });
  };

    const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.product_id !== productId));
  };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.product.product_id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('tarazoo_cart');
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.product.price_cents * item.quantity), 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
            value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        total,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useSupabaseCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useSupabaseCart must be used within a CartProvider');
  }
  return context;
}
