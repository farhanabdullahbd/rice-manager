import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#c9a0a0' }}>{label}</p>
          <p className="text-xl font-bold mt-1" style={{ color: '#d4af37' }}>
            ৳{Number(value || 0).toLocaleString()}
          </p>
        </div>
        <div className="text-xl opacity-70">{icon}</div>
      </div>
      <div className="mt-3 h-0.5 rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      {/* Header + date filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>রিপোর্ট</h2>
          <p className="text-sm mt-0.5" style={{ color: '#c9a0a0' }}>তারিখ ভিত্তিক বিশ্লেষণ</p>
        </div>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <input type="date" className="input w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span style={{ color: '#6b0019' }}>—</span>
          <input type="date" className="input w-36" value={to} onChange={(e) => setTo(e.target.value)} />
          <button onClick={load} disabled={loading} className="btn btn-gold">
            {loading ? 'লোড...' : '📊 দেখুন'}
          </button>
        </div>
      </div>

      {summary && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="মোট বিক্রয়" value={summary.totalSales} icon="💰" color="#d4af37" />
            <StatCard label="নগদ আদায়" value={summary.totalPaidAmount} icon="✅" color="#16a34a" />
            <StatCard label="মোট বাকি" value={summary.totalDueAmount} icon="⚠️" color="#dc2626" />
            <StatCard label="মোট ছাড়" value={summary.totalDiscount} icon="🏷️" color="#eab308" />
            <StatCard label="ক্রয় ব্যয়" value={summary.totalPurchase} icon="🚚" color="#f97316" />
            <StatCard label="COGS (ক্রয়মূল্য)" value={summary.cogs} icon="📦" color="#fb923c" />
            <StatCard label="গ্রস লাভ" value={summary.grossProfit} icon="📈" color="#a855f7" />
            <StatCard label="নিট লাভ" value={summary.netProfit} icon="🏆" color="#10b981" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🏆</span>
                <h3 className="font-semibold" style={{ color: '#d4af37' }}>সর্বোচ্চ বিক্রিত পণ্য</h3>
              </div>
              {topProducts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">📦</p>
                  <p className="text-sm" style={{ color: '#c9a0a0' }}>এই সময়ে কোনো বিক্রয় নেই</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header text-left">#</th>
                      <th className="table-header text-left">পণ্য</th>
                      <th className="table-header text-right">পরিমাণ</th>
                      <th className="table-header text-right">বিক্রয়</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i} className="table-row">
                        <td className="py-2.5 font-bold" style={{ color: '#d4af37' }}>{i + 1}</td>
                        <td className="py-2.5" style={{ color: '#f5e6e0' }}>{p.product?.name}</td>
                        <td className="py-2.5 text-right" style={{ color: '#c9a0a0' }}>
                          {Number(p._sum.quantity)} {p.product?.unit}
                        </td>
                        <td className="py-2.5 text-right font-bold" style={{ color: '#d4af37' }}>
                          ৳{Number(p._sum.totalPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Customer dues */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💳</span>
                <h3 className="font-semibold" style={{ color: '#d4af37' }}>বাকির তালিকা</h3>
              </div>
              {dues.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm" style={{ color: '#c9a0a0' }}>কোনো বাকি নেই</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header text-left">কাস্টমার</th>
                      <th className="table-header text-left">মোবাইল</th>
                      <th className="table-header text-right">বাকি</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dues.map((c) => (
                      <tr key={c.id} className="table-row">
                        <td className="py-2.5" style={{ color: '#f5e6e0' }}>{c.name}</td>
                        <td className="py-2.5" style={{ color: '#c9a0a0' }}>{c.phone || '—'}</td>
                        <td className="py-2.5 text-right font-bold" style={{ color: '#f87171' }}>
                          ৳{Number(c.currentBalance).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Branch comparison — super_admin only */}
          {user?.role === 'super_admin' && branchReport.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🏢</span>
                <h3 className="font-semibold" style={{ color: '#d4af37' }}>শাখাভিত্তিক বিক্রয়</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header text-left">শাখা</th>
                    <th className="table-header text-right">বিক্রয়</th>
                    <th className="table-header text-right">আদায়</th>
                    <th className="table-header text-right">বাকি</th>
                    <th className="table-header text-center">লেনদেন</th>
                  </tr>
                </thead>
                <tbody>
                  {branchReport.map((b) => (
                    <tr key={b.branch.id} className="table-row">
                      <td className="py-3 font-medium" style={{ color: '#f5e6e0' }}>{b.branch.name}</td>
                      <td className="py-3 text-right font-bold" style={{ color: '#d4af37' }}>
                        ৳{Number(b.totalSales).toLocaleString()}
                      </td>
                      <td className="py-3 text-right" style={{ color: '#4ade80' }}>
                        ৳{Number(b.totalPaid).toLocaleString()}
                      </td>
                      <td className="py-3 text-right" style={{ color: '#f87171' }}>
                        ৳{Number(b.totalDue).toLocaleString()}
                      </td>
                      <td className="py-3 text-center" style={{ color: '#c9a0a0' }}>{b.salesCount} টি</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!summary && !loading && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p style={{ color: '#c9a0a0' }}>তারিখ নির্বাচন করে "দেখুন" বাটনে চাপুন</p>
        </div>
      )}
    </div>
  );
}
