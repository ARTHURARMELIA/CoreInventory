'use client';

import { useEffect, useState } from 'react';
import { productApi, warehouseApi } from '@/lib/api';
import Table from '@/components/Table';
import Modal from '@/components/Modal';

const defaultProduct = { name: '', sku: '', category: '', unitOfMeasure: 'pcs', lowStockThreshold: 10, initialStock: 0, warehouseId: '' };

export default function ProductsPage() {
  const [list, setList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const [form, setForm] = useState(defaultProduct);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (sku) params.sku = sku;
    if (category) params.category = category;
    if (warehouse) params.warehouse = warehouse;
    if (lowStock) params.lowStock = 'true';
    productApi.list(params).then(setList).catch(() => setList([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    warehouseApi.list().then(setWarehouses).catch(() => {});
    productApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(load, [sku, category, warehouse, lowStock]);

  const openCreate = () => {
    setForm({ ...defaultProduct });
    setModal({ open: true, data: null });
    setError('');
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      sku: row.sku,
      category: row.category,
      unitOfMeasure: row.unitOfMeasure || 'pcs',
      lowStockThreshold: row.lowStockThreshold ?? 10,
      initialStock: row.quantity ?? 0,
      warehouseId: warehouse || '',
    });
    setModal({ open: true, data: row });
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (modal.data) {
        await productApi.update(modal.data._id, {
          name: form.name,
          sku: form.sku,
          category: form.category,
          unitOfMeasure: form.unitOfMeasure,
          lowStockThreshold: Number(form.lowStockThreshold),
        });
      } else {
        await productApi.create({
          name: form.name,
          sku: form.sku,
          category: form.category,
          unitOfMeasure: form.unitOfMeasure,
          lowStockThreshold: Number(form.lowStockThreshold),
          initialStock: Number(form.initialStock) || 0,
          warehouseId: form.warehouseId || undefined,
        });
      }
      setModal({ open: false, data: null });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productApi.delete(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { id: 'name', header: 'Name', render: (r) => r.name },
    { id: 'sku', header: 'SKU', render: (r) => <span className="font-mono text-sky-400">{r.sku}</span> },
    { id: 'category', header: 'Category', render: (r) => r.category },
    { id: 'unitOfMeasure', header: 'UoM', render: (r) => r.unitOfMeasure || 'pcs' },
    { id: 'quantity', header: 'Stock', render: (r) => (
      <span className={r.quantity <= (r.lowStockThreshold ?? 10) ? 'text-amber-400' : ''}>
        {r.quantity ?? 0}
      </span>
    ) },
    { id: 'actions', header: '', render: (r) => (
      <div className="flex gap-2">
        <button type="button" onClick={() => openEdit(r)} className="text-sky-400 hover:underline">Edit</button>
        <button type="button" onClick={() => deleteProduct(r._id)} className="text-red-400 hover:underline">Delete</button>
      </div>
    ) },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Products</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          Add product
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 w-48"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">All warehouses</option>
          {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} className="rounded" />
          Low stock only
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /></div>
      ) : (
        <Table columns={columns} data={list} />
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Edit product' : 'New product'}>
        <form onSubmit={save} className="space-y-4">
          {error && <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>}
          <div>
            <label className="mb-1 block text-sm text-slate-400">Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">SKU</label>
            <input required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" disabled={!!modal.data} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Category</label>
            <input required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" list="categories-list" />
            <datalist id="categories-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Unit of measure</label>
            <input value={form.unitOfMeasure} onChange={(e) => setForm((f) => ({ ...f, unitOfMeasure: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Low stock threshold</label>
            <input type="number" min={0} value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
          </div>
          {!modal.data && (
            <>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Initial stock (optional)</label>
                <input type="number" min={0} value={form.initialStock} onChange={(e) => setForm((f) => ({ ...f, initialStock: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-400">Warehouse (for initial stock)</label>
                <select value={form.warehouseId} onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                  <option value="">–</option>
                  {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, data: null })} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
