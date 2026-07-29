import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { BarChart as BarChartIcon, Lightbulb, PiggyBank, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORY_COLORS = {
  Food: '#3b82f6',
  Housing: '#10b981',
  Entertainment: '#f59e0b',
  Transport: '#8b5cf6',
  Utilities: '#ec4899',
  Shopping: '#06b6d4',
  Other: '#64748b'
};

export default function InsightsPage() {
  const [spending, setSpending] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sp, rc] = await Promise.allSettled([
          api.get('/api/analytics/spending'),
          api.get('/api/insights')
        ]);
        if (sp.status === 'fulfilled') setSpending(sp.value.data.data);
        if (rc.status === 'fulfilled') setInsights(rc.value.data.data);
      } catch (err) {
        console.error('Failed to load insights', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Financial Insights Engine</h1>
        <p className="text-slate-400 text-sm">Deterministic rule-based analysis & actionable spending advice</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Spending Pattern */}
        {spending?.weeklyPattern && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChartIcon className="w-5 h-5 text-brand-400" />
              Weekly Spending Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={Object.entries(spending.weeklyPattern).map(([day, avg]) => ({ day: day.slice(0, 3), avg }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={v => [`₹${v.toFixed(2)}`, 'Avg Spend']}
                />
                <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category Breakdown Table */}
        {spending?.categories?.length > 0 && (
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-cyan-400" />
                Category Concentration
              </h2>
              <div className="space-y-3">
                {spending.categories.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b' }}
                      />
                      <span className="text-sm font-medium text-slate-200">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">{cat.percentage}%</span>
                      <span className="font-semibold text-white w-20 text-right">₹{cat.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
              <span>Total Transactions: {spending.transactionCount}</span>
              <span>Total Monthly: ₹{spending.totalSpent.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Financial Insights Engine */}
      {insights?.insights?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Behavioral Insights & Savings Advice
            </h2>
            {insights.totalPotentialSavings > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <PiggyBank className="w-4 h-4" />
                <span>Potential Savings: ₹{insights.totalPotentialSavings}/mo</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {insights.insights.map((r, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  r.priority === 'high'
                    ? 'bg-red-500/5 border-red-500/20 text-red-200'
                    : r.priority === 'medium'
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                      r.priority === 'high'
                        ? 'bg-red-500/20 text-red-400'
                        : r.priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {r.priority}
                  </span>
                  <p className="text-sm text-slate-300 flex-1 leading-relaxed">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
