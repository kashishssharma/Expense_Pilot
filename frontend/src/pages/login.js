import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { TrendingUp, Eye, EyeOff, BarChart3, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Sign In — ExpensePilot</title></Head>
      <div className="min-h-screen flex">
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-700 via-surface-900 to-surface-950 p-12 flex-col justify-between">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-brand-500 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ExpensePilot</span>
          </div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Take Control of<br /><span className="gradient-text">Your Finances</span>
            </h2>
            <div className="space-y-4">
              {[
                { icon: BarChart3, title: 'Smart Analytics', desc: 'AI-powered spending pattern analysis' },
                { icon: Shield, title: 'Anomaly Detection', desc: 'Automatically flags unusual transactions' },
                { icon: Zap, title: 'Predictive Budget', desc: 'ML-based spending forecasts' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{title}</h3>
                    <p className="text-slate-400 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-slate-500 text-sm">© 2026 ExpensePilot</p>
        </div>

        {/* Right form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface-950">
          <div className="w-full max-w-md animate-fade-in">
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ExpensePilot</span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400 mb-8">Sign in to continue</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pr-12" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-8 text-center text-slate-400">
              No account?{' '}
              <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
