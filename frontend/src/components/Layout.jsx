import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  HomeIcon, ShoppingCartIcon, CubeIcon, UsersIcon,
  ChartBarIcon, ArrowRightOnRectangleIcon, BuildingStorefrontIcon,
  TruckIcon, BanknotesIcon, Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'ড্যাশবোর্ড', icon: HomeIcon, roles: ['super_admin', 'branch_manager', 'cashier'] },
  { to: '/pos', label: 'বিক্রয়', icon: ShoppingCartIcon, roles: ['super_admin', 'branch_manager', 'cashier'] },
  { to: '/products', label: 'পণ্য', icon: CubeIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/inventory', label: 'স্টক', icon: BuildingStorefrontIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/customers', label: 'কাস্টমার', icon: UsersIcon, roles: ['super_admin', 'branch_manager', 'cashier'] },
  { to: '/purchases', label: 'মাল কেনা', icon: TruckIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/expenses', label: 'খরচ', icon: BanknotesIcon, roles: ['super_admin', 'branch_manager'] },
  { to: '/reports', label: 'রিপোর্ট', icon: ChartBarIcon, roles: ['super_admin', 'branch_manager'] },
];

const bottomPrimary = ['/', '/pos', '/customers', '/reports'];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const visible = navItems.filter((n) => n.roles.includes(user?.role));
  const bottomItems = visible.filter((n) => bottomPrimary.includes(n.to));
  const drawerItems = visible.filter((n) => !bottomPrimary.includes(n.to));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFF8F5' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col shrink-0"
        style={{ background: '#FFFFFF', borderRight: '1px solid #F3F4F6' }}>
        <div className="px-4 py-5" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              🛒
            </div>
            <div>
              <h1 className="font-bold text-sm text-gray-900">POS সিস্টেম</h1>
              <p className="text-xs text-gray-400">{user?.branch?.name || 'সব শাখা'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          <p className="px-4 text-xs font-semibold uppercase tracking-widest mb-1 text-gray-400">মেনু</p>
          {visible.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid #F3F4F6' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-xs w-full px-3 py-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            লগআউট
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              🛒
            </div>
            <span className="font-bold text-gray-900 text-sm">POS সিস্টেম</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {drawerItems.length > 0 && (
              <button onClick={() => setDrawerOpen(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100">
                <Bars3Icon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-6">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: '#FFFFFF', borderTop: '1px solid #F3F4F6' }}>
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        {drawerItems.length > 0 && (
          <button onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5">
            <div className="p-1.5 rounded-xl">
              <Bars3Icon className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-xs font-medium text-gray-400">আরো</span>
          </button>
        )}
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #F3F4F6' }}>
              <p className="font-semibold text-gray-800">মেনু</p>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {drawerItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'}`
                  }>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
            <div className="p-3 pb-8">
              <button onClick={() => { handleLogout(); setDrawerOpen(false); }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium w-full text-red-500 hover:bg-red-50">
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                লগআউট — {user?.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
