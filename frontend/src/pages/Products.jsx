import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import api from '../api/axios';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'piece', 'bag', 'liter', 'ton', 'box'];

function QRModal({ product, onClose }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const qrData = JSON.stringify({
    id: product.id, name: product.name, sku: product.sku,
    price: product.sellingPrice, unit: product.unit,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
        <h3 className="font-bold text-gray-900 mb-1">QR কোড</h3>
        <p className="text-xs text-gray-500 mb-4">{product.name}</p>
        <div ref={printRef} className="bg-white p-4 rounded-2xl border border-gray-100 inline-block mx-auto">
          <QRCodeSVG value={qrData} size={160} level="H" />
          <p className="text-gray-500 text-xs mt-2 font-mono">{product.sku}</p>
          <p className="text-gray-900 text-sm font-bold">{product.name}</p>
          <p className="text-gray-500 text-xs">৳{Number(product.sellingPrice)} / {product.unit}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={handlePrint} className="btn btn-primary flex-1 justify-center">🖨️ প্রিন্ট</button>
          <button onClick={onClose} className="btn btn-outline flex-1 justify-center">বন্ধ</button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', unit: 'kg', purchasePrice: '', sellingPrice: '', categoryId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) await api.put(`/products/${product.id}`, form);
      else await api.post('/products', form);
      toast.success(product ? 'পণ্য আপডেট হয়েছে' : 'পণ্য যোগ হয়েছে');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-gray-900 text-lg mb-5">
          {product ? '✏️ পণ্য সম্পাদনা' : '+ নতুন পণ্য যোগ'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="পণ্যের নাম *"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="SKU (যেমন: RICE-001) *"
            value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <select className="input" value={form.categoryId || ''}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">-- ক্যাটাগরি --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">ক্রয়মূল্য (৳)</label>
              <input className="input" type="number" placeholder="0"
                value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">বিক্রয়মূল্য (৳)</label>
              <input className="input" type="number" placeholder="0"
                value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center">বাতিল</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [qrProduct, setQrProduct] = useState(null);

  const load = () => {
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/products/meta/categories').then((r) => setCategories(r.data));
  };
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">পণ্য তালিকা</h2>
          <p className="page-sub">{products.length} টি পণ্য</p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-primary">+ নতুন পণ্য</button>
      </div>

      <input className="input" placeholder="🔍 পণ্য খুঁজুন (নাম / SKU)..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="card flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-400 font-mono">{p.sku} · {p.unit}</p>
              <p className="text-sm font-bold text-orange-500 mt-0.5">৳{Number(p.sellingPrice)}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => setQrProduct(p)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-orange-50 text-orange-600 font-medium">
                📱 QR
              </button>
              <button onClick={() => setModal(p)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 font-medium">
                ✏️ সম্পাদনা
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-header text-left">পণ্য</th>
              <th className="table-header text-left">SKU</th>
              <th className="table-header text-left">ক্যাটাগরি</th>
              <th className="table-header text-left">একক</th>
              <th className="table-header text-right">ক্রয়মূল্য</th>
              <th className="table-header text-right">বিক্রয়মূল্য</th>
              <th className="table-header text-center">QR</th>
              <th className="table-header text-center">কাজ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="py-3 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 font-mono text-xs text-gray-400">{p.sku}</td>
                <td className="py-3 text-gray-500">{p.category?.name || '—'}</td>
                <td className="py-3 text-gray-500">{p.unit}</td>
                <td className="py-3 text-right text-gray-500">৳{Number(p.purchasePrice)}</td>
                <td className="py-3 text-right font-bold text-orange-500">৳{Number(p.sellingPrice)}</td>
                <td className="py-3 text-center">
                  <button onClick={() => setQrProduct(p)}
                    className="text-xs px-2.5 py-1 rounded-xl bg-orange-50 text-orange-600 font-medium hover:bg-orange-100">
                    📱 QR
                  </button>
                </td>
                <td className="py-3 text-center">
                  <button onClick={() => setModal(p)}
                    className="text-xs px-2.5 py-1 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200">
                    ✏️ সম্পাদনা
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-gray-400">কোনো পণ্য পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 md:hidden">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-gray-400">কোনো পণ্য পাওয়া যায়নি</p>
        </div>
      )}

      {modal !== null && (
        <ProductModal product={modal?.id ? modal : null} categories={categories}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
      {qrProduct && <QRModal product={qrProduct} onClose={() => setQrProduct(null)} />}
    </div>
  );
}
