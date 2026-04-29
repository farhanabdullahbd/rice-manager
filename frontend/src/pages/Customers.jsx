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
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-gray-900 text-lg mb-5">
          {customer ? '✏️ কাস্টমার সম্পাদনা' : '+ নতুন কাস্টমার'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="নাম *"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="মোবাইল নম্বর"
            value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="ঠিকানা"
            value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">ক্রেডিট সীমা (৳)</label>
            <input className="input" type="number" placeholder="0"
              value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
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
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-gray-900 text-lg mb-1">💳 বাকি পরিশোধ</h3>
        <p className="text-sm text-gray-500 mb-5">
          {customer.name} — বাকি:{' '}
          <span className="font-bold text-red-500">৳{Number(customer.currentBalance).toLocaleString()}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" type="number" placeholder="পরিমাণ (৳) *"
            value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">নগদ</option>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ মোবাইল</option>
            <option value="card">কার্ড</option>
          </select>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn btn-success flex-1 justify-center">
              {loading ? '...' : '✓ গ্রহণ করুন'}
            </button>
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

  const totalDue = customers.reduce((sum, c) => sum + Math.max(0, Number(c.currentBalance)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">কাস্টমার তালিকা</h2>
          <p className="page-sub">
            {customers.length} জন
            {totalDue > 0 && <span className="ml-1 text-red-500"> · মোট বাকি ৳{totalDue.toLocaleString()}</span>}
          </p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-primary">+ যোগ করুন</button>
      </div>

      <input className="input" placeholder="🔍 নাম বা মোবাইল দিয়ে খুঁজুন..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone || '—'} · {c.address || '—'}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className={`font-bold text-sm ${Number(c.currentBalance) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  ৳{Number(c.currentBalance).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">বাকি</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #F9FAFB' }}>
              {Number(c.currentBalance) > 0 && (
                <button onClick={() => setPayModal(c)}
                  className="flex-1 text-xs py-2 rounded-xl font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-all">
                  💳 পরিশোধ নিন
                </button>
              )}
              <button onClick={() => setModal(c)}
                className="flex-1 text-xs py-2 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                ✏️ সম্পাদনা
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">👤</p>
            <p className="text-gray-400">কোনো কাস্টমার পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {modal !== null && (
        <CustomerModal customer={modal?.id ? modal : null}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
      {payModal && (
        <PaymentModal customer={payModal}
          onClose={() => setPayModal(null)} onSave={() => { setPayModal(null); load(); }} />
      )}
    </div>
  );
}
