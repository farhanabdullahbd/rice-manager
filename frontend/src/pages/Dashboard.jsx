import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#c9a0a0' }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#d4af37' }}>
            ৳{Number(value || 0).toLocaleString()}
          </p>
        </div>
        <div className="text-2xl opacity-80">{icon}</div>
      </div>
      <div className="mt-3 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
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
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-3">⏳</div>
        <p style={{ color: '#c9a0a0' }}>লোড হচ্ছে...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#d4af37' }}>ড্যাশবোর্ড</h2>
          <p className="text-sm mt-0.5" style={{ color: '#c9a0a0' }}>
            {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-3xl">📊</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="আজকের বিক্রয়" value={summary?.totalSales} icon="💰" color="#d4af37" />
        <StatCard label="নগদ আদায়" value={summary?.totalPaidAmount} icon="✅" color="#16a34a" />
        <StatCard label="মোট বাকি" value={summary?.totalDueAmount} icon="⚠️" color="#dc2626" />
        <StatCard label="নিট লাভ" value={summary?.netProfit} icon="📈" color="#a855f7" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span>
            <h3 className="font-semibold" style={{ color: '#d4af37' }}>কম স্টক পণ্য</h3>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm" style={{ color: '#c9a0a0' }}>সব পণ্যের স্টক ঠিক আছে</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left">পণ্য</th>
                  <th className="table-header text-right">স্টক</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((i) => (
                  <tr key={i.id} className="table-row">
                    <td className="py-2.5" style={{ color: '#f5e6e0' }}>{i.product.name}</td>
                    <td className="py-2.5 text-right font-medium" style={{ color: '#f87171' }}>
                      {Number(i.quantity)} {i.product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer Dues */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💳</span>
            <h3 className="font-semibold" style={{ color: '#d4af37' }}>বাকির তালিকা</h3>
          </div>
          {dues.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm" style={{ color: '#c9a0a0' }}>কোনো বাকি নেই</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header text-left">কাস্টমার</th>
                  <th className="table-header text-right">বাকি</th>
                </tr>
              </thead>
              <tbody>
                {dues.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td className="py-2.5" style={{ color: '#f5e6e0' }}>{c.name}</td>
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
    </div>
  );
}
