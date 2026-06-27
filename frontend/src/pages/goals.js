import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trophy, Trash2, Edit2, TrendingUp, Calendar, Target, PiggyBank, CheckCircle2, Sparkles, Clock, Coins, AlertCircle } from 'lucide-react';

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
      const { data } = await api.get('/api/goals');
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
        await api.put(`/api/goals/${editingId}`, formData);
        toast.success('Goal updated!');
      } else {
        await api.post('/api/goals', formData);
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

  const handleFund = async (e, goal, amountToAdd = null) => {
    if (e) e.preventDefault();
    
    const value = amountToAdd !== null ? amountToAdd : fundAmount;
    if (!value || isNaN(value) || Number(value) <= 0) return toast.error('Enter a valid amount');
    
    const newCurrent = Number(goal.current_amount) + Number(value);
    try {
      await api.put(`/api/goals/${goal.id}`, {
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: newCurrent,
        target_date: goal.target_date
      });
      toast.success(`Added $${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2})} to ${goal.name}!`);
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
      await api.delete(`/api/goals/${id}`);
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

  const getDaysLeft = (targetDate) => {
    if (!targetDate) return null;
    const diffTime = new Date(targetDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return '1 day left';
    if (diffDays > 30) {
      const months = Math.round(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} left`;
    }
    return `${diffDays} days left`;
  };

  // Stats Calculations
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const completedCount = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;
  const activeCount = goals.length - completedCount;
  const overallPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Head><title>Savings Goals — ExpensePilot</title></Head>
      
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Savings Goals</h1>
            <p className="text-slate-400">Define your targets and track your pathway to financial freedom.</p>
          </div>
          <button 
            onClick={() => { 
              setShowForm(!showForm); 
              setEditingId(null); 
              setFormData({ name: '', target_amount: '', current_amount: '0', target_date: '' }); 
            }}
            className="btn-primary flex items-center gap-2 group shadow-brand-500/20"
          >
            {showForm ? 'Cancel' : (
              <>
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                <span>New Goal</span>
              </>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        {goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-up">
            {/* Card 1: Total Progress */}
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-cyan-400" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Saved</p>
                  <p className="text-2xl font-extrabold text-white">${totalSaved.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  <p className="text-xs text-slate-400 mt-1">of ${totalTarget.toLocaleString()} combined target ({overallPercentage}%)</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/10">
                  <PiggyBank className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="w-full bg-slate-850 rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-gradient-to-r from-brand-500 to-cyan-400 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${overallPercentage}%` }} />
              </div>
            </div>

            {/* Card 2: Active Targets */}
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Targets</p>
                  <p className="text-2xl font-extrabold text-white">{activeCount}</p>
                  <p className="text-xs text-slate-400 mt-1">Goals currently in progress</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Card 3: Completed */}
            <div className="card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Goals Achieved</p>
                  <p className="text-2xl font-extrabold text-white">{completedCount}</p>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Celebrating success!</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Form Card */}
        {showForm && (
          <div className="card p-6 border border-brand-500/20 shadow-2xl shadow-brand-950/20 animate-slide-up">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>{editingId ? 'Modify Goal Parameters' : 'Establish a New Savings Target'}</span>
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goal Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" placeholder="e.g., Tesla Down Payment" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Amount ($)</label>
                <input required type="number" step="0.01" min="1" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} className="input" placeholder="5,000.00" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Saved ($)</label>
                <input required type="number" step="0.01" min="0" value={formData.current_amount} onChange={e => setFormData({...formData, current_amount: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Date (Optional)</label>
                <input type="date" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} className="input" />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Dismiss
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Save Parameters' : 'Launch Target'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals List Grid */}
        {goals.length === 0 && !showForm ? (
          <div className="text-center py-24 card flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-6 shadow-xl">
              <Trophy className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">No savings targets created</h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              Defining targets improves budget success. Set up your first goal to track your progress!
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary mt-6 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(g => {
              const target = Number(g.target_amount);
              const current = Number(g.current_amount);
              const percent = Math.min(Math.round((current / target) * 100), 100);
              const completed = current >= target;
              const daysLeftText = getDaysLeft(g.target_date);

              return (
                <div 
                  key={g.id} 
                  className={`card-hover p-6 relative overflow-hidden group border transition-all duration-300 ${
                    completed 
                      ? 'border-emerald-500/20 hover:border-emerald-500/40 shadow-lg shadow-emerald-950/10' 
                      : 'border-slate-700/40 hover:border-slate-600/60'
                  }`}
                >
                  {/* Top Glowing Edge Bar */}
                  <div className={`absolute top-0 left-0 h-1 transition-all duration-1000 ease-out ${
                    completed 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] w-full' 
                      : 'bg-gradient-to-r from-brand-500 to-cyan-400 w-full'
                  }`} style={{ width: `${percent}%` }} />
                  
                  {/* Goal Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        completed 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      }`}>
                        {completed ? <CheckCircle2 className="w-6 h-6 animate-pulse" /> : <Target className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{g.name}</h3>
                        {g.target_date && (
                          <div className={`flex items-center gap-1.5 text-xs mt-1.5 ${
                            daysLeftText === 'Overdue' 
                              ? 'text-red-400 font-semibold' 
                              : 'text-slate-400'
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Target: {new Date(g.target_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                            {daysLeftText && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                daysLeftText === 'Overdue' 
                                  ? 'bg-red-500/10 text-red-400' 
                                  : daysLeftText.includes('day') 
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-slate-800 text-slate-300'
                              }`}>{daysLeftText}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Hover edit and delete buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => openEdit(g)} className="p-2 bg-surface-700/50 hover:bg-surface-700 text-slate-400 hover:text-white rounded-lg transition-colors" title="Edit goal"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteGoal(g.id)} className="p-2 bg-surface-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors" title="Delete goal"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Funding stats values */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className="text-3xl font-extrabold text-white tracking-tight">
                        ${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs font-medium text-slate-400 mt-1">
                        accumulated of <span className="text-slate-300 font-semibold">${target.toLocaleString()}</span> target
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-extrabold ${completed ? 'text-emerald-400' : 'text-brand-400'}`}>{percent}%</div>
                    </div>
                  </div>

                  {/* Sleek inline progress bar */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/10 mb-6">
                    <div className={`h-2 rounded-full transition-all duration-1000 ${
                      completed 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                        : 'bg-gradient-to-r from-brand-500 to-cyan-400'
                    }`} style={{ width: `${percent}%` }} />
                  </div>

                  {/* Fund Actions Block */}
                  {fundingId === g.id ? (
                    <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 animate-slide-up space-y-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contribution Amount</p>
                      
                      {/* Predefined Quick contribution buttons */}
                      <div className="flex flex-wrap gap-2">
                        {[10, 50, 100, 500].map(val => (
                          <button 
                            key={val} 
                            type="button" 
                            onClick={() => handleFund(null, g, val)}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-surface-700 hover:bg-brand-600 hover:text-white transition-all text-slate-300 border border-slate-600/30"
                          >
                            +${val}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={(e) => handleFund(e, g)} className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                          <input 
                            type="number" step="0.01" min="0.01" autoFocus
                            value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                            className="input pl-7 py-2"
                            placeholder="Custom amount..."
                          />
                        </div>
                        <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all">
                          Add
                        </button>
                        <button type="button" onClick={() => {setFundingId(null); setFundAmount('');}} className="btn-secondary py-2">
                          Cancel
                        </button>
                      </form>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setFundingId(g.id); setFundAmount(''); }}
                      disabled={completed}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border ${
                        completed 
                          ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20 cursor-default' 
                          : 'bg-surface-800 hover:bg-brand-600/10 hover:text-brand-400 hover:border-brand-500/30 text-slate-300 border-slate-700/50'
                      }`}
                    >
                      {completed ? (
                        <>
                          <Trophy className="w-4 h-4 animate-bounce" />
                          <span>Goal Completed!</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 text-brand-500 group-hover:animate-pulse" />
                          <span>Contribute Funds</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
