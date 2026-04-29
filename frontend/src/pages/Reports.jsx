import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

function StatCard({ label, value, icon, bg }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: '1px solid #F3F4F6' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: bg }}>
          {icon}
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900">৳{Number(value || 0).toLocaleString()}</p>
    </div>
  );
}

export default function Reports() {
  const { user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [dues, setDues] = useState([]);
  const [branchReport, setBranchReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = `from=${from}&to=${to}`;
      const [s, tp, d] = await Promise.all([
        api.get(`/reports/summary?${params}`),
        api.get(`/reports/top-products?${params}`),
        api.get('/reports/customer-dues'),
      ]);
      setSummary(s.data);
      setTopProducts(tp.data);
      setDues(d.data);
      if (user?.role === 'super_admin') {
        const br = await api.get(`/reports/branches?${params}`);
        setBranchReport(br.data);
      }
    } catch {
      toast.error('রিপোর্ট লোড ব্যর্থ');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-header">রিপোর্ট</h2>
        <p className="page-sub">তারিখ ভিত্তিক বিশ্লেষণ</p>
      </div>

      {/* Date filter */}
      <div className="card flex items-center gap-2 flex-wrap">
        <input type="date" className="input flex-1 min-w-0" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-gray-400 shrink-0">—</span>
        <input type="date" className="input flex-1 min-w-0" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={load} disabled={loading} className="btn btn-primary shrink-0">
          {loading ? '...' : '📊 দেখুন'}
        </button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="মোট বিক্রয়" value={summary.totalSales} icon="💰" bg="#FFF7ED" />
            <StatCard label="নগদ আদায়" value={summary.totalPaidAmount} icon="✅" bg="#F0FDF4" />
            <StatCard label="মোট বাকি" value={summary.totalDueAmount} icon="⚠️" bg="#FEF2F2" />
            <StatCard label="মোট ছাড়" value={summary.totalDiscount} icon="🏷️" bg="#FEFCE8" />
            <StatCard label="ক্রয় ব্যয়" value={summary.totalPurchase} icon="🚚" bg="#FFF7ED" />
            <StatCard label="COGS" value={summary.cogs} icon="📦" bg="#FFF7ED" />
            <StatCard label="গ্রস লাভ" value={summary.grossProfit} icon="📈" bg="#FAF5FF" />
            <StatCard label="নিট লাভ" value={summary.netProfit} icon="🏆" bg="#F0FDF4" />
          </div>

          {/* Top products */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">🏆</div>
              <h3 className="font-semibold text-gray-800">সর্বোচ্চ বিক্রিত পণ্য</h3>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">এই সময়ে কোনো বিক্রয় নেই</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.product?.name}</p>
                        <p className="text-xs text-gray-400">{Number(p._sum.quantity)} {p.product?.unit}</p>
                      </div>
                    </div>
                    <span className="font-bold text-orange-500 text-sm">
                      ৳{Number(p._sum.totalPrice).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer dues */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">💳</div>
              <h3 className="font-semibold text-gray-800">বাকির তালিকা</h3>
            </div>
            {dues.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">কোনো বাকি নেই 🎉</p>
            ) : (
              <div className="space-y-2">
                {dues.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone || '—'}</p>
                    </div>
                    <span className="font-bold text-red-500 text-sm">
                      ৳{Number(c.currentBalance).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Branch comparison — super_admin only */}
          {user?.role === 'super_admin' && branchReport.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">🏢</div>
                <h3 className="font-semibold text-gray-800">শাখাভিত্তিক বিক্রয়</h3>
              </div>
              <div className="space-y-2">
                {branchReport.map((b) => (
                  <div key={b.branch.id} className="py-2" style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm">{b.branch.name}</p>
                      <p className="font-bold text-orange-500 text-sm">৳{Number(b.totalSales).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs">
                      <span className="text-green-600">আদায় ৳{Number(b.totalPaid).toLocaleString()}</span>
                      <span className="text-red-500">বাকি ৳{Number(b.totalDue).toLocaleString()}</span>
                      <span className="text-gray-400">{b.salesCount} টি</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
