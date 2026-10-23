'use client';

import React, { useState } from 'react';
import { LogIn, KeyRound, User, Lock, AlertCircle } from 'lucide-react';
import { loginUser, AppUser } from '@/lib/mongo-client';

interface MongoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  lang: 'bn' | 'en';
}

export function MongoLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
}: MongoLoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError(lang === 'bn' ? 'ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন' : 'Please provide username and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await loginUser(identifier, password);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'bn' ? 'মেস ম্যানেজার লগইন' : 'Mess Manager Login'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'bn' ? 'সরাসরি ইউজার আইডি দিয়ে লগইন করুন' : 'Sign in with your user credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {lang === 'bn' ? 'ইউজারনেম অথবা ইমেইল' : 'Username or Email'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or your_username"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm text-white rounded-xl pl-9 pr-3 py-2.5 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm text-white rounded-xl pl-9 pr-3 py-2.5 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/40"
            >
              <LogIn className="w-4 h-4" />
              {loading
                ? (lang === 'bn' ? 'লগইন হচ্ছে...' : 'Signing in...')
                : (lang === 'bn' ? 'লগইন করুন' : 'Sign In')}
            </button>
          </div>

          <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">
              🔑 {lang === 'bn' ? 'ডিফল্ট সুপার এডমিন অ্যাক্সেস:' : 'Default Super Admin Access:'}
            </p>
            <p>Username: <code className="text-emerald-400">admin</code></p>
            <p>Password: <code className="text-emerald-400">admin123</code></p>
            <p className="text-[10px] text-slate-500 mt-1">
              {lang === 'bn'
                ? '* লগইন করার পর ইউজার ম্যানেজমেন্ট প্যানেল থেকে পাসওয়ার্ড পরিবর্তন করে নিতে পারবেন।'
                : '* You can change this password after logging in from User Management.'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

