'use client';

import { useState } from 'react';

export default function AddSkuForm({ onSkuAdded }: { onSkuAdded: () => void }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [inventory, setInventory] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name, inventory: Number(inventory) }),
      });

      if (!response.ok) {
        throw new Error('Failed to add SKU');
      }

      setId('');
      setName('');
      setInventory(0);
      onSkuAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="sku-id" className="block text-sm font-medium text-gray-700">SKU ID</label>
        <input
          type="text"
          id="sku-id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="sku-name" className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          id="sku-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="sku-inventory" className="block text-sm font-medium text-gray-700">Inventory</label>
        <input
          type="number"
          id="sku-inventory"
          value={inventory}
          onChange={(e) => setInventory(Number(e.target.value))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {submitting ? 'Adding...' : 'Add SKU'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}

