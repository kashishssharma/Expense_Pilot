import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, Lightbulb, LogOut, TrendingUp } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/insights', label: 'Financial Insights', icon: Lightbulb },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-surface-900/80 border-r border-slate-700/40 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">ExpensePilot</span>
          </div>

          {/* Welcome User Card */}
          <div className="mb-6 p-3 rounded-xl bg-surface-800/80 border border-slate-700/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-slate-400 tracking-wide">Welcome,</div>
              <div className="text-sm font-semibold text-slate-100 truncate" title={user.name || 'User'}>
                {user.name || 'User'}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20 shadow-sm'
                      : 'text-slate-400 hover:bg-surface-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sign Out */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
