import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon, bg }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: '1px solid #F3F4F6' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: bg }}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">৳{Number(value || 0).toLocaleString()}</p>
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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-center">
        <div className="text-3xl mb-2 animate-pulse">📊</div>
        <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-header">ড্যাশবোর্ড</h2>
        <p className="page-sub">
          {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="আজকের বিক্রয়" value={summary?.totalSales} icon="💰" bg="#FFF7ED" />
        <StatCard label="নগদ আদায়" value={summary?.totalPaidAmount} icon="✅" bg="#F0FDF4" />
        <StatCard label="মোট বাকি" value={summary?.totalDueAmount} icon="⚠️" bg="#FEF2F2" />
        <StatCard label="নিট লাভ" value={summary?.netProfit} icon="📈" bg="#FAF5FF" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">⚠️</div>
            <h3 className="font-semibold text-gray-800">কম স্টক পণ্য</h3>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-sm text-gray-500">সব পণ্যের স্টক ঠিক আছে</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((i) => (
                <div key={i.id} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <span className="text-sm text-gray-800">{i.product.name}</span>
                  <span className="tag text-red-600 bg-red-50">{Number(i.quantity)} {i.product.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Dues */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">💳</div>
            <h3 className="font-semibold text-gray-800">বাকির তালিকা</h3>
          </div>
          {dues.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-sm text-gray-500">কোনো বাকি নেই</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dues.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <span className="text-sm text-gray-800">{c.name}</span>
                  <span className="font-semibold text-red-600 text-sm">৳{Number(c.currentBalance).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
