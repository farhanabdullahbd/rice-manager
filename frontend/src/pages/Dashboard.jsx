import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function StatCard({ label, value, color, prefix = '৳' }) {
  return (
    <div className={`card border-l-4 ${color}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{prefix}{Number(value || 0).toLocaleString('bn-BD')}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      api.get(`/reports/summary?from=${today}&to=${today}`),
      api.get('/reports/stock-alert'),
      api.get('/reports/customer-dues'),
    ])
      .then(([s, stock, d]) => {
        setSummary(s.data);
        setLowStock(stock.data.slice(0, 5));
        setDues(d.data.slice(0, 5));
      })
      .catch(() => toast.error('ড্যাশবোর্ড লোড ব্যর্থ'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">আজকের সারসংক্ষেপ</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="মোট বিক্রয়" value={summary?.totalSales} color="border-blue-500" />
        <StatCard label="নগদ আদায়" value={summary?.totalPaidAmount} color="border-green-500" />
        <StatCard label="বাকি" value={summary?.totalDueAmount} color="border-red-500" />
        <StatCard label="নিট লাভ" value={summary?.netProfit} color="border-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">⚠️ কম স্টক পণ্য</h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">সব পণ্যের স্টক ঠিক আছে</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-1">পণ্য</th><th className="pb-1">স্টক</th></tr></thead>
              <tbody>
                {lowStock.map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2">{i.product.name}</td>
                    <td className="py-2 text-red-600 font-medium">{Number(i.quantity)} {i.product.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer Dues */}
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-3">💳 বাকির তালিকা</h3>
          {dues.length === 0 ? (
            <p className="text-sm text-gray-400">কোনো বাকি নেই</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-1">কাস্টমার</th><th className="pb-1">বাকি</th></tr></thead>
              <tbody>
                {dues.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2 text-red-600 font-medium">৳{Number(c.currentBalance).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
