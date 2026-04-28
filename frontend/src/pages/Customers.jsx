import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(customer || { name: '', phone: '', address: '', creditLimit: '0' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (customer) await api.put(`/customers/${customer.id}`, form);
      else await api.post('/customers', form);
      toast.success(customer ? 'কাস্টমার আপডেট হয়েছে' : 'কাস্টমার যোগ হয়েছে');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-sm">
        <h3 className="font-semibold mb-4">{customer ? 'কাস্টমার সম্পাদনা' : 'নতুন কাস্টমার'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="নাম *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="মোবাইল নম্বর" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="ঠিকানা" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="input" type="number" placeholder="ক্রেডিট সীমা (৳)" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">{loading ? 'সংরক্ষণ...' : 'সংরক্ষণ'}</button>
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center">বাতিল</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ customer, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/payments', { customerId: customer.id, amount, paymentMethod: method });
      toast.success('পেমেন্ট গ্রহণ করা হয়েছে');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-sm">
        <h3 className="font-semibold mb-1">বাকি পরিশোধ</h3>
        <p className="text-sm text-gray-500 mb-4">{customer.name} — বাকি: ৳{Number(customer.currentBalance).toLocaleString()}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" type="number" placeholder="পরিমাণ *" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">নগদ</option><option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ মোবাইল</option><option value="card">কার্ড</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn btn-success flex-1 justify-center">{loading ? '...' : 'গ্রহণ করুন'}</button>
            <button type="button" onClick={onClose} className="btn btn-outline flex-1 justify-center">বাতিল</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [payModal, setPayModal] = useState(null);

  const load = () => api.get('/customers').then((r) => setCustomers(r.data));
  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">কাস্টমার তালিকা</h2>
        <button onClick={() => setModal({})} className="btn btn-primary">+ নতুন কাস্টমার</button>
      </div>
      <input className="input max-w-sm" placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">নাম</th><th className="pb-2">মোবাইল</th><th className="pb-2">ঠিকানা</th>
              <th className="pb-2">ক্রেডিট সীমা</th><th className="pb-2 text-red-600">বাকি</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 font-medium">{c.name}</td>
                <td className="py-2 text-gray-500">{c.phone || '—'}</td>
                <td className="py-2 text-gray-500">{c.address || '—'}</td>
                <td className="py-2">৳{Number(c.creditLimit).toLocaleString()}</td>
                <td className={`py-2 font-medium ${Number(c.currentBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ৳{Number(c.currentBalance).toLocaleString()}
                </td>
                <td className="py-2 flex gap-2">
                  {Number(c.currentBalance) > 0 && (
                    <button onClick={() => setPayModal(c)} className="text-green-600 hover:text-green-800 text-xs">পরিশোধ</button>
                  )}
                  <button onClick={() => setModal(c)} className="text-blue-500 hover:text-blue-700 text-xs">সম্পাদনা</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-6 text-gray-400">কোনো কাস্টমার পাওয়া যায়নি</p>}
      </div>
      {modal !== null && (
        <CustomerModal customer={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
      {payModal && <PaymentModal customer={payModal} onClose={() => setPayModal(null)} onSave={() => { setPayModal(null); load(); }} />}
    </div>
  );
}
