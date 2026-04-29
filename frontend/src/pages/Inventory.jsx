import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [adjustModal, setAdjustModal] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', minStockAlert: '10' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/inventory').then((r) => setInventory(r.data));
  useEffect(() => {
    load();
    api.get('/products').then((r) => setProducts(r.data));
  }, []);

  const handleAdjust = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inventory/adjust', form);
      toast.success('স্টক আপডেট হয়েছে');
      setAdjustModal(false);
      setForm({ productId: '', quantity: '', minStockAlert: '10' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally { setLoading(false); }
  };

  const lowCount = inventory.filter((i) => Number(i.quantity) <= Number(i.minStockAlert)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">স্টক ব্যবস্থাপনা</h2>
          <p className="page-sub">
            {inventory.length} টি পণ্য
            {lowCount > 0 && <span className="ml-2 text-red-500 font-medium">⚠️ {lowCount} টি কম স্টক</span>}
          </p>
        </div>
        <button onClick={() => setAdjustModal(true)} className="btn btn-primary">+ স্টক সমন্বয়</button>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {inventory.map((i) => {
          const isLow = Number(i.quantity) <= Number(i.minStockAlert);
          return (
            <div key={i.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{i.product.name}</p>
                <p className="text-xs text-gray-400">{i.branch.name}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${isLow ? 'text-red-500' : 'text-orange-500'}`}>
                  {Number(i.quantity)} {i.product.unit}
                </p>
                <span className={`text-xs font-medium ${isLow ? 'text-red-500' : 'text-green-600'}`}>
                  {isLow ? '⚠️ কম' : '✓ ঠিক আছে'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-header text-left">পণ্য</th>
              <th className="table-header text-left">শাখা</th>
              <th className="table-header text-right">বর্তমান স্টক</th>
              <th className="table-header text-right">সর্বনিম্ন সীমা</th>
              <th className="table-header text-center">অবস্থা</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((i) => {
              const isLow = Number(i.quantity) <= Number(i.minStockAlert);
              return (
                <tr key={i.id} className="table-row">
                  <td className="py-3 font-medium text-gray-900">{i.product.name}</td>
                  <td className="py-3 text-gray-500">{i.branch.name}</td>
                  <td className={`py-3 text-right font-semibold ${isLow ? 'text-red-500' : 'text-orange-500'}`}>
                    {Number(i.quantity)} {i.product.unit}
                  </td>
                  <td className="py-3 text-right text-gray-400">
                    {Number(i.minStockAlert)} {i.product.unit}
                  </td>
                  <td className="py-3 text-center">
                    {isLow
                      ? <span className="badge-due">⚠️ কম স্টক</span>
                      : <span className="badge-paid">✓ ঠিক আছে</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inventory.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-gray-400">স্টক তথ্য নেই</p>
          </div>
        )}
      </div>

      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-5">স্টক সমন্বয়</h3>
            <form onSubmit={handleAdjust} className="space-y-3">
              <select className="input" value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">-- পণ্য নির্বাচন করুন --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
              </select>
              <input className="input" type="number" placeholder="পরিমাণ"
                value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              <input className="input" type="number" placeholder="সর্বনিম্ন সতর্কতা সীমা (10)"
                value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
                  {loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
                </button>
                <button type="button" onClick={() => setAdjustModal(false)} className="btn btn-outline flex-1 justify-center">
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
