import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['rent', 'salary', 'utility', 'transport', 'maintenance', 'other'];
const CAT_BN = { rent: 'ভাড়া', salary: 'বেতন', utility: 'বিদ্যুৎ/পানি', transport: 'পরিবহন', maintenance: 'রক্ষণাবেক্ষণ', other: 'অন্যান্য' };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">খরচের হিসাব</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">+ খরচ যোগ</button>
      </div>
      <div className="card bg-red-50 border border-red-200">
        <p className="text-sm text-red-600">মোট খরচ (এই তালিকায়)</p>
        <p className="text-2xl font-bold text-red-700">৳{total.toLocaleString()}</p>
      </div>
      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">নতুন খরচ</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_BN[c]}</option>)}
            </select>
            <input className="input" type="number" placeholder="পরিমাণ (৳) *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <input className="input" placeholder="বিবরণ" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn btn-primary">{loading ? '...' : 'সংরক্ষণ'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline">বাতিল</button>
            </div>
          </form>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">তারিখ</th><th className="pb-2">ক্যাটাগরি</th><th className="pb-2">বিবরণ</th>
              <th className="pb-2">পরিমাণ</th><th className="pb-2">লিখেছেন</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="py-2 text-gray-500">{new Date(e.date).toLocaleDateString('bn-BD')}</td>
                <td className="py-2">{CAT_BN[e.category]}</td>
                <td className="py-2 text-gray-500">{e.description || '—'}</td>
                <td className="py-2 font-medium text-red-600">৳{Number(e.amount).toLocaleString()}</td>
                <td className="py-2 text-gray-400">{e.user?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="text-center py-6 text-gray-400">কোনো খরচ নেই</p>}
      </div>
    </div>
  );
}
