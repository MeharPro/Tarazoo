'use client';

import { useState, useEffect } from 'react';
import { subscribeToMinlpRuns, getLatestMinlpRun, createMinlpRun } from 'lib/supabase';
import type { MinlpRun } from 'packages/shared/types';
import { formatPrice } from 'lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MERCHANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export default function DashboardPage() {
  const router = useRouter();
  const [latestMinlpRun, setLatestMinlpRun] = useState<MinlpRun | null>(null);
  const [isRunningMinlp, setIsRunningMinlp] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    // Load latest MINLP run
    loadLatestMinlpRun();

    // Subscribe to realtime updates
    const minlpChannel = subscribeToMinlpRuns(MERCHANT_ID, (payload) => {
      if (payload.eventType === 'INSERT') {
        setLatestMinlpRun(payload.new as MinlpRun);
      }
    });

    return () => {
      minlpChannel.unsubscribe();
    };
  }, []);

  const loadLatestMinlpRun = async () => {
    const data = await getLatestMinlpRun(MERCHANT_ID);
    setLatestMinlpRun(data);
  };

  const runMinlpOptimization = async () => {
    setIsRunningMinlp(true);
    try {
      // Fire-and-navigate: start solve then send user to PO Design
      void fetch('/api/minlp/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: MERCHANT_ID,
          orders: [
            { order_id: 'sample-1', total_cents: 2500, created_at: new Date().toISOString() },
            { order_id: 'sample-2', total_cents: 1800, created_at: new Date().toISOString() },
            { order_id: 'sample-3', total_cents: 3200, created_at: new Date().toISOString() }
          ]
        })
      }).catch((err) => console.error('MINLP optimization failed:', err));
    } finally {
      router.push('/merchent/purchase-orders/design');
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor operations and run supply chain optimizations</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/sales" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sales & Transactions</dt>
                  <dd className="text-lg font-semibold text-gray-900">View Sales Data</dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/cashier" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Point of Sale</dt>
                  <dd className="text-lg font-semibold text-gray-900">Process Orders</dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/search" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Product Search</dt>
                  <dd className="text-lg font-semibold text-gray-900">Browse Inventory</dd>
                </dl>
              </div>
            </div>
          </div>
        </Link>
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

      {/* System Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Database</p>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Supabase</p>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">API Services</p>
              <p className="text-sm text-gray-500">Running</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
