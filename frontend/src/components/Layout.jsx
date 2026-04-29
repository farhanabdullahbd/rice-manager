import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  HomeIcon, ShoppingCartIcon, CubeIcon, UsersIcon,
  ChartBarIcon, ArrowRightOnRectangleIcon, BuildingStorefrontIcon,
  TruckIcon, BanknotesIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'ড্যাশবোর্ড', icon: HomeIcon, roles: ['super_admin', 'branch_manager', 'cashier'] },
  { to: '/pos', label: 'বিক্রয় (POS)', icon: ShoppingCartIcon, roles: ['super_admin', 'branch_manager', 'cashier'] },
  { to: '/products', label: 'পণ্য তালিকা', icon: CubeIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/inventory', label: 'স্টক', icon: BuildingStorefrontIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/customers', label: 'কাস্টমার', icon: UsersIcon, roles: ['super_admin', 'branch_manager', 'cashier'] },
  { to: '/purchases', label: 'মাল কেনা', icon: TruckIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/expenses', label: 'খরচ', icon: BanknotesIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/reports', label: 'রিপোর্ট', icon: ChartBarIcon, roles: ['super_admin', 'branch_manager'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const visible = navItems.filter((n) => n.roles.includes(user?.role));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#1a0005' }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col shrink-0 shadow-2xl" style={{
        background: 'linear-gradient(180deg, #2d0009 0%, #1a0005 100%)',
        borderRight: '1px solid #4a0012'
      }}>
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: '1px solid #4a0012' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8b0022, #4a0012)', border: '1px solid #d4af37' }}>
              🛒
            </div>
            <div>
              <h1 className="font-bold text-base" style={{ color: '#d4af37' }}>POS সিস্টেম</h1>
              <p className="text-xs" style={{ color: '#c9a0a0' }}>{user?.branch?.name || 'সব শাখা'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#6b0019' }}>মেনু</p>
          {visible.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4" style={{ borderTop: '1px solid #4a0012' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #8b0022, #4a0012)', color: '#d4af37' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#f5e6e0' }}>{user?.name}</p>
              <p className="text-xs capitalize" style={{ color: '#c9a0a0' }}>{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs w-full px-3 py-2 rounded-lg transition-all"
            style={{ color: '#c9a0a0', border: '1px solid #4a0012' }}
            onMouseOver={e => e.currentTarget.style.color = '#d4af37'}
            onMouseOut={e => e.currentTarget.style.color = '#c9a0a0'}>
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            লগআউট
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6" style={{ background: '#1a0005' }}>
        {children}
      </main>
    </div>
  );
}
