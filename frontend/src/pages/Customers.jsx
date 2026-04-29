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
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #2d0009, #1a0005)', border: '1px solid #d4af37' }}>
        <h3 className="font-bold text-lg mb-5" style={{ color: '#d4af37' }}>
          {customer ? '✏️ কাস্টমার সম্পাদনা' : '✦ নতুন কাস্টমার'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="নাম *"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="মোবাইল নম্বর"
            value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" placeholder="ঠিকানা"
            value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>ক্রেডিট সীমা (৳)</label>
            <input className="input" type="number" placeholder="0"
              value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
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
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #2d0009, #1a0005)', border: '1px solid #d4af37' }}>
        <h3 className="font-bold text-lg mb-1" style={{ color: '#d4af37' }}>💳 বাকি পরিশোধ</h3>
        <p className="text-sm mb-5" style={{ color: '#c9a0a0' }}>
          {customer.name} — বাকি:{' '}
          <span style={{ color: '#f87171', fontWeight: 'bold' }}>৳{Number(customer.currentBalance).toLocaleString()}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>পরিমাণ (৳)</label>
            <input className="input" type="number" placeholder="0"
              value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">নগদ</option>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ মোবাইল</option>
            <option value="card">কার্ড</option>
          </select>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="btn flex-1 justify-center font-semibold"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', border: '1px solid #16a34a' }}>
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>কাস্টমার তালিকা</h2>
          <p className="text-sm mt-0.5" style={{ color: '#c9a0a0' }}>
            {customers.length} জন কাস্টমার
            {totalDue > 0 && (
              <span className="ml-2" style={{ color: '#f87171' }}>
                — মোট বাকি: ৳{totalDue.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-gold">✦ নতুন কাস্টমার</button>
      </div>

      <input className="input max-w-sm" placeholder="🔍 নাম বা মোবাইল দিয়ে খুঁজুন..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-header text-left">নাম</th>
              <th className="table-header text-left">মোবাইল</th>
              <th className="table-header text-left">ঠিকানা</th>
              <th className="table-header text-right">ক্রেডিট সীমা</th>
              <th className="table-header text-right">বাকি</th>
              <th className="table-header text-center">কাজ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="table-row">
                <td className="py-3 font-medium" style={{ color: '#f5e6e0' }}>{c.name}</td>
                <td className="py-3" style={{ color: '#c9a0a0' }}>{c.phone || '—'}</td>
                <td className="py-3" style={{ color: '#c9a0a0' }}>{c.address || '—'}</td>
                <td className="py-3 text-right" style={{ color: '#c9a0a0' }}>৳{Number(c.creditLimit).toLocaleString()}</td>
                <td className="py-3 text-right font-bold"
                  style={{ color: Number(c.currentBalance) > 0 ? '#f87171' : '#4ade80' }}>
                  ৳{Number(c.currentBalance).toLocaleString()}
                </td>
                <td className="py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    {Number(c.currentBalance) > 0 && (
                      <button onClick={() => setPayModal(c)}
                        className="text-xs px-2 py-1 rounded-lg transition-all"
                        style={{ background: 'rgba(22,163,74,0.15)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.3)' }}>
                        💳 পরিশোধ
                      </button>
                    )}
                    <button onClick={() => setModal(c)}
                      className="text-xs px-2 py-1 rounded-lg transition-all"
                      style={{ background: '#2d0009', color: '#c9a0a0', border: '1px solid #4a0012' }}>
                      ✏️ সম্পাদনা
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">👤</p>
            <p style={{ color: '#c9a0a0' }}>কোনো কাস্টমার পাওয়া যায়নি</p>
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
