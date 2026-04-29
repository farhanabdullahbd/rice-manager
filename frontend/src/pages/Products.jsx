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
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.sellingPrice,
    unit: product.unit,
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-2xl p-6 w-80 text-center shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #2d0009, #1a0005)', border: '1px solid #d4af37' }}>
        <h3 className="font-bold text-lg mb-1" style={{ color: '#d4af37' }}>QR কোড</h3>
        <p className="text-xs mb-4" style={{ color: '#c9a0a0' }}>{product.name}</p>

        <div ref={printRef} className="bg-white p-4 rounded-xl mx-auto inline-block">
          <QRCodeSVG value={qrData} size={180} level="H"
            imageSettings={{ src: '', excavate: false }} />
          <p className="text-black text-xs mt-2 font-mono">{product.sku}</p>
          <p className="text-black text-sm font-bold">{product.name}</p>
          <p className="text-black text-xs">৳{Number(product.sellingPrice)} / {product.unit}</p>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={handlePrint} className="btn btn-gold flex-1 justify-center">🖨️ প্রিন্ট</button>
          <button onClick={onClose} className="btn btn-outline flex-1 justify-center">বন্ধ</button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', unit: 'kg', purchasePrice: '', sellingPrice: '', categoryId: ''
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #2d0009, #1a0005)', border: '1px solid #d4af37' }}>
        <h3 className="font-bold text-lg mb-5" style={{ color: '#d4af37' }}>
          {product ? '✏️ পণ্য সম্পাদনা' : '✦ নতুন পণ্য যোগ'}
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
              <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>ক্রয়মূল্য (৳)</label>
              <input className="input" type="number" placeholder="0"
                value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>বিক্রয়মূল্য (৳)</label>
              <input className="input" type="number" placeholder="0"
                value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn btn-gold flex-1 justify-center">
              {loading ? 'সংরক্ষণ...' : '✦ সংরক্ষণ করুন'}
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>পণ্য তালিকা</h2>
          <p className="text-sm" style={{ color: '#c9a0a0' }}>{products.length} টি পণ্য</p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-gold">✦ নতুন পণ্য</button>
      </div>

      <input className="input max-w-sm" placeholder="🔍 পণ্য খুঁজুন (নাম / SKU)..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-header text-left">পণ্য</th>
              <th className="table-header text-left">SKU</th>
              <th className="table-header text-left">ক্যাটাগরি</th>
              <th className="table-header text-left">একক</th>
              <th className="table-header text-right">ক্রয়মূল্য</th>
              <th className="table-header text-right">বিক্রয়মূল্য</th>
              <th className="table-header text-center">QR কোড</th>
              <th className="table-header text-center">কাজ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="py-3 font-medium" style={{ color: '#f5e6e0' }}>{p.name}</td>
                <td className="py-3 font-mono text-xs" style={{ color: '#c9a0a0' }}>{p.sku}</td>
                <td className="py-3" style={{ color: '#c9a0a0' }}>{p.category?.name || '—'}</td>
                <td className="py-3" style={{ color: '#c9a0a0' }}>{p.unit}</td>
                <td className="py-3 text-right" style={{ color: '#c9a0a0' }}>৳{Number(p.purchasePrice)}</td>
                <td className="py-3 text-right font-bold" style={{ color: '#d4af37' }}>৳{Number(p.sellingPrice)}</td>
                <td className="py-3 text-center">
                  <button onClick={() => setQrProduct(p)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ background: '#2d0009', color: '#d4af37', border: '1px solid #4a0012' }}
                    title="QR কোড দেখুন">
                    📱 QR
                  </button>
                </td>
                <td className="py-3 text-center">
                  <button onClick={() => setModal(p)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ background: '#2d0009', color: '#c9a0a0', border: '1px solid #4a0012' }}>
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
            <p style={{ color: '#c9a0a0' }}>কোনো পণ্য পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {modal !== null && (
        <ProductModal product={modal?.id ? modal : null} categories={categories}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
      {qrProduct && <QRModal product={qrProduct} onClose={() => setQrProduct(null)} />}
    </div>
  );
}
