'use client'

import { useEffect, useState } from 'react'

type Sale = {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
  sale_date: string
  status: string
}

type SalesJson = {
  sales: Sale[]
  weekly_sales?: { week: number; total_revenue: number; units_sold: number }[]
  monthly_sales?: { month: string; total_revenue: number; units_sold: number }[]
}

type InventoryItem = {
  id: string
  name: string
  sku: string
  category: string
  available_quantity: number
  selling_price: number
}

export default function MerchentDashboard() {
  const [sales, setSales] = useState<Sale[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [salesRes, invRes] = await Promise.all([
        fetch('/api/merchent/sales'),
        fetch('/api/merchent/inventory'),
      ])
      const salesJson: SalesJson = await salesRes.json()
      const invJson = await invRes.json()
      setSales(salesJson.sales || [])
      setInventory((invJson.products || invJson.items || invJson.inventory || []) as InventoryItem[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0)
  const totalOrders = sales.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const todaysOrders = sales.filter((s) => new Date(s.sale_date).toDateString() === new Date().toDateString())

  const addDemoOrder = async () => {
    setAdding(true)
    try {
      await fetch('/api/merchent/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: 'DEMO-001', product_name: 'Demo Product', quantity: 1, unit_price: 2599 }),
      })
      await load()
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Merchent Dashboard</h1>
          <p className="mt-1 text-gray-600">JSON-powered sales and inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/merchent/logout"
            className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
          >
            Logout
          </a>
          <button
            onClick={addDemoOrder}
            disabled={adding}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add Demo Order'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white text-gray-900 shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white text-gray-900 shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold">{totalOrders}</p>
            </div>
            <div className="bg-white text-gray-900 shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-semibold">${avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-white text-gray-900 shadow rounded-lg p-5">
              <p className="text-sm text-gray-500">Today's Orders</p>
              <p className="text-2xl font-semibold">{todaysOrders.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white text-gray-900 shadow rounded-lg">
              <div className="px-5 py-4 border-b"><h2 className="font-semibold">Recent Orders</h2></div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-2 text-left">ID</th>
                      <th className="px-5 py-2 text-left">Product</th>
                      <th className="px-5 py-2 text-left">Qty</th>
                      <th className="px-5 py-2 text-left">Total</th>
                      <th className="px-5 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sales.slice(0, 10).map((s) => (
                      <tr key={s.id} className="text-sm text-gray-900">
                        <td className="px-5 py-2">{s.id}</td>
                        <td className="px-5 py-2">{s.product_name}</td>
                        <td className="px-5 py-2">{s.quantity}</td>
                        <td className="px-5 py-2">${s.total_amount.toFixed(2)}</td>
                        <td className="px-5 py-2">{s.sale_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white text-gray-900 shadow rounded-lg">
              <div className="px-5 py-4 border-b"><h2 className="font-semibold">Inventory</h2></div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-2 text-left">SKU</th>
                      <th className="px-5 py-2 text-left">Name</th>
                      <th className="px-5 py-2 text-left">Avail</th>
                      <th className="px-5 py-2 text-left">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventory.slice(0, 10).map((i) => (
                      <tr key={i.id} className="text-sm text-gray-900">
                        <td className="px-5 py-2">{i.sku}</td>
                        <td className="px-5 py-2">{i.name}</td>
                        <td className="px-5 py-2">{i.available_quantity}</td>
                        <td className="px-5 py-2">${Number(i.selling_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
