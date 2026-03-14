'use client';

import { useEffect, useState } from 'react';
import { transferApi, productApi, warehouseApi } from '@/lib/api';
import Table from '@/components/Table';
import Modal from '@/components/Modal';

export default function TransfersPage() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fromWarehouse: '', toWarehouse: '', notes: '', lines: [{ product: '', quantity: 1 }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    transferApi.list(params).then(setList).catch(() => setList([])).finally(() => setLoading(false));
  };
  useEffect(() => {
    productApi.list().then(setProducts).catch(() => {});
    warehouseApi.list().then(setWarehouses).catch(() => {});
  }, []);
  useEffect(load, [status]);

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { product: '', quantity: 1 }] }));
  const removeLine = (i) => setForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }));
  const updateLine = (i, field, value) => setForm((f) => ({ ...f, lines: f.lines.map((l, j) => j === i ? { ...l, [field]: value } : l) }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (form.fromWarehouse === form.toWarehouse) { setError('From and To warehouse must be different'); return; }
    const lines = form.lines.filter((l) => l.product && l.quantity > 0).map((l) => ({ product: l.product, quantity: Number(l.quantity) }));
    if (lines.length === 0) { setError('Add at least one line'); return; }
    setSaving(true);
    try {
      await transferApi.create({ fromWarehouse: form.fromWarehouse, toWarehouse: form.toWarehouse, notes: form.notes, lines });
      setModal(false);
      setForm({ fromWarehouse: '', toWarehouse: '', notes: '', lines: [{ product: '', quantity: 1 }] });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const validate = async (id) => {
    try {
      await transferApi.validate(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { id: 'transferNumber', header: 'Number', render: (r) => <span className="font-mono text-sky-400">{r.transferNumber}</span> },
    { id: 'from', header: 'From', render: (r) => r.fromWarehouse?.name ?? r.fromWarehouse },
    { id: 'to', header: 'To', render: (r) => r.toWarehouse?.name ?? r.toWarehouse },
    { id: 'status', header: 'Status', render: (r) => <span className={r.status === 'validated' ? 'text-emerald-400' : 'text-amber-400'}>{r.status}</span> },
    { id: 'lines', header: 'Lines', render: (r) => r.lines?.length ?? 0 },
    { id: 'createdAt', header: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { id: 'actions', header: '', render: (r) => r.status === 'pending' ? <button type="button" onClick={() => validate(r._id)} className="text-sky-400 hover:underline">Validate</button> : '–' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Internal transfers</h1>
        <div className="flex gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200">
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="validated">Validated</option>
          </select>
          <button onClick={() => { setModal(true); setError(''); }} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">New transfer</button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /></div> : <Table columns={columns} data={list} />}

      <Modal open={modal} onClose={() => setModal(false)} title="New transfer">
        <form onSubmit={save} className="space-y-4">
          {error && <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-400">From warehouse</label>
              <select required value={form.fromWarehouse} onChange={(e) => setForm((f) => ({ ...f, fromWarehouse: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                <option value="">Select</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">To warehouse</label>
              <select required value={form.toWarehouse} onChange={(e) => setForm((f) => ({ ...f, toWarehouse: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
                <option value="">Select</option>
                {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Lines</label>
            {form.lines.map((line, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <select required value={line.product} onChange={(e) => updateLine(i, 'product', e.target.value)} className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100">
                  <option value="">Product</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                </select>
                <input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100" />
                <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:underline">×</button>
              </div>
            ))}
            <button type="button" onClick={addLine} className="text-sm text-sky-400 hover:underline">+ Add line</button>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
