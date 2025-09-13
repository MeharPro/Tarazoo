'use client';

import { useState, useEffect } from 'react';
import { getOrders, subscribeToOrders, subscribeToMinlpRuns, getLatestMinlpRun, createMinlpRun } from 'lib/supabase';
import type { Order, MinlpRun } from 'packages/shared/types';
import { formatPrice } from 'lib/utils';

const MERCHANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [latestMinlpRun, setLatestMinlpRun] = useState<MinlpRun | null>(null);
  const [isRunningMinlp, setIsRunningMinlp] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    // Load initial orders
    loadOrders();

    // Load latest MINLP run
    loadLatestMinlpRun();

    // Subscribe to realtime updates
    const ordersChannel = subscribeToOrders(MERCHANT_ID, (payload) => {
      if (payload.eventType === 'INSERT') {
        setOrders(prev => [payload.new as Order, ...prev]);
      }
    });

    const minlpChannel = subscribeToMinlpRuns(MERCHANT_ID, (payload) => {
      if (payload.eventType === 'INSERT') {
        setLatestMinlpRun(payload.new as MinlpRun);
      }
    });

    return () => {
      ordersChannel.unsubscribe();
      minlpChannel.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    const data = await getOrders(MERCHANT_ID);
    setOrders(data);
  };

  const loadLatestMinlpRun = async () => {
    const data = await getLatestMinlpRun(MERCHANT_ID);
    setLatestMinlpRun(data);
  };

  const runMinlpOptimization = async () => {
    setIsRunningMinlp(true);
    try {
      const response = await fetch('/api/minlp/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: MERCHANT_ID,
          orders: orders.slice(0, 5) // Use latest 5 orders for optimization
        })
      });

      if (response.ok) {
        const result = await response.json();
        await loadLatestMinlpRun();
      }
    } catch (error) {
      console.error('MINLP optimization failed:', error);
    } finally {
      setIsRunningMinlp(false);
    }
  };

  const getExplanation = async () => {
    if (!latestMinlpRun) return;
    
    try {
      const response = await fetch('/api/minlp/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution: latestMinlpRun.solution_json
        })
      });

      if (response.ok) {
        const explanation = await response.json();
        setLatestMinlpRun({
          ...latestMinlpRun,
          rationale_text: `${explanation.bullets.join(' • ')} | TL;DR: ${explanation.tldr}`
        });
        setShowExplanation(true);
      }
    } catch (error) {
      console.error('Failed to get explanation:', error);
    }
  };

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_cents, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor sales, orders, and run optimizations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatPrice(totalRevenue / 100)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd className="text-lg font-semibold text-gray-900">{orders.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Order Value</dt>
                  <dd className="text-lg font-semibold text-gray-900">{formatPrice(avgOrderValue / 100)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Orders</dt>
                  <dd className="text-lg font-semibold text-gray-900">{todaysOrders.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MINLP Optimization Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Supply Chain Optimization</h2>
          <button
            onClick={runMinlpOptimization}
            disabled={isRunningMinlp}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningMinlp ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running MINLP...
              </>
            ) : (
              'Run MINLP Optimization'
            )}
          </button>
        </div>

        {latestMinlpRun && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Latest Optimization Result</h3>
            {latestMinlpRun.solution_json && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Optimal Cost</p>
                    <p className="text-lg font-semibold">
                      {formatPrice(latestMinlpRun.solution_json.kpis?.total_cost / 100 || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Suppliers Used</p>
                    <p className="text-lg font-semibold">
                      {latestMinlpRun.solution_json.kpis?.supplier_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Lead Time</p>
                    <p className="text-lg font-semibold">
                      {latestMinlpRun.solution_json.kpis?.avg_lead_time || 0} days
                    </p>
                  </div>
                </div>

                <button
                  onClick={getExplanation}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Get Explanation →
                </button>

                {showExplanation && latestMinlpRun.rationale_text && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-gray-700">{latestMinlpRun.rationale_text}</p>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Run ID: {latestMinlpRun.run_id} • {new Date(latestMinlpRun.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders (Live Feed)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'confirmed_demo' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(order.total_cents / 100)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
