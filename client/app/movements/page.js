'use client';

import { useEffect, useState } from 'react';
import { movementApi, productApi, warehouseApi } from '@/lib/api';
import Table from '@/components/Table';

export default function MovementsPage() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [type, setType] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [product, setProduct] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = {};
    if (type) params.type = type;
    if (warehouse) params.warehouse = warehouse;
    if (product) params.product = product;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    movementApi.list(params).then(setList).catch(() => setList([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    productApi.list().then(setProducts).catch(() => {});
    warehouseApi.list().then(setWarehouses).catch(() => {});
  }, []);
  useEffect(load, [type, warehouse, product, fromDate, toDate]);

  const columns = [
    { id: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleString() },
    { id: 'product', header: 'Product', render: (r) => r.product?.name ? `${r.product.name} (${r.product.sku})` : '–' },
    { id: 'movementType', header: 'Type', render: (r) => <span className="capitalize text-sky-400">{r.movementType}</span> },
    { id: 'quantity', header: 'Qty', render: (r) => <span className={r.quantity < 0 ? 'text-red-400' : 'text-emerald-400'}>{r.quantity > 0 ? '+' : ''}{r.quantity}</span> },
    { id: 'warehouse', header: 'Location', render: (r) => r.warehouse?.name ?? '–' },
    { id: 'toWarehouse', header: 'To', render: (r) => r.toWarehouse?.name ?? '–' },
    { id: 'user', header: 'User', render: (r) => r.user?.name ?? '–' },
    { id: 'notes', header: 'Notes', render: (r) => r.notes || '–' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Stock movement history</h1>
        <div className="flex flex-wrap gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200">
            <option value="">All types</option>
            <option value="receipt">Receipt</option>
            <option value="delivery">Delivery</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200">
            <option value="">All warehouses</option>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <select value={product} onChange={(e) => setProduct(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200">
            <option value="">All products</option>
            {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200" />
        </div>
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /></div> : <Table columns={columns} data={list} />}
    </div>
  );
}
