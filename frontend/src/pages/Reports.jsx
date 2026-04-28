import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

function StatCard({ label, value, color = 'border-blue-500', prefix = '৳' }) {
  return (
    <div className={`card border-l-4 ${color}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800 mt-0.5">{prefix}{Number(value || 0).toLocaleString()}</p>
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
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-gray-800">রিপোর্ট</h2>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" className="input w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-gray-500">—</span>
          <input type="date" className="input w-36" value={to} onChange={(e) => setTo(e.target.value)} />
          <button onClick={load} disabled={loading} className="btn btn-primary">{loading ? 'লোড...' : 'দেখুন'}</button>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="মোট বিক্রয়" value={summary.totalSales} color="border-blue-500" />
            <StatCard label="নগদ আদায়" value={summary.totalPaidAmount} color="border-green-500" />
            <StatCard label="মোট বাকি" value={summary.totalDueAmount} color="border-red-500" />
            <StatCard label="মোট ছাড়" value={summary.totalDiscount} color="border-yellow-500" />
            <StatCard label="ক্রয় ব্যয়" value={summary.totalPurchase} color="border-orange-500" />
            <StatCard label="পণ্যের ক্রয়মূল্য (COGS)" value={summary.cogs} color="border-orange-400" />
            <StatCard label="গ্রস লাভ" value={summary.grossProfit} color="border-purple-500" />
            <StatCard label="নিট লাভ" value={summary.netProfit} color="border-emerald-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">🏆 সর্বোচ্চ বিক্রিত পণ্য</h3>
              {topProducts.length === 0 ? <p className="text-sm text-gray-400">তথ্য নেই</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b"><th className="pb-1">পণ্য</th><th className="pb-1">পরিমাণ</th><th className="pb-1">বিক্রয়</th></tr></thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5">{p.product?.name}</td>
                        <td className="py-1.5">{Number(p._sum.quantity)} {p.product?.unit}</td>
                        <td className="py-1.5 font-medium text-blue-700">৳{Number(p._sum.totalPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Customer dues */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">💳 বাকির তালিকা</h3>
              {dues.length === 0 ? <p className="text-sm text-gray-400">কোনো বাকি নেই</p> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b"><th className="pb-1">কাস্টমার</th><th className="pb-1">মোবাইল</th><th className="pb-1">বাকি</th></tr></thead>
                  <tbody>
                    {dues.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-1.5">{c.name}</td>
                        <td className="py-1.5 text-gray-500">{c.phone || '—'}</td>
                        <td className="py-1.5 font-medium text-red-600">৳{Number(c.currentBalance).toLocaleString()}</td>
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
              <h3 className="font-semibold text-gray-700 mb-3">🏢 শাখাভিত্তিক বিক্রয়</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">শাখা</th><th className="pb-2">বিক্রয়</th><th className="pb-2">আদায়</th><th className="pb-2">বাকি</th><th className="pb-2">লেনদেন</th>
                  </tr>
                </thead>
                <tbody>
                  {branchReport.map((b) => (
                    <tr key={b.branch.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{b.branch.name}</td>
                      <td className="py-2">৳{Number(b.totalSales).toLocaleString()}</td>
                      <td className="py-2 text-green-600">৳{Number(b.totalPaid).toLocaleString()}</td>
                      <td className="py-2 text-red-600">৳{Number(b.totalDue).toLocaleString()}</td>
                      <td className="py-2 text-gray-500">{b.salesCount} টি</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
