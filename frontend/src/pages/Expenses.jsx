import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['rent', 'salary', 'utility', 'transport', 'maintenance', 'other'];
const CAT_BN = { rent: 'ভাড়া', salary: 'বেতন', utility: 'বিদ্যুৎ/পানি', transport: 'পরিবহন', maintenance: 'রক্ষণাবেক্ষণ', other: 'অন্যান্য' };
const CAT_ICON = { rent: '🏠', salary: '👔', utility: '💡', transport: '🚗', maintenance: '🔧', other: '📋' };

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
    } finally { setLoading(false); }
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">খরচের হিসাব</h2>
          <p className="page-sub">{expenses.length} টি এন্ট্রি</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? '✕ বাতিল' : '+ খরচ যোগ'}
        </button>
      </div>

      <div className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)', border: '1px solid #FECACA' }}>
        <div>
          <p className="text-xs font-medium text-red-500 mb-1">মোট খরচ (এই তালিকায়)</p>
          <p className="text-2xl font-bold text-red-600">৳{total.toLocaleString()}</p>
        </div>
        <div className="text-3xl opacity-30">💸</div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">নতুন খরচ</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_ICON[c]} {CAT_BN[c]}</option>)}
            </select>
            <input className="input" type="number" placeholder="পরিমাণ (৳) *"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input className="input" placeholder="বিবরণ"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
                {loading ? '...' : 'সংরক্ষণ করুন'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline flex-1 justify-center">
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {expenses.map((e) => (
          <div key={e.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-lg">
                {CAT_ICON[e.category]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{CAT_BN[e.category]}</p>
                <p className="text-xs text-gray-400">
                  {e.description || '—'} · {new Date(e.date).toLocaleDateString('bn-BD')}
                </p>
              </div>
            </div>
            <p className="font-bold text-red-500 text-sm shrink-0 ml-2">৳{Number(e.amount).toLocaleString()}</p>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-gray-400">কোনো খরচ নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}
