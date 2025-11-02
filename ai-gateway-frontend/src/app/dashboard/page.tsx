'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await api.getLogsSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Spend</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${summary?.total_spend?.toFixed(4) || '0.0000'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            of ${summary?.budget?.toFixed(2)} budget
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Budget Remaining</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            ${summary?.budget_remaining?.toFixed(4) || '0.0000'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {summary?.budget_used_percentage?.toFixed(1)}% used
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {summary?.total_requests || 0}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {summary?.last_24h_requests || 0} in last 24h
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget Usage</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${Math.min(summary?.budget_used_percentage || 0, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {summary?.budget_used_percentage?.toFixed(2)}% of budget used
        </p>
      </div>
    </div>
  );
}
