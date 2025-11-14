// src/pages/Products.tsx
import { useEffect, useState } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';
import Layout from '../components/layout/Layout';
import Card from '../components/Card';

type P = {
  id: number;
  name: string;
  description?: string;
  uom: string;
  unit_price: number;
  tax_rate: number;
  status: string;
};

export default function Products() {
  const [rows, setRows] = useState<P[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    uom: 'NOS',
    unit_price: '',
    tax_rate: '18',
    status: 'active',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [sortBy, setSortBy] = useState<'name' | 'unit_price' | 'tax_rate' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const d = await api.getProducts();
      setRows(d || []);
    } catch (e) {
      console.error(e);
      alert('failed to load products');
    }
  }

  async function submit() {
    try {
      const payload = {
        name: form.name,
        description: form.description,
        uom: form.uom,
        unit_price: parseFloat(form.unit_price || '0'),
        tax_rate: parseFloat(form.tax_rate || '0'),
        status: form.status,
      };

      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.addProduct(payload);
      }

      setOpen(false);
      setEditingId(null);
      setForm({ name: '', description: '', uom: 'NOS', unit_price: '', tax_rate: '18', status: 'active' });
      load();
    } catch (e) {
      console.error(e);
      alert('failed to save product');
    }
  }

  function openEdit(r: P) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      description: r.description || '',
      uom: r.uom,
      unit_price: String(r.unit_price ?? ''),
      tax_rate: String(r.tax_rate ?? '18'),
      status: r.status || 'active',
    });
    setOpen(true);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      load();
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Products</h2>
            <p className="text-sm text-gray-500 mt-1">Manage products, pricing and status</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', description: '', uom: 'NOS', unit_price: '', tax_rate: '18', status: 'active' });
                setOpen(true);
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md shadow-sm"
            >
              + Add Product
            </button>
          </div>
        </div>

        <Card className="p-4">
          <div className="mb-4">
            <input
              className="input-field w-full"
              placeholder="Search products..."
              // TODO: wire up search
            />
          </div>

          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Sort by</label>
              <select
                className="input-field"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ width: 160 }}
              >
                <option value="name">Name</option>
                <option value="unit_price">Unit Price</option>
                <option value="tax_rate">Tax Rate</option>
                <option value="status">Status</option>
              </select>
              <button
                className="px-2 py-1 border rounded text-sm"
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              >
                {sortDir === 'asc' ? '▲' : '▼'}
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, rows.length)} of {rows.length}
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-md border">
            <table className="min-w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-gray-600 text-xs uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Tax Rate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows
                  .slice()
                  .sort((a, b) => {
                    const dir = sortDir === 'asc' ? 1 : -1;
                    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
                    if (sortBy === 'unit_price') return (Number(a.unit_price) - Number(b.unit_price)) * dir;
                    if (sortBy === 'tax_rate') return (Number(a.tax_rate) - Number(b.tax_rate)) * dir;
                    return String(a.status).localeCompare(String(b.status)) * dir;
                  })
                  .slice((page - 1) * perPage, page * perPage)
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-800">{r.name}</div>
                          {r.description ? (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">{r.description}</div>
                          ) : (
                            <div className="text-sm text-gray-400 mt-1">—</div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">{r.uom}</td>
                      <td className="px-4 py-4 text-right align-top">
                        ₹{Number(r.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right align-top">{Number(r.tax_rate || 0).toFixed(2)}%</td>
                      <td className="px-4 py-4 align-top">
                        {r.status === 'active' ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Active</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{r.status}</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right align-top">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-sm text-rose-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-sm text-gray-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {rows.length > perPage && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-1 border rounded" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <div className="text-sm">Page {page} of {Math.ceil(rows.length / perPage)}</div>
              <button className="px-3 py-1 border rounded" disabled={page * perPage >= rows.length} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </Card>

        <Modal
          title={editingId ? 'Edit Product' : 'Add New Product'}
          open={open}
          onClose={() => { setOpen(false); setEditingId(null); }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => { setOpen(false); setEditingId(null); }}
                className="px-3 py-1 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="px-4 py-2 rounded shadow-sm"
                style={{ background: '#ff6b61', color: '#fff' }}
              >
                {editingId ? 'Save' : 'Add Product'}
              </button>
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              className="input-field"
              placeholder="Product Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Unit Price"
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            />
            <select className="input-field" value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })}>
              <option>NOS</option>
              <option>SET</option>
              <option>HR</option>
            </select>
            <input className="input-field" placeholder="Tax Rate" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* description spans full width */}
            <textarea
              className="input-field col-span-full"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
