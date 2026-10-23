'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Language } from '@/lib/types';
import { formatMonthLabel } from '@/lib/i18n';
import { AppUser } from '@/lib/mongo-client';

interface HeaderBarProps {
  lang: Language;
  onToggleLang: () => void;
  messId: string;
  messName: string;
  isManager: boolean;
  isMonthLocked: boolean;
  monthKey: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleMonthLock: () => void;
  onOpenMessSwitcher: () => void;
  isOnlineSynced: boolean;
  currentUser: AppUser | null;
  onOpenLogin: () => void;
  onOpenUserManagement: () => void;
  onSignOut: () => void;
  activeTab: string;
  onSelectTab: (tab: 'home' | 'meals' | 'expenses' | 'deposits' | 'reports') => void;
}

export function HeaderBar({
  lang,
  onToggleLang,
  messId,
  messName,
  isManager,
  isMonthLocked,
  monthKey,
  onPrevMonth,
  onNextMonth,
  onToggleMonthLock,
  onOpenMessSwitcher,
  isOnlineSynced,
  currentUser,
  onOpenLogin,
  onOpenUserManagement,
  onSignOut,
  activeTab,
  onSelectTab,
}: HeaderBarProps) {
  const navItems: Array<{
    id: 'home' | 'meals' | 'expenses' | 'deposits' | 'reports';
    labelBn: string;
    labelEn: string;
  }> = [
    { id: 'home', labelBn: 'হোম', labelEn: 'Home' },
    { id: 'meals', labelBn: 'মিল এন্ট্রি', labelEn: 'Daily Meals' },
    { id: 'expenses', labelBn: 'খরচ ও বাজার', labelEn: 'Expenses' },
    { id: 'deposits', labelBn: 'জমা এন্ট্রি', labelEn: 'Deposits' },
    { id: 'reports', labelBn: 'রিপোর্ট ও মেম্বার', labelEn: 'Reports & Members' },
  ];

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;

  return (
    <header className="sticky top-0 z-30 bg-[#173125] text-white border-b border-[#438A53]/30 no-print">
      {/* Main Top Navigation Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#438A53] flex items-center justify-center text-[#FED24F] shrink-0">
            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                {lang === 'bn' ? 'মেস হিসাব' : 'Mess Manager'}
              </span>
              <span className="hidden md:inline text-xs text-[#B2D959] font-medium whitespace-nowrap truncate">
                · {messName} ({messId})
              </span>
            </div>
            <p className="text-[11px] text-white/70 whitespace-nowrap truncate hidden sm:block">
              {currentUser
                ? `${currentUser.name} (${currentUser.role}) · MongoDB Atlas Connected`
                : lang === 'bn'
                  ? 'লগইন করে মেসের হিসাব পরিচালনা করুন'
                  : 'Login to manage mess accounts'}
            </p>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav
          aria-label="Main Navigation"
          className="hidden lg:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`py-2 px-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                  active
                    ? 'border-[#FED24F] text-[#FED24F] font-semibold'
                    : 'border-transparent text-white/80 hover:text-white'
                }`}
              >
                {lang === 'bn' ? item.labelBn : item.labelEn}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Controls (User Management, Auth, Language) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* User Management Button for Super Admin or Admin */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenUserManagement}
              className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition border border-amber-500/30 shadow-sm"
              title={lang === 'bn' ? 'ইউজার ও রোল পরিচালনা' : 'Manage Users & Permissions'}
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'bn' ? 'ইউজার লিস্ট' : 'Users'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenMessSwitcher}
            className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            title={lang === 'bn' ? 'মেস কোড সেটিংস' : 'Mess Code Settings'}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#FED24F]" />
            <span className="hidden xs:inline sm:inline">
              {currentUser?.role === 'SUPER_ADMIN'
                ? 'Super Admin'
                : isManager
                  ? (lang === 'bn' ? 'ম্যানেজার' : 'Manager')
                  : (lang === 'bn' ? 'মেম্বার' : 'Member')}
            </span>
            <span className="text-[#B2D959] font-numeric font-bold">{messId}</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#438A53]/40 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-medium text-[#B2D959] flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              title={`Logged in as ${currentUser.username} (${currentUser.role}) - Click to Sign Out`}
            >
              <Database className="w-3.5 h-3.5 text-[#7EC151]" />
              <span className="hidden sm:inline">@{currentUser.username}</span>
              <LogOut className="w-3.5 h-3.5 opacity-80" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="min-h-[38px] sm:min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#FED24F] hover:bg-[#FED24F]/90 text-[#173125] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগইন' : 'Login'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleLang}
            aria-label={lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-[#B2D959]" />
            <span>{lang === 'bn' ? 'EN' : 'বাংলা'}</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Month Selector & Realtime Sync Status */}
      <div className="bg-[#12271D] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
          {/* Month Navigator */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label={lang === 'bn' ? 'পূর্ববর্তী মাস' : 'Previous Month'}
              className="min-h-[34px] min-w-[34px] rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 sm:px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-[#FED24F] whitespace-nowrap">
              {formatMonthLabel(monthKey, lang)}
            </div>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label={lang === 'bn' ? 'পরবর্তী মাস' : 'Next Month'}
              className="min-h-[34px] min-w-[34px] rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right status & Month Lock button */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs min-w-0">
            <span className="text-white/75 hidden md:flex items-center gap-1.5 whitespace-nowrap">
              {isOnlineSynced ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7EC151]" />
                  <span>
                    {lang === 'bn'
                      ? 'MongoDB Atlas রিয়েল-টাইম সংযুক্ত'
                      : 'MongoDB Atlas Real-time Connected'}
                  </span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'bn' ? 'ডাটাবেজ সিঙ্ক হচ্ছে...' : 'Database Syncing...'}</span>
                </>
              )}
            </span>

            {isManager && (
              <button
                type="button"
                onClick={onToggleMonthLock}
                className={`min-h-[34px] px-2.5 sm:px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-colors whitespace-nowrap ${
                  isMonthLocked
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-[#FED24F]/20 text-[#FED24F] border border-[#FED24F]/40 hover:bg-[#FED24F]/30'
                }`}
              >
                {isMonthLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'মাস বন্ধ আছে' : 'Month Closed'}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'চলতি মাস উন্মুক্ত' : 'Month Open'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
