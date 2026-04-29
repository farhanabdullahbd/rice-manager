import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([{ productId: '', quantity: '', unitPrice: '' }]);
  const [form, setForm] = useState({
    supplierId: '', discount: '0', paidAmount: '', paymentMethod: 'cash', invoiceNo: '', notes: '',
  });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/purchases').then((r) => setPurchases(r.data));
  useEffect(() => {
    load();
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/suppliers').then((r) => setSuppliers(r.data));
  }, []);

  const addItem = () => setItems([...items, { productId: '', quantity: '', unitPrice: '' }]);
  const updateItem = (idx, field, value) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce(
    (sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0
  );
  const total = subtotal - parseFloat(form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some((i) => !i.productId || !i.quantity || !i.unitPrice))
      return toast.error('সব পণ্যের তথ্য পূরণ করুন');
    setLoading(true);
    try {
      await api.post('/purchases', {
        ...form,
        items: items.map((i) => ({
          productId: parseInt(i.productId),
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
        paidAmount: form.paidAmount || total,
      });
      toast.success('মাল কেনা সম্পন্ন, স্টক আপডেট হয়েছে');
      setShowForm(false);
      setItems([{ productId: '', quantity: '', unitPrice: '' }]);
      setForm({ supplierId: '', discount: '0', paidAmount: '', paymentMethod: 'cash', invoiceNo: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>মাল কেনার তালিকা</h2>
          <p className="text-sm mt-0.5" style={{ color: '#c9a0a0' }}>{purchases.length} টি ক্রয়</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-gold">
          {showForm ? '✕ বাতিল' : '✦ নতুন ক্রয়'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-bold text-base mb-5" style={{ color: '#d4af37' }}>✦ নতুন মাল ক্রয়</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">-- সরবরাহকারী (ঐচ্ছিক) --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className="input" placeholder="ইনভয়েস নম্বর"
                value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#d4af37' }}>পণ্য তালিকা</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="input flex-1" value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)} required>
                    <option value="">-- পণ্য --</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="input w-24" type="number" placeholder="পরিমাণ"
                    value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />
                  <input className="input w-28" type="number" placeholder="ক্রয়মূল্য"
                    value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} required />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem}
                className="text-sm font-medium transition-all" style={{ color: '#d4af37' }}>
                + পণ্য যোগ করুন
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>ছাড় (৳)</label>
                <input className="input" type="number" placeholder="0"
                  value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>
                  পরিশোধ (মোট: ৳{total.toFixed(0)})
                </label>
                <input className="input" type="number" placeholder={total.toFixed(0)}
                  value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>পেমেন্ট পদ্ধতি</label>
                <select className="input" value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="cash">নগদ</option>
                  <option value="bkash">বিকাশ</option>
                  <option value="bank">ব্যাংক</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2"
              style={{ borderTop: '1px solid #4a0012' }}>
              <div>
                <p className="text-xs" style={{ color: '#c9a0a0' }}>সর্বমোট</p>
                <p className="text-xl font-bold" style={{ color: '#d4af37' }}>৳{total.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn btn-gold">
                  {loading ? 'সংরক্ষণ...' : '✦ সংরক্ষণ করুন'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">বাতিল</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-header text-left">তারিখ</th>
              <th className="table-header text-left">সরবরাহকারী</th>
              <th className="table-header text-right">মোট</th>
              <th className="table-header text-right">পরিশোধ</th>
              <th className="table-header text-right">বাকি</th>
              <th className="table-header text-center">আইটেম</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="py-3" style={{ color: '#c9a0a0' }}>
                  {new Date(p.date).toLocaleDateString('bn-BD')}
                </td>
                <td className="py-3" style={{ color: '#f5e6e0' }}>{p.supplier?.name || '—'}</td>
                <td className="py-3 text-right font-bold" style={{ color: '#d4af37' }}>
                  ৳{Number(p.totalAmount).toLocaleString()}
                </td>
                <td className="py-3 text-right" style={{ color: '#4ade80' }}>
                  ৳{Number(p.paidAmount).toLocaleString()}
                </td>
                <td className="py-3 text-right" style={{ color: Number(p.dueAmount) > 0 ? '#f87171' : '#4ade80' }}>
                  ৳{Number(p.dueAmount).toLocaleString()}
                </td>
                <td className="py-3 text-center" style={{ color: '#c9a0a0' }}>
                  {p.items?.length} টি
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🚚</p>
            <p style={{ color: '#c9a0a0' }}>কোনো ক্রয় নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}
