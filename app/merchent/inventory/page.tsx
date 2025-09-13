'use client'

import { useEffect, useMemo, useState } from 'react'

type InvItem = {
  id: string
  name: string
  sku: string
  category?: string
  available_quantity: number
  warehouse_quantity?: number
  reserved_quantity?: number
  selling_price?: number
}

export default function InventoryPage() {
  const [items, setItems] = useState<InvItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/merchent/inventory')
        const j = await res.json()
        const arr = (j.products || j.items || j.inventory || []) as InvItem[]
        setItems(arr)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const metrics = useMemo(() => {
    const totalSkus = items.length
    const totalAvailable = items.reduce((s, it) => s + Number(it.available_quantity || 0), 0)
    const totalWarehouse = items.reduce((s, it) => s + Number(it.warehouse_quantity || 0), 0)
    const totalReserved = items.reduce((s, it) => s + Number(it.reserved_quantity || 0), 0)
    return { totalSkus, totalAvailable, totalWarehouse, totalReserved }
  }, [items])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="mt-1 text-gray-600">Current stock and availability</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Total SKUs</p>
          <p className="text-2xl font-semibold">{metrics.totalSkus}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Available Units</p>
          <p className="text-2xl font-semibold">{metrics.totalAvailable}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Warehouse Units</p>
          <p className="text-2xl font-semibold">{metrics.totalWarehouse}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Reserved Units</p>
          <p className="text-2xl font-semibold">{metrics.totalReserved}</p>
        </div>
      </div>

      <div className="bg-white text-gray-900 shadow rounded-lg">
        <div className="px-5 py-4 border-b"><h2 className="font-semibold">Products</h2></div>
        {loading ? (
          <p className="p-5 text-gray-600">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-2 text-left">SKU</th>
                  <th className="px-5 py-2 text-left">Name</th>
                  <th className="px-5 py-2 text-left">Category</th>
                  <th className="px-5 py-2 text-left">Available</th>
                  <th className="px-5 py-2 text-left">Warehouse</th>
                  <th className="px-5 py-2 text-left">Reserved</th>
                  <th className="px-5 py-2 text-left">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((i) => (
                  <tr key={i.id} className="text-gray-900">
                    <td className="px-5 py-2">{i.sku}</td>
                    <td className="px-5 py-2">{i.name}</td>
                    <td className="px-5 py-2">{i.category || '-'}</td>
                    <td className="px-5 py-2">{i.available_quantity}</td>
                    <td className="px-5 py-2">{i.warehouse_quantity ?? '-'}</td>
                    <td className="px-5 py-2">{i.reserved_quantity ?? '-'}</td>
                    <td className="px-5 py-2">{i.selling_price != null ? `$${Number(i.selling_price).toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
