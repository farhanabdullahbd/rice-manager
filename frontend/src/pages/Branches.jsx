import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function BranchModal({ branch, onClose, onSave }) {
  const [form, setForm] = useState(branch || { name: '', address: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (branch) await api.put(`/branches/${branch.id}`, form);
      else await api.post('/branches', form);
      toast.success(branch ? 'শাখা আপডেট হয়েছে' : 'শাখা যোগ হয়েছে');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-gray-900 text-lg mb-5">
          {branch ? '✏️ শাখা সম্পাদনা' : '+ নতুন শাখা'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="শাখার নাম *"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input" placeholder="ঠিকানা"
            value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="input" placeholder="মোবাইল নম্বর"
            value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" type="email" placeholder="ইমেইল"
            value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [modal, setModal] = useState(null);

  const load = () => api.get('/branches').then((r) => setBranches(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">শাখা ব্যবস্থাপনা</h2>
          <p className="page-sub">{branches.length} টি শাখা</p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-primary">+ যোগ করুন</button>
      </div>

      <div className="space-y-2">
        {branches.map((b) => (
          <div key={b.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' }}>
                  🏢
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                  {b.address && <p className="text-xs text-gray-500 mt-0.5">📍 {b.address}</p>}
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                    {b.phone && <span>📞 {b.phone}</span>}
                    {b.email && <span>✉️ {b.email}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setModal(b)}
                className="text-xs px-3 py-1.5 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 shrink-0">
                ✏️
              </button>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🏢</p>
            <p className="text-gray-400">কোনো শাখা নেই</p>
          </div>
        )}
      </div>

      {modal !== null && (
        <BranchModal branch={modal?.id ? modal : null}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
