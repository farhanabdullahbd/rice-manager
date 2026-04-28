import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'piece', 'bag', 'liter', 'ton', 'box'];

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product || { name: '', sku: '', unit: 'kg', purchasePrice: '', sellingPrice: '', categoryId: '' });
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md">
        <h3 className="font-semibold text-gray-800 mb-4">{product ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="পণ্যের নাম *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="SKU (যেমন: RICE-001) *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select className="input" value={form.categoryId || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">-- ক্যাটাগরি (ঐচ্ছিক) --</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="input" type="number" placeholder="ক্রয়মূল্য *" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} required />
            <input className="input" type="number" placeholder="বিক্রয়মূল্য *" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">{loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</button>
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
        <h2 className="text-xl font-bold text-gray-800">পণ্য তালিকা</h2>
        <button onClick={() => setModal({})} className="btn btn-primary">+ নতুন পণ্য</button>
      </div>
      <input className="input max-w-sm" placeholder="পণ্য খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">পণ্য</th><th className="pb-2">SKU</th><th className="pb-2">ক্যাটাগরি</th>
              <th className="pb-2">একক</th><th className="pb-2">ক্রয়মূল্য</th><th className="pb-2">বিক্রয়মূল্য</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 font-medium">{p.name}</td>
                <td className="py-2 text-gray-500">{p.sku}</td>
                <td className="py-2 text-gray-500">{p.category?.name || '—'}</td>
                <td className="py-2">{p.unit}</td>
                <td className="py-2">৳{Number(p.purchasePrice)}</td>
                <td className="py-2 font-medium text-blue-700">৳{Number(p.sellingPrice)}</td>
                <td className="py-2">
                  <button onClick={() => setModal(p)} className="text-blue-500 hover:text-blue-700 text-xs">সম্পাদনা</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-6 text-gray-400">কোনো পণ্য পাওয়া যায়নি</p>}
      </div>
      {modal !== null && (
        <ProductModal product={modal?.id ? modal : null} categories={categories} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
