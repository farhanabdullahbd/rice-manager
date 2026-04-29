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
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">মাল কেনার তালিকা</h2>
          <p className="page-sub">{purchases.length} টি ক্রয়</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? '✕ বাতিল' : '+ নতুন ক্রয়'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">নতুন মাল ক্রয়</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">-- সরবরাহকারী --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className="input" placeholder="ইনভয়েস নম্বর"
                value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">পণ্য তালিকা</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="input flex-1" value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)} required>
                    <option value="">-- পণ্য --</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="input w-20" type="number" placeholder="পরিমাণ"
                    value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />
                  <input className="input w-24" type="number" placeholder="মূল্য"
                    value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} required />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 hover:bg-red-100">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem}
                className="text-sm font-medium text-orange-500 hover:text-orange-600">
                + পণ্য যোগ করুন
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ছাড় (৳)</label>
                <input className="input" type="number" placeholder="0"
                  value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">পরিশোধ</label>
                <input className="input" type="number" placeholder={total.toFixed(0)}
                  value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">পেমেন্ট</label>
                <select className="input" value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="cash">নগদ</option>
                  <option value="bkash">বিকাশ</option>
                  <option value="bank">ব্যাংক</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
              <div>
                <p className="text-xs text-gray-500">সর্বমোট</p>
                <p className="text-xl font-bold text-orange-500">৳{total.toFixed(2)}</p>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {purchases.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{p.supplier?.name || 'সরবরাহকারী নেই'}</p>
                <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString('bn-BD')} · {p.items?.length} টি পণ্য</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-500 text-sm">৳{Number(p.totalAmount).toLocaleString()}</p>
                {Number(p.dueAmount) > 0 && (
                  <p className="text-xs text-red-500">বাকি ৳{Number(p.dueAmount).toLocaleString()}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              <span className="text-green-600 font-medium">পরিশোধ ৳{Number(p.paidAmount).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {purchases.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🚚</p>
            <p className="text-gray-400">কোনো ক্রয় নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}
