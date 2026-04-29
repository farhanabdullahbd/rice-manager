import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['rent', 'salary', 'utility', 'transport', 'maintenance', 'other'];
const CAT_BN = {
  rent: 'ভাড়া', salary: 'বেতন', utility: 'বিদ্যুৎ/পানি',
  transport: 'পরিবহন', maintenance: 'রক্ষণাবেক্ষণ', other: 'অন্যান্য',
};
const CAT_ICON = {
  rent: '🏠', salary: '👔', utility: '💡', transport: '🚗', maintenance: '🔧', other: '📋',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'other', amount: '', description: '' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/expenses').then((r) => setExpenses(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/expenses', form);
      toast.success('খরচ যোগ হয়েছে');
      setShowForm(false);
      setForm({ category: 'other', amount: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>খরচের হিসাব</h2>
          <p className="text-sm mt-0.5" style={{ color: '#c9a0a0' }}>{expenses.length} টি এন্ট্রি</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-gold">
          {showForm ? '✕ বাতিল' : '✦ খরচ যোগ'}
        </button>
      </div>

      {/* Total card */}
      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#f87171' }}>মোট খরচ (এই তালিকায়)</p>
          <p className="text-3xl font-bold" style={{ color: '#f87171' }}>৳{total.toLocaleString()}</p>
        </div>
        <div className="text-4xl opacity-40">💸</div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-bold text-base mb-5" style={{ color: '#d4af37' }}>✦ নতুন খরচ</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>খরচের ধরন</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CAT_ICON[c]} {CAT_BN[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>পরিমাণ (৳) *</label>
              <input className="input" type="number" placeholder="0"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#d4af37' }}>বিবরণ</label>
              <input className="input" placeholder="যেমন: জুলাই মাসের ভাড়া"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loading} className="btn btn-gold flex-1 justify-center">
                {loading ? 'সংরক্ষণ...' : '✦ সংরক্ষণ করুন'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline flex-1 justify-center">
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-header text-left">তারিখ</th>
              <th className="table-header text-left">ধরন</th>
              <th className="table-header text-left">বিবরণ</th>
              <th className="table-header text-right">পরিমাণ</th>
              <th className="table-header text-left">লিখেছেন</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="table-row">
                <td className="py-3" style={{ color: '#c9a0a0' }}>
                  {new Date(e.date).toLocaleDateString('bn-BD')}
                </td>
                <td className="py-3" style={{ color: '#f5e6e0' }}>
                  {CAT_ICON[e.category]} {CAT_BN[e.category]}
                </td>
                <td className="py-3" style={{ color: '#c9a0a0' }}>{e.description || '—'}</td>
                <td className="py-3 text-right font-bold" style={{ color: '#f87171' }}>
                  ৳{Number(e.amount).toLocaleString()}
                </td>
                <td className="py-3" style={{ color: '#c9a0a0' }}>{e.user?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">💸</p>
            <p style={{ color: '#c9a0a0' }}>কোনো খরচ নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}
