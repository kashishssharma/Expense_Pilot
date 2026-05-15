import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <>
      <Head><title>Create Account — ExpensePilot</title></Head>
      <div className="min-h-screen flex items-center justify-center p-8 bg-surface-950">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ExpensePilot</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-1 text-center">Create Account</h2>
            <p className="text-slate-400 mb-6 text-center">Start tracking smarter</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input id="name" value={form.name} onChange={update('name')} className="input" placeholder="John Doe" required />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input id="reg-email" type="email" value={form.email} onChange={update('email')} className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label htmlFor="reg-pw" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input id="reg-pw" type={showPw ? 'text' : 'password'} value={form.password} onChange={update('password')} className="input pr-12" placeholder="Min 8 characters" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-slate-400">
            Have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
