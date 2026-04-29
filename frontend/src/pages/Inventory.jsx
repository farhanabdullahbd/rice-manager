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
    } finally {
      setLoading(false);
    }
  };

  const lowCount = inventory.filter((i) => Number(i.quantity) <= Number(i.minStockAlert)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>স্টক ব্যবস্থাপনা</h2>
          <p className="text-sm mt-0.5" style={{ color: '#c9a0a0' }}>
            {inventory.length} টি পণ্য
            {lowCount > 0 && <span className="ml-2 text-red-400">⚠️ {lowCount} টি কম স্টক</span>}
          </p>
        </div>
        <button onClick={() => setAdjustModal(true)} className="btn btn-gold">✦ স্টক সমন্বয়</button>
      </div>

      <div className="card overflow-x-auto">
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
                  <td className="py-3 font-medium" style={{ color: '#f5e6e0' }}>{i.product.name}</td>
                  <td className="py-3" style={{ color: '#c9a0a0' }}>{i.branch.name}</td>
                  <td className="py-3 text-right font-semibold" style={{ color: isLow ? '#f87171' : '#d4af37' }}>
                    {Number(i.quantity)} {i.product.unit}
                  </td>
                  <td className="py-3 text-right" style={{ color: '#c9a0a0' }}>
                    {Number(i.minStockAlert)} {i.product.unit}
                  </td>
                  <td className="py-3 text-center">
                    {isLow ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                        ⚠️ কম স্টক
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(22,163,74,0.15)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.3)' }}>
                        ✓ ঠিক আছে
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inventory.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📦</p>
            <p style={{ color: '#c9a0a0' }}>স্টক তথ্য নেই</p>
          </div>
        )}
      </div>

      {adjustModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #2d0009, #1a0005)', border: '1px solid #d4af37' }}>
            <h3 className="font-bold text-lg mb-5" style={{ color: '#d4af37' }}>✦ স্টক সমন্বয়</h3>
            <form onSubmit={handleAdjust} className="space-y-3">
              <select className="input" value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">-- পণ্য নির্বাচন করুন --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
              </select>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>পরিমাণ</label>
                <input className="input" type="number" placeholder="যেমন: 50"
                  value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>সর্বনিম্ন সতর্কতা সীমা</label>
                <input className="input" type="number" placeholder="10"
                  value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="btn btn-gold flex-1 justify-center">
                  {loading ? 'সংরক্ষণ...' : '✦ সংরক্ষণ করুন'}
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
