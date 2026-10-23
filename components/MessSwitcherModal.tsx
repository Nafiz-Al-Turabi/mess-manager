'use client';

import React, { useState } from 'react';
import {
  CloudUpload,
  KeyRound,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Language } from '@/lib/types';

interface MessSwitcherModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  messId: string;
  messName: string;
  managerPin: string;
  isManager: boolean;
  onSaveMessSettings: (
    nextMessId: string,
    nextMessName: string,
    nextPin: string
  ) => void;
  onUnlockWithPin: (enteredPin: string) => boolean;
  onSwitchToMemberMode: () => void;
  isOnlineSynced: boolean;
  onForceCloudPush: () => void;
}

export function MessSwitcherModal({
  lang,
  isOpen,
  onClose,
  messId,
  messName,
  managerPin,
  isManager,
  onSaveMessSettings,
  onUnlockWithPin,
  onSwitchToMemberMode,
  isOnlineSynced,
  onForceCloudPush,
}: MessSwitcherModalProps) {
  const [editMessId, setEditMessId] = useState(messId);
  const [editMessName, setEditMessName] = useState(messName);
  const [editPin, setEditPin] = useState(managerPin);
  const [pinAttempt, setPinAttempt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onUnlockWithPin(pinAttempt.trim());
    if (ok) {
      setStatusMessage(
        lang === 'bn'
          ? '✓ ম্যানেজার মোড আনলক হয়েছে!'
          : '✓ Manager Mode Unlocked!'
      );
      setPinAttempt('');
    } else {
      setStatusMessage(
        lang === 'bn'
          ? '✕ ভুল পিন! ডিফল্ট পিন: 16247'
          : '✕ Incorrect PIN! Default PIN is 16247'
      );
    }
  };

  const handleSaveDirectory = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMessSettings(
      editMessId.trim() || '9D',
      editMessName.trim() || '9D',
      editPin.trim() || '16247'
    );
    setStatusMessage(
      lang === 'bn'
        ? '✓ মেস ডিরেক্টরি ও ইনভাইট কোড আপডেট হয়েছে!'
        : '✓ Mess Directory & Invite Code updated!'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#173125] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? 'মেস সুইচার, ইনভাইট কোড ও ম্যানেজার পিন'
                  : 'Mess Switcher, Invite Code & Manager PIN'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'অ্যান্ড্রয়েড অ্যাপের সাথে একসাথে সিঙ্ক করতে একই মেস কোড (যেমন: 9D) ব্যবহার করুন'
                : 'Use the exact same Mess Code (e.g. 9D) to sync live with the Android app'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mess Switcher Modal"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMessage && (
          <p className="text-xs font-semibold text-[#173125] bg-[#B2D959]/30 px-3 py-2 rounded-lg">
            {statusMessage}
          </p>
        )}

        {/* Section 1: Role Switcher (Manager PIN vs Member View) */}
        <div className="p-4 rounded-xl bg-[#F6F8F5] border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#173125]">
                {lang === 'bn' ? 'বর্তমান অ্যাক্সেস রোল:' : 'Current Access Role:'}{' '}
                <span className="text-[#438A53]">
                  {isManager
                    ? lang === 'bn'
                      ? 'ম্যানেজার (Full Control)'
                      : 'Manager (Full Control)'
                    : lang === 'bn'
                      ? 'মেম্বার (View Only)'
                      : 'Member (View Only)'}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? 'ডিফল্ট ম্যানেজার পিন: 16247 অথবা অ্যাডমিন জিমেইল দিয়ে লগইন করুন'
                  : 'Default Manager PIN: 16247 or sign in with Admin Gmail'}
              </p>
            </div>
            {isManager && (
              <button
                type="button"
                onClick={onSwitchToMemberMode}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              >
                {lang === 'bn' ? 'মেম্বার ভিউতে যান' : 'Switch to Member View'}
              </button>
            )}
          </div>

          {!isManager && (
            <form onSubmit={handleVerifyPin} className="flex items-center gap-2">
              <input
                type="password"
                value={pinAttempt}
                onChange={(e) => setPinAttempt(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'ম্যানেজার পিন দিন (16247)'
                    : 'Enter Manager PIN (16247)'
                }
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-numeric"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173125] text-[#FED24F] text-xs font-semibold whitespace-nowrap"
              >
                {lang === 'bn' ? 'আনলক করুন' : 'Unlock Manager'}
              </button>
            </form>
          )}
        </div>

        {/* Section 2: Mess Directory Configuration */}
        <form onSubmit={handleSaveDirectory} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {lang === 'bn'
                  ? 'মেস কোড / ইনভাইট কোড (messId)'
                  : 'Mess ID / Invite Code'}
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={editMessId}
                onChange={(e) => setEditMessId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-numeric font-bold text-[#173125]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {lang === 'bn' ? 'মেসের নাম (messName)' : 'Custom Mess Name'}
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={editMessName}
                onChange={(e) => setEditMessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
          </div>

          {isManager && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {lang === 'bn'
                  ? 'ম্যানেজার পিন পরিবর্তন (৪-১২ অক্ষর)'
                  : 'Manager PIN (4–12 chars)'}
              </label>
              <input
                type="text"
                minLength={4}
                maxLength={12}
                value={editPin}
                onChange={(e) => setEditPin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-numeric"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            {isOnlineSynced ? (
              <button
                type="button"
                onClick={() => {
                  onForceCloudPush();
                  setStatusMessage(
                    lang === 'bn'
                      ? '✓ সব রেকর্ড ফায়ারবেস ক্লাউডে সিঙ্ক করা হয়েছে!'
                      : '✓ All records pushed to Firebase Cloud!'
                  );
                }}
                className="px-3.5 py-2 rounded-lg bg-[#438A53]/15 text-[#173125] hover:bg-[#438A53]/25 text-xs font-semibold flex items-center gap-1.5"
              >
                <CloudUpload className="w-4 h-4 text-[#438A53]" />
                <span>
                  {lang === 'bn'
                    ? 'ক্লাউডে সব ডেটা পুশ করুন'
                    : 'Sync All Local Records to Cloud'}
                </span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#438A53]" />
                {lang === 'bn'
                  ? 'অফলাইন স্টোরেজে স্বয়ংক্রিয়ভাবে সংরক্ষিত'
                  : 'Saved automatically in local storage'}
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold"
              >
                {lang === 'bn' ? 'মেস সেটিংস সেভ' : 'Save Mess Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
