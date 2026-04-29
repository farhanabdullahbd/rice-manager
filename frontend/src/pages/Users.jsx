import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const ROLES = [
  { value: 'cashier', label: 'ক্যাশিয়ার' },
  { value: 'branch_manager', label: 'শাখা ম্যানেজার' },
  { value: 'super_admin', label: 'সুপার অ্যাডমিন' },
];

const ROLE_BN = { cashier: 'ক্যাশিয়ার', branch_manager: 'শাখা ম্যানেজার', super_admin: 'সুপার অ্যাডমিন' };
const ROLE_BG = { cashier: '#F0FDF4', branch_manager: '#FFF7ED', super_admin: '#FAF5FF' };
const ROLE_FG = { cashier: '#16A34A', branch_manager: '#EA580C', super_admin: '#9333EA' };

function UserModal({ user, branches, currentRole, onClose, onSave }) {
  const isEdit = !!user;
  const [form, setForm] = useState(user || {
    name: '', email: '', password: '', role: 'cashier', branchId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/users/${user.id}`, {
          name: form.name, role: form.role, isActive: true,
          branchId: form.branchId ? parseInt(form.branchId) : null,
        });
      } else {
        await api.post('/users', {
          ...form,
          branchId: form.branchId ? parseInt(form.branchId) : null,
        });
      }
      toast.success(isEdit ? 'ইউজার আপডেট হয়েছে' : 'ইউজার যোগ হয়েছে');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'সমস্যা হয়েছে');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-gray-900 text-lg mb-5">
          {isEdit ? '✏️ ইউজার সম্পাদনা' : '+ নতুন ইউজার'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="পূর্ণ নাম *"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          {!isEdit && (
            <>
              <input className="input" type="email" placeholder="ইমেইল *"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input className="input" type="password" placeholder="পাসওয়ার্ড *"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </>
          )}
          <select className="input" value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.filter((r) => currentRole === 'super_admin' || r.value !== 'super_admin').map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {currentRole === 'super_admin' && (
            <select className="input" value={form.branchId || ''}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">-- শাখা (super_admin হলে খালি) --</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
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

export default function Users() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => {
    api.get('/users').then((r) => setUsers(r.data));
    api.get('/branches').then((r) => setBranches(r.data));
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-header">ইউজার ব্যবস্থাপনা</h2>
          <p className="page-sub">{users.length} জন ইউজার</p>
        </div>
        <button onClick={() => setModal({})} className="btn btn-primary">+ যোগ করুন</button>
      </div>

      <input className="input" placeholder="🔍 নাম বা ইমেইল দিয়ে খুঁজুন..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: ROLE_BG[u.role], color: ROLE_FG[u.role] }}>
                      {ROLE_BN[u.role]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {u.branch?.name || (u.role === 'super_admin' ? 'সব শাখা' : '—')}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setModal(u)}
                className="text-xs px-3 py-1.5 rounded-xl font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 shrink-0">
                ✏️
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-gray-400">কোনো ইউজার পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {modal !== null && (
        <UserModal user={modal?.id ? modal : null} branches={branches} currentRole={currentUser?.role}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
