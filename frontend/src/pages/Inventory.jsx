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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">স্টক ব্যবস্থাপনা</h2>
        <button onClick={() => setAdjustModal(true)} className="btn btn-primary">স্টক সমন্বয়</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">পণ্য</th><th className="pb-2">শাখা</th>
              <th className="pb-2">বর্তমান স্টক</th><th className="pb-2">সর্বনিম্ন সীমা</th><th className="pb-2">অবস্থা</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((i) => {
              const isLow = Number(i.quantity) <= Number(i.minStockAlert);
              return (
                <tr key={i.id} className={`border-b last:border-0 ${isLow ? 'bg-red-50' : ''}`}>
                  <td className="py-2 font-medium">{i.product.name}</td>
                  <td className="py-2 text-gray-500">{i.branch.name}</td>
                  <td className="py-2 font-semibold">{Number(i.quantity)} {i.product.unit}</td>
                  <td className="py-2 text-gray-500">{Number(i.minStockAlert)} {i.product.unit}</td>
                  <td className="py-2">
                    {isLow ? <span className="badge-due">কম স্টক</span> : <span className="badge-paid">ঠিক আছে</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inventory.length === 0 && <p className="text-center py-6 text-gray-400">স্টক তথ্য নেই</p>}
      </div>

      {adjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm">
            <h3 className="font-semibold mb-4">স্টক সমন্বয়</h3>
            <form onSubmit={handleAdjust} className="space-y-3">
              <select className="input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                <option value="">-- পণ্য নির্বাচন করুন --</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="input" type="number" placeholder="পরিমাণ" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              <input className="input" type="number" placeholder="সর্বনিম্ন সীমা (alert)" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })} />
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">{loading ? 'সংরক্ষণ...' : 'সংরক্ষণ'}</button>
                <button type="button" onClick={() => setAdjustModal(false)} className="btn btn-outline flex-1 justify-center">বাতিল</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
