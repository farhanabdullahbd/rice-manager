import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'লগইন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a0005 0%, #2d0009 50%, #1a0005 100%)' }}>

      {/* Decorative circles */}
      <div className="absolute w-96 h-96 rounded-full opacity-10 -top-20 -left-20"
        style={{ background: 'radial-gradient(circle, #8b0022, transparent)' }} />
      <div className="absolute w-64 h-64 rounded-full opacity-10 -bottom-10 -right-10"
        style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />

      <div className="relative w-full max-w-sm mx-4">
        {/* Card */}
        <div className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #2d0009, #1a0005)',
            border: '1px solid #d4af37',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.1)'
          }}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #8b0022, #4a0012)', border: '2px solid #d4af37' }}>
              🛒
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#d4af37' }}>POS সিস্টেম</h1>
            <p className="text-sm mt-1" style={{ color: '#c9a0a0' }}>আপনার অ্যাকাউন্টে লগইন করুন</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#d4af37' }}>
                ইমেইল
              </label>
              <input className="input" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required placeholder="admin@pos.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#d4af37' }}>
                পাসওয়ার্ড
              </label>
              <input className="input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2 shadow-lg"
              style={{
                background: loading ? '#4a0012' : 'linear-gradient(135deg, #d4af37, #b8962e)',
                color: loading ? '#c9a0a0' : '#1a0005',
                border: '1px solid #d4af37'
              }}>
              {loading ? 'অপেক্ষা করুন...' : '✦ লগইন করুন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
