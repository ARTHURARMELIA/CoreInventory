'use client';

import { useEffect, useState } from 'react';
import { dashboardApi, warehouseApi, productApi } from '@/lib/api';

const kpiCards = [
  { key: 'totalProductsInStock', label: 'Total in stock', icon: '📦', color: 'bg-sky-600/20 text-sky-400 border-sky-600/40' },
  { key: 'lowStockItems', label: 'Low stock items', icon: '⚠️', color: 'bg-amber-600/20 text-amber-400 border-amber-600/40' },
  { key: 'outOfStockItems', label: 'Out of stock', icon: '🔴', color: 'bg-red-600/20 text-red-400 border-red-600/40' },
  { key: 'pendingReceipts', label: 'Pending receipts', icon: '📥', color: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/40' },
  { key: 'pendingDeliveries', label: 'Pending deliveries', icon: '📤', color: 'bg-violet-600/20 text-violet-400 border-violet-600/40' },
  { key: 'internalTransfers', label: 'Pending transfers', icon: '↔️', color: 'bg-cyan-600/20 text-cyan-400 border-cyan-600/40' },
];

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState({ warehouse: '', category: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([warehouseApi.list(), productApi.categories()])
      .then(([w, c]) => {
        setWarehouses(w);
        setCategories(c);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter.warehouse) params.warehouse = filter.warehouse;
    if (filter.category) params.category = filter.category;
    dashboardApi.kpis(params)
      .then(setKpis)
      .catch(() => setKpis(null))
      .finally(() => setLoading(false));
  }, [filter.warehouse, filter.category]);

  const [lowStockProducts, setLowStockProducts] = useState([]);
  useEffect(() => {
    if (!filter.warehouse && !filter.category) {
      productApi.list({ lowStock: 'true' }).then(setLowStockProducts).catch(() => setLowStockProducts([]));
    } else {
      const params = { lowStock: 'true' };
      if (filter.warehouse) params.warehouse = filter.warehouse;
      if (filter.category) params.category = filter.category;
      productApi.list(params).then(setLowStockProducts).catch(() => setLowStockProducts([]));
    }
  }, [filter.warehouse, filter.category]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <div className="flex flex-wrap gap-3">
          <select
            value={filter.warehouse}
            onChange={(e) => setFilter((f) => ({ ...f, warehouse: e.target.value }))}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All warehouses</option>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
          <select
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-600/40 bg-amber-600/10 p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">⚠️ Low stock alerts</h2>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 10).map((p) => (
              <span key={p._id} className="rounded bg-slate-800/80 px-2 py-1 text-sm text-slate-300">
                {p.name} ({p.sku}): <strong className="text-amber-400">{p.quantity ?? 0}</strong>
              </span>
            ))}
            {lowStockProducts.length > 10 && <span className="text-slate-500">+{lowStockProducts.length - 10} more</span>}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpiCards.map(({ key, label, icon, color }) => (
            <div
              key={key}
              className={`rounded-xl border p-4 ${color}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-sm font-medium opacity-90">{label}</p>
                  <p className="text-2xl font-bold">
                    {kpis?.[key] ?? '–'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
