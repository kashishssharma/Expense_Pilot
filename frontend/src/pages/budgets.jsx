import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, X } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Travel', 'Groceries', 'Rent', 'Other'];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Food', monthly_limit: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [bRes, sRes] = await Promise.all([api.get('/api/budgets'), api.get('/api/budgets/summary')]);
      setBudgets(bRes.data.data);
      setSummary(sRes.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/budgets', form);
      toast.success('Budget saved');
      setShowForm(false);
      setForm({ category: 'Food', monthly_limit: '' });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/api/budgets/${id}`);
      toast.success('Budget deleted');
      loadData();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Budgets</h1>
          <p className="text-slate-400 text-sm">Monthly spending limits per category</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Set Budget</button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="card p-5">
            <p className="text-sm text-slate-400 mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-white">₹{summary.totalBudget.toLocaleString()}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-400 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-white">₹{summary.totalSpent.toLocaleString()}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-400 mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${summary.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{summary.remaining.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Budget list */}
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">No budgets set. Click "Set Budget" to start!</div>
        ) : budgets.map(b => (
          <div key={b.id} className="card p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-white">{b.category}</h3>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.status === 'exceeded' ? 'bg-red-500/10 text-red-400' : b.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                  {b.status === 'exceeded' ? 'Over Budget' : b.status === 'warning' ? 'Warning' : 'On Track'}
                </span>
                <button onClick={() => handleDelete(b.id)} className="text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>₹{b.currentSpent.toFixed(2)} spent</span>
              <span>₹{b.monthlyLimit.toFixed(2)} limit</span>
            </div>
            <div className="w-full bg-surface-700 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all duration-500 ${b.status === 'exceeded' ? 'bg-red-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(b.percentage, 100)}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right">{b.percentage}%</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">Set Budget</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Monthly Limit (₹)</label>
                <input type="number" step="0.01" min="1" value={form.monthly_limit} onChange={e => setForm({ ...form, monthly_limit: e.target.value })} className="input" required />
              </div>
              <button type="submit" className="btn-primary w-full">Save Budget</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
