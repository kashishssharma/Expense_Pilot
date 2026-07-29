import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, TrendingUp, TrendingDown, ShoppingBag, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ov, bg] = await Promise.all([
          api.get('/api/analytics/overview'),
          api.get('/api/budgets'),
        ]);
        setOverview(ov.data.data);
        setBudgets(bg.data.data);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  const o = overview || {};
  const change = o.changePercent || 0;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

      {/* ─── Stat Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={IndianRupee} label="This Month" value={`₹${(o.currentMonth?.total || 0).toLocaleString()}`} sub={`${Math.abs(change)}% ${change >= 0 ? 'more' : 'less'} than last month`} trend={change >= 0 ? 'up' : 'down'} color="brand" />
        <StatCard icon={ShoppingBag} label="Transactions" value={o.currentMonth?.transactionCount || 0} sub="This month" color="cyan" />
        <StatCard icon={TrendingUp} label="Top Category" value={o.topCategory?.category || '—'} sub={o.topCategory && o.topCategory.total ? `₹${parseFloat(o.topCategory.total).toLocaleString()}` : ''} color="violet" />
        <StatCard icon={TrendingDown} label="Last Month" value={`₹${(o.lastMonth?.total || 0).toLocaleString()}`} sub="Previous period" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ─── Monthly Trend Chart ───────────────────── */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Spending</h2>
          {o.monthlyTrend?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={o.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12, color: '#e2e8f0' }} formatter={v => [`₹${v}`, 'Spent']} />
                <Bar dataKey="total" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-16">No data yet. Add some expenses!</p>}
        </div>

        {/* ─── Category Pie Chart ────────────────────── */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">By Category</h2>
          {o.categoryBreakdown?.length ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={280}>
                <PieChart>
                  <Pie data={o.categoryBreakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}>
                    {o.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12, color: '#e2e8f0' }} formatter={v => `₹${v}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm flex-1">
                {o.categoryBreakdown.slice(0, 6).map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-300">{c.category}</span>
                    </div>
                    <span className="text-slate-400">₹{parseFloat(c.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-slate-400 text-center py-16">No data yet</p>}
        </div>
      </div>

      {/* ─── Budget Progress ────────────────────────── */}
      {budgets.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Budget Progress</h2>
          <div className="space-y-4">
            {budgets.map(b => (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{b.category}</span>
                  <span className={b.status === 'exceeded' ? 'text-red-400' : b.status === 'warning' ? 'text-amber-400' : 'text-green-400'}>
                    ₹{b.currentSpent.toLocaleString()} / ₹{b.monthlyLimit.toLocaleString()} ({b.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${b.status === 'exceeded' ? 'bg-red-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(b.percentage, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Recent Expenses ────────────────────────── */}
      {o.recentExpenses?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Expenses</h2>
          <div className="space-y-3">
            {o.recentExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">{e.category}</p>
                  <p className="text-xs text-slate-400">{e.notes || 'No notes'} · {new Date(e.date).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-semibold text-white">₹{parseFloat(e.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend, color }) {
  const colors = { brand: 'from-brand-600 to-brand-400', cyan: 'from-cyan-600 to-cyan-400', violet: 'from-violet-600 to-violet-400', amber: 'from-amber-600 to-amber-400' };
  return (
    <div className="card p-5 relative overflow-hidden animate-slide-up">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors[color]}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-red-400" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-green-400" />}
            {sub}
          </p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center opacity-80`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
