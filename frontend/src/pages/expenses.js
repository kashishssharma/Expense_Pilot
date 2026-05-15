import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Search, X } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Travel', 'Groceries', 'Rent', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ category: '', search: '', startDate: '', endDate: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' });
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/api/expenses', { params });
      setExpenses(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/expenses/${editing}`, form);
        toast.success('Expense updated');
      } else {
        await api.post('/api/expenses', form);
        toast.success('Expense added');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchExpenses(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await api.delete(`/api/expenses/${id}`); toast.success('Deleted'); fetchExpenses(pagination.page); }
    catch { toast.error('Delete failed'); }
  };

  const startEdit = (exp) => {
    setEditing(exp.id);
    setForm({ amount: exp.amount, category: exp.category, date: exp.date?.split('T')[0], notes: exp.notes || '' });
    setShowForm(true);
  };

  return (
    <Layout>
      <Head><title>Expenses — ExpensePilot</title></Head>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Expenses</h1>
        <button onClick={() => { setEditing(null); setForm({ amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' }); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Search expenses…" className="input pl-10 py-2" />
        </div>
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="input py-2 w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="input py-2 w-40" />
        <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="input py-2 w-40" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40 text-slate-400 text-left">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium">Notes</th>
              <th className="p-4 font-medium text-right">Amount</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No expenses found. Add one!</td></tr>
            ) : expenses.map(exp => (
              <tr key={exp.id} className="border-b border-slate-700/20 hover:bg-surface-800/40 transition-colors">
                <td className="p-4 text-slate-300">{new Date(exp.date).toLocaleDateString()}</td>
                <td className="p-4"><span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-xs font-medium">{exp.category}</span></td>
                <td className="p-4 text-slate-400 truncate max-w-[200px]">{exp.notes || '—'}</td>
                <td className="p-4 text-right font-semibold text-white">${parseFloat(exp.amount).toFixed(2)}</td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(exp)} className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700/40">
            <span className="text-sm text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => fetchExpenses(pagination.page - 1)} disabled={pagination.page <= 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Prev</button>
              <button onClick={() => fetchExpenses(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit' : 'Add'} Expense</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Amount ($)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" placeholder="Optional" />
              </div>
              <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Add'} Expense</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
