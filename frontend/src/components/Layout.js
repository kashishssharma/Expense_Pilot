import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, Receipt, Target, BarChart3, LogOut, TrendingUp, Trophy } from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/goals', label: 'Goals', icon: Trophy },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Layout({ children }) {
  const router = useRouter();
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-surface-900/80 border-r border-slate-700/40 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">ExpensePilot</span>
          </div>
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = router.pathname === href;
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:bg-surface-800 hover:text-slate-200'}`}>
                  <Icon className="w-5 h-5" />{label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-3 px-4 truncate">{user.name || 'User'}</div>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full">
            <LogOut className="w-5 h-5" />Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
