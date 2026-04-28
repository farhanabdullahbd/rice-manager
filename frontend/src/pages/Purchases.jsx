import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([{ productId: '', quantity: '', unitPrice: '' }]);
  const [form, setForm] = useState({ supplierId: '', discount: '0', paidAmount: '', paymentMethod: 'cash', invoiceNo: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/purchases').then((r) => setPurchases(r.data));
  useEffect(() => {
    load();
    api.get('/products').then((r) => setProducts(r.data));
    api.get('/suppliers').then((r) => setSuppliers(r.data));
  }, []);

  const addItem = () => setItems([...items, { productId: '', quantity: '', unitPrice: '' }]);
  const updateItem = (idx, field, value) => setItems(items.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);
  const total = subtotal - parseFloat(form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some((i) => !i.productId || !i.quantity || !i.unitPrice)) return toast.error('সব পণ্যের তথ্য পূরণ করুন');
    setLoading(true);
    try {
      await api.post('/purchases', {
        ...form,
        items: items.map((i) => ({ productId: parseInt(i.productId), quantity: parseFloat(i.quantity), unitPrice: parseFloat(i.unitPrice) })),
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">মাল কেনার তালিকা</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">+ নতুন ক্রয়</button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">নতুন মাল ক্রয়</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">-- সরবরাহকারী (ঐচ্ছিক) --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className="input" placeholder="ইনভয়েস নম্বর" value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} />
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="input flex-1" value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} required>
                    <option value="">-- পণ্য --</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="input w-24" type="number" placeholder="পরিমাণ" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />
                  <input className="input w-28" type="number" placeholder="ক্রয়মূল্য" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} required />
                  {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">✕</button>}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">+ পণ্য যোগ করুন</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input className="input" type="number" placeholder="ছাড়" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              <input className="input" type="number" placeholder={`পরিশোধ (৳${total.toFixed(0)})`} value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} />
              <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="cash">নগদ</option><option value="bkash">বিকাশ</option><option value="bank">ব্যাংক</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-semibold">মোট: ৳{total.toFixed(2)}</p>
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn btn-success">{loading ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">বাতিল</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">তারিখ</th><th className="pb-2">সরবরাহকারী</th><th className="pb-2">মোট</th>
              <th className="pb-2">পরিশোধ</th><th className="pb-2">বাকি</th><th className="pb-2">আইটেম</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 text-gray-500">{new Date(p.date).toLocaleDateString('bn-BD')}</td>
                <td className="py-2">{p.supplier?.name || '—'}</td>
                <td className="py-2 font-medium">৳{Number(p.totalAmount).toLocaleString()}</td>
                <td className="py-2 text-green-600">৳{Number(p.paidAmount).toLocaleString()}</td>
                <td className="py-2 text-red-600">৳{Number(p.dueAmount).toLocaleString()}</td>
                <td className="py-2 text-gray-500">{p.items?.length} টি পণ্য</td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && <p className="text-center py-6 text-gray-400">কোনো ক্রয় নেই</p>}
      </div>
    </div>
  );
}
