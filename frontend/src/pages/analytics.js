import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, TrendingUp, Lightbulb, Brain } from 'lucide-react';

export default function AnalyticsPage() {
  const [spending, setSpending] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sp, an, pr, rc] = await Promise.allSettled([
          api.get('/api/analytics/spending'),
          api.get('/api/analytics/anomalies'),
          api.get('/api/analytics/predictions'),
          api.get('/api/analytics/recommendations'),
        ]);
        if (sp.status === 'fulfilled') setSpending(sp.value.data.data);
        if (an.status === 'fulfilled') setAnomalies(an.value.data.data);
        if (pr.status === 'fulfilled') setPredictions(pr.value.data.data);
        if (rc.status === 'fulfilled') setRecommendations(rc.value.data.data);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <Head><title>Analytics — ExpensePilot</title></Head>
      <h1 className="text-3xl font-bold text-white mb-8">Smart Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Pattern */}
        {spending?.weeklyPattern && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-brand-400" />Weekly Spending Pattern</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(spending.weeklyPattern).map(([day, avg]) => ({ day: day.slice(0, 3), avg }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12, color: '#e2e8f0' }} formatter={v => [`$${v.toFixed(2)}`, 'Avg']} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Predictions */}
        {predictions?.predictions?.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" />Spending Forecast</h2>
            <p className="text-xs text-slate-400 mb-4">Confidence: {predictions.confidence}% · Trend: {predictions.trend}</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={predictions.predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 12, color: '#e2e8f0' }} formatter={v => [`$${v}`, 'Predicted']} />
                <Line type="monotone" dataKey="predicted" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Anomalies */}
      {anomalies?.anomalies?.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" />Anomalies Detected ({anomalies.totalFlagged})</h2>
          <div className="space-y-3">
            {anomalies.anomalies.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div>
                  <p className="text-sm text-white font-medium">${a.amount.toFixed(2)} — {a.category}</p>
                  <p className="text-xs text-slate-400">{a.date} · {a.reason}</p>
                </div>
                <span className="text-xs font-mono text-amber-400">z={a.zScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations?.recommendations?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-green-400" />Recommendations</h2>
          {recommendations.totalPotentialSavings > 0 && (
            <p className="text-sm text-green-400 mb-4 flex items-center gap-2"><Brain className="w-4 h-4" />Potential savings: ${recommendations.totalPotentialSavings}/month</p>
          )}
          <div className="space-y-3">
            {recommendations.recommendations.map((r, i) => (
              <div key={i} className={`p-4 rounded-xl border ${r.priority === 'high' ? 'bg-red-500/5 border-red-500/15' : r.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/15' : 'bg-green-500/5 border-green-500/15'}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${r.priority === 'high' ? 'bg-red-500/15 text-red-400' : r.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/15 text-green-400'}`}>{r.priority}</span>
                  <p className="text-sm text-slate-300">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback when intelligence service is down */}
      {!spending && !anomalies && !predictions && !recommendations && (
        <div className="card p-8 text-center text-slate-400">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Analytics service is currently unavailable. Add more expenses and try again later.</p>
        </div>
      )}
    </Layout>
  );
}
