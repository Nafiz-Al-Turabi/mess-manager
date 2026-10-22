'use client';

import React, { useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  ExternalLink,
  KeyRound,
  LogIn,
  Mail,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { Language } from '@/lib/types';
import {
  AUTHORIZED_DOMAINS_LIST,
  FIREBASE_CONFIG,
  FIRESTORE_DATABASE_ID,
} from '@/lib/firebase';
import { ADMIN_EMAIL } from '@/lib/accounting';

interface CloudAuthModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  authErrorCode: string | null;
  authErrorMessage: string | null;
  onGooglePopupSignIn: () => Promise<void>;
  onEmailPasswordSignIn: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  onAnonymousCloudSignIn: () => Promise<void>;
}

export function CloudAuthModal({
  lang,
  isOpen,
  onClose,
  authErrorCode,
  authErrorMessage,
  onGooglePopupSignIn,
  onEmailPasswordSignIn,
  onAnonymousCloudSignIn,
}: CloudAuthModalProps) {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('Mess9D#2026');
  const [displayName, setDisplayName] = useState('নাফিজ আল তুরাবী (Nafiz)');
  const [busy, setBusy] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentHost =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  const domainsToWhitelist = Array.from(
    new Set([
      'mess-manager-wheat.vercel.app',
      currentHost,
      ...AUTHORIZED_DOMAINS_LIST,
    ])
  );

  const envFileContent = `APP_URL="https://mess-manager-wheat.vercel.app"
NEXT_PUBLIC_APP_URL="https://mess-manager-wheat.vercel.app"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="${FIREBASE_CONFIG.projectId}"
NEXT_PUBLIC_FIREBASE_APP_ID="${FIREBASE_CONFIG.appId}"
NEXT_PUBLIC_FIREBASE_API_KEY="${FIREBASE_CONFIG.apiKey}"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${FIREBASE_CONFIG.authDomain}"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${FIREBASE_CONFIG.storageBucket}"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${FIREBASE_CONFIG.messagingSenderId}"
NEXT_PUBLIC_FIREBASE_DATABASE_ID="${FIRESTORE_DATABASE_ID}"
NEXT_PUBLIC_ADMIN_EMAIL="${ADMIN_EMAIL}"`;

  const copyText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isUnauthorizedDomain =
    authErrorCode === 'auth/unauthorized-domain' ||
    (authErrorMessage || '').includes('auth/unauthorized-domain');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#173125] flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? 'ক্লাউড সিঙ্ক ও সাইন-ইন (Vercel + Localhost + Android)'
                  : 'Cloud Sync & Sign-In (Vercel + Localhost + Android)'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'Firebase প্রজেক্ট: gen-lang-client-0089843448 · অ্যান্ড্রয়েড অ্যাপের সাথে রিয়েল-টাইম সিঙ্ক'
                : 'Firebase Project: gen-lang-client-0089843448 · Real-time sync with Android app'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cloud Auth Modal"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Authorized Domains Setup for Vercel (mess-manager-wheat.vercel.app) & Localhost */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-950">
                {isUnauthorizedDomain || authErrorMessage
                  ? lang === 'bn'
                    ? 'গুগল পপআপ সচল করতে Firebase Authorized Domains-এ আপনার Vercel URL যুক্ত করুন'
                    : 'Add your Vercel URL in Firebase Authorized Domains to enable Google Popup'
                  : lang === 'bn'
                    ? 'গুগল পপআপ লগইন (auth/unauthorized-domain) সমাধান:'
                    : 'Google Popup Domain Whitelist (Vercel & Localhost):'}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {lang === 'bn'
                  ? 'গুগল পপআপ ব্যবহারের জন্য Firebase Console -> Authentication -> Settings -> Authorized domains-এ গিয়ে "Add domain"-এ নিচের ডোমেইনগুলো যুক্ত করুন। অথবা নিচে "১-ক্লিক ডিরেক্ট ক্লাউড সিঙ্ক" বা "ইমেইল লগইন" ব্যবহার করুন যা ডোমেইন ছাড়াই সাথে সাথে কাজ করবে।'
                  : 'To use Google Popup on Vercel, add the domains below in Firebase Console -> Authentication -> Settings -> Authorized domains. Or use 1-Click Instant Cloud Sync / Email Sign-In below immediately.'}
              </p>
            </div>
          </div>

          {/* Domain Copy Chips */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-semibold text-amber-900">
              {lang === 'bn'
                ? 'ক্লিক করে ডোমেইন কপি করুন (Firebase Authorized Domains-এর জন্য):'
                : 'Click to copy domain for Firebase Authorized Domains:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {domainsToWhitelist.map((dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => copyText(dom, dom)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-xs font-numeric font-semibold text-[#173125] flex items-center gap-1.5 transition-colors"
                >
                  <span>{dom}</span>
                  {copiedKey === dom ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1">
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0089843448/authentication/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#173125] text-[#FED24F] text-xs font-semibold hover:bg-[#438A53] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn'
                  ? 'Firebase Console (Authorized Domains) ওপেন করুন'
                  : 'Open Firebase Console (Authorized Domains)'}
              </span>
            </a>
          </div>
        </div>

        {/* 2. Option A: Google Sign-In Popup + Instant 1-Click Cloud Connect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onGooglePopupSignIn();
              } finally {
                setBusy(false);
              }
            }}
            className="p-3.5 rounded-xl bg-[#173125] hover:bg-[#438A53] text-white text-left transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <LogIn className="w-4 h-4 text-[#FED24F]" />
              <span className="text-[10px] text-[#B2D959] font-semibold">
                Google OAuth
              </span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-white">
                {lang === 'bn' ? 'গুগল পপআপ সাইন-ইন' : 'Google Popup Sign-In'}
              </p>
              <p className="text-[11px] text-white/70 mt-0.5">
                {lang === 'bn'
                  ? 'Authorized domain যুক্ত থাকলে ১-ক্লিকে লগইন'
                  : 'Standard Google account popup login'}
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onAnonymousCloudSignIn();
              } finally {
                setBusy(false);
              }
            }}
            className="p-3.5 rounded-xl bg-[#438A53] hover:bg-[#173125] text-white text-left transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <Sparkles className="w-4 h-4 text-[#FED24F]" />
              <span className="text-[10px] text-[#FED24F] font-semibold">
                Works on Any Domain
              </span>
            </div>
            <div className="mt-2">
              <p className="text-sm font-bold text-white">
                {lang === 'bn'
                  ? '১-ক্লিক ডিরেক্ট ক্লাউড সিঙ্ক'
                  : '1-Click Instant Cloud Sync'}
              </p>
              <p className="text-[11px] text-white/80 mt-0.5">
                {lang === 'bn'
                  ? 'ডোমেইন ভেরিফিকেশন ছাড়াই সরাসরি Firestore সিঙ্ক'
                  : 'Bypasses popup domain block & syncs Firestore'}
              </p>
            </div>
          </button>
        </div>

        {/* 3. Option B: Email & Password Cloud Sign-In (Bypasses unauthorized-domain) */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await onEmailPasswordSignIn(
                email.trim(),
                password,
                displayName.trim()
              );
            } finally {
              setBusy(false);
            }
          }}
          className="p-4 rounded-xl bg-[#F6F8F5] border border-slate-200 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#173125] flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? 'ইমেইল ও পাসওয়ার্ড দিয়ে ক্লাউড লগইন (যেসব ডোমেইনে পপআপ ব্লক হয়)'
                  : 'Email & Password Cloud Sign-In (Works on All Domains)'}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {lang === 'bn' ? 'ইমেইল (অ্যাডমিন / মেম্বার)' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {lang === 'bn' ? 'পাসওয়ার্ড (৬+ অক্ষর)' : 'Password (6+ chars)'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-numeric"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={lang === 'bn' ? 'আপনার নাম' : 'Display Name'}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-[#173125] hover:bg-[#438A53] text-[#FED24F] text-xs font-semibold whitespace-nowrap transition-colors"
            >
              {lang === 'bn' ? 'ইমেইল দিয়ে কানেক্ট করুন' : 'Connect via Email'}
            </button>
          </div>
        </form>

        {/* 4. Vercel & Localhost .env Variables Copy Box */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FED24F]">
              <KeyRound className="w-4 h-4" />
              <span>
                {lang === 'bn'
                  ? 'Vercel ও Localhost:3000 এর জন্য .env ফাইল (কি-সহ প্রস্তুত)'
                  : 'Ready-to-Use .env Variables (Vercel & Localhost:3000)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyText(envFileContent, 'env')}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              {copiedKey === 'env' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#7EC151]" />
                  <span>{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#FED24F]" />
                  <span>{lang === 'bn' ? '.env কপি করুন' : 'Copy .env'}</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-[11px] font-numeric text-slate-300 overflow-x-auto leading-relaxed bg-black/40 p-3 rounded-lg">
            {envFileContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
