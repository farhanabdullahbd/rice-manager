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
  { to: '/products', label: 'পণ্য', icon: CubeIcon, roles: ['super_admin', 'branch_manager'] },
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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-blue-900 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-blue-800">
          <h1 className="text-lg font-bold">🛒 POS সিস্টেম</h1>
          <p className="text-xs text-blue-300 mt-0.5">{user?.branch?.name || 'সব শাখা'}</p>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {visible.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800">
          <p className="text-xs text-blue-300 mb-1">{user?.name}</p>
          <p className="text-xs text-blue-400 mb-3 capitalize">{user?.role?.replace('_', ' ')}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-blue-300 hover:text-white">
            <ArrowRightOnRectangleIcon className="w-4 h-4" /> লগআউট
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
