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
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #FFF8F5 0%, #FFEDD5 50%, #FFF7ED 100%)' }}>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            🛒
          </div>
          <h1 className="text-2xl font-bold text-gray-900">POS সিস্টেম</h1>
          <p className="text-sm text-gray-500 mt-1">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl" style={{ border: '1px solid #F3F4F6' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">ইমেইল</label>
              <input className="input" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required placeholder="admin@pos.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">পাসওয়ার্ড</label>
              <input className="input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all shadow-md active:scale-95"
              style={{ background: loading ? '#D1D5DB' : 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          admin@pos.com · admin123
        </p>
      </div>
    </div>
  );
}
