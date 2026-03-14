'use client';

import { useEffect, useState } from 'react';
import { warehouseApi } from '@/lib/api';
import Table from '@/components/Table';
import Modal from '@/components/Modal';

export default function WarehousesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    warehouseApi.list().then(setList).catch(() => setList([])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await warehouseApi.create(form);
      setModal(false);
      setForm({ name: '', code: '', address: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { id: 'code', header: 'Code', render: (r) => <span className="font-mono text-sky-400">{r.code}</span> },
    { id: 'name', header: 'Name', render: (r) => r.name },
    { id: 'address', header: 'Address', render: (r) => r.address || '–' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Warehouses</h1>
        <button onClick={() => { setModal(true); setError(''); }} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">Add warehouse</button>
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /></div> : <Table columns={columns} data={list} />}
      <Modal open={modal} onClose={() => setModal(false)} title="New warehouse">
        <form onSubmit={save} className="space-y-4">
          {error && <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>}
          <div>
            <label className="mb-1 block text-sm text-slate-400">Name</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Code</label>
            <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Address</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-500 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
