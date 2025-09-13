'use client'

import { useEffect, useMemo, useState } from 'react'

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

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/merchent/sales')
        const j = await res.json()
        setSales(j.sales || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const metrics = useMemo(() => {
    const today = new Date()
    const toISODate = (d: Date) => d.toISOString().slice(0, 10)
    const dateOf = (offsetDays: number) => {
      const d = new Date(today)
      d.setDate(d.getDate() + offsetDays)
      return toISODate(d)
    }
    const fmt = (n: number) => `$${n.toFixed(2)}`
    const sumFor = (iso: string) =>
      sales
        .filter((s) => (s.sale_date || '').startsWith(iso))
        .reduce((sum, s) => sum + Number(s.total_amount || 0), 0)

    const salesToday = sumFor(toISODate(today))
    const salesWeekAgo = sumFor(dateOf(-7))
    const salesMonthAgo = sumFor(dateOf(-30))

    return { salesToday, salesWeekAgo, salesMonthAgo, fmt }
  }, [sales])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="mt-1 text-gray-600">Transaction data and daily snapshots</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Sales Today</p>
          <p className="text-2xl font-semibold">{metrics.fmt(metrics.salesToday)}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Sales 7 Days Ago</p>
          <p className="text-2xl font-semibold">{metrics.fmt(metrics.salesWeekAgo)}</p>
        </div>
        <div className="bg-white text-gray-900 shadow rounded-lg p-5">
          <p className="text-sm text-gray-500">Sales 30 Days Ago</p>
          <p className="text-2xl font-semibold">{metrics.fmt(metrics.salesMonthAgo)}</p>
        </div>
      </div>

      <div className="bg-white text-gray-900 shadow rounded-lg">
        <div className="px-5 py-4 border-b"><h2 className="font-semibold">Transactions</h2></div>
        {loading ? (
          <p className="p-5 text-gray-600">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-2 text-left">ID</th>
                  <th className="px-5 py-2 text-left">Product</th>
                  <th className="px-5 py-2 text-left">Qty</th>
                  <th className="px-5 py-2 text-left">Unit Price</th>
                  <th className="px-5 py-2 text-left">Total</th>
                  <th className="px-5 py-2 text-left">Date</th>
                  <th className="px-5 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.map((s) => (
                  <tr key={s.id} className="text-gray-900">
                    <td className="px-5 py-2">{s.id}</td>
                    <td className="px-5 py-2">{s.product_name}</td>
                    <td className="px-5 py-2">{s.quantity}</td>
                    <td className="px-5 py-2">${Number(s.unit_price).toFixed(2)}</td>
                    <td className="px-5 py-2">${Number(s.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-2">{s.sale_date}</td>
                    <td className="px-5 py-2">{s.status}</td>
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
