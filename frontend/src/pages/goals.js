import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trophy, Trash2, Edit2, TrendingUp, Calendar, ArrowRight } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', target_amount: '', current_amount: '0', target_date: '' });
  const [editingId, setEditingId] = useState(null);

  // Add Funds state
  const [fundingId, setFundingId] = useState(null);
  const [fundAmount, setFundAmount] = useState('');

  const fetchGoals = async () => {
    try {
      const { data } = await api.get('/goals');
      setGoals(data.data);
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/goals/${editingId}`, formData);
        toast.success('Goal updated!');
      } else {
        await api.post('/goals', formData);
        toast.success('Goal created!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', target_amount: '', current_amount: '0', target_date: '' });
      fetchGoals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleFund = async (e, goal) => {
    e.preventDefault();
    if (!fundAmount || isNaN(fundAmount) || Number(fundAmount) <= 0) return toast.error('Enter a valid amount');
    
    const newCurrent = Number(goal.current_amount) + Number(fundAmount);
    try {
      await api.put(`/goals/${goal.id}`, { ...goal, current_amount: newCurrent });
      toast.success(`Added $${fundAmount} to ${goal.name}!`);
      setFundingId(null);
      setFundAmount('');
      fetchGoals();
    } catch (error) {
      toast.error('Failed to add funds');
    }
  };

  const deleteGoal = async (id) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      fetchGoals();
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const openEdit = (g) => {
    setFormData({
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      target_date: g.target_date ? g.target_date.split('T')[0] : ''
    });
    setEditingId(g.id);
    setShowForm(true);
  };

  if (loading) return <Layout><div className="flex h-full items-center justify-center text-brand-400">Loading goals...</div></Layout>;

  return (
    <Layout>
      <Head><title>Goals - Expense Pilot</title></Head>
      
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Savings Goals</h1>
            <p className="text-slate-400">Set targets and track your progress to financial freedom.</p>
          </div>
          <button 
            onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ name: '', target_amount: '', current_amount: '0', target_date: '' }); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium transition-all shadow-lg shadow-brand-500/20"
          >
            {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> New Goal</>}
          </button>
        </div>

        {showForm && (
          <div className="glass-panel p-6 border border-brand-500/30 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-semibold text-white mb-4">{editingId ? 'Edit Goal' : 'Create a New Goal'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Goal Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-surface-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="e.g. Dream Vacation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Amount ($)</label>
                <input required type="number" step="0.01" min="1" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} className="w-full bg-surface-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" placeholder="5000.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Current Saved ($)</label>
                <input required type="number" step="0.01" min="0" value={formData.current_amount} onChange={e => setFormData({...formData, current_amount: e.target.value})} className="w-full bg-surface-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Date (Optional)</label>
                <input type="date" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} className="w-full bg-surface-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
                <button type="submit" className="px-6 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-colors">
                  {editingId ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {goals.length === 0 && !showForm ? (
          <div className="text-center py-20 glass-panel">
            <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300">No goals set up yet</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">Having a clear target helps you save more effectively. Let's create your first savings goal!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map(g => {
              const target = Number(g.target_amount);
              const current = Number(g.current_amount);
              const percent = Math.min(Math.round((current / target) * 100), 100);
              const completed = current >= target;

              return (
                <div key={g.id} className="glass-panel p-6 relative overflow-hidden group">
                  {/* Background progress indicator */}
                  <div className="absolute top-0 left-0 h-1 bg-surface-800 w-full" />
                  <div className={`absolute top-0 left-0 h-1 transition-all duration-1000 ease-out ${completed ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-brand-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`} style={{ width: `${percent}%` }} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/20 text-brand-400'}`}>
                        {completed ? <Trophy className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{g.name}</h3>
                        {g.target_date && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Target: {new Date(g.target_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(g)} className="p-2 bg-surface-800 hover:bg-surface-700 text-slate-400 hover:text-white rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteGoal(g.id)} className="p-2 bg-surface-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold text-white tracking-tight">
                        ${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        of ${target.toLocaleString()} goal
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${completed ? 'text-emerald-400' : 'text-brand-400'}`}>{percent}%</div>
                    </div>
                  </div>

                  {fundingId === g.id ? (
                    <form onSubmit={(e) => handleFund(e, g)} className="mt-6 flex gap-3 animate-in fade-in">
                      <input 
                        type="number" step="0.01" min="0.01" autoFocus
                        value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                        className="flex-1 bg-surface-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500"
                        placeholder="Amount to add..."
                      />
                      <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
                        Add
                      </button>
                      <button type="button" onClick={() => {setFundingId(null); setFundAmount('');}} className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 font-medium transition-colors">
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button 
                      onClick={() => { setFundingId(g.id); setFundAmount(''); }}
                      disabled={completed}
                      className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${completed ? 'bg-emerald-500/10 text-emerald-500 cursor-default' : 'bg-surface-800 hover:bg-surface-700 text-slate-200 border border-slate-700 hover:border-slate-600'}`}
                    >
                      {completed ? 'Goal Reached!' : <><TrendingUp className="w-4 h-4" /> Add Funds</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
