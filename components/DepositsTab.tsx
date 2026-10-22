'use client';

import React, { useState } from 'react';
import {
  Edit2,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  DepositRecord,
  Language,
  Member,
  PaymentMethod,
} from '@/lib/types';
import {
  formatCurrency,
  translatePaymentMethod,
} from '@/lib/i18n';

interface DepositsTabProps {
  lang: Language;
  monthKey: string;
  isManager: boolean;
  isMonthLocked: boolean;
  deposits: DepositRecord[];
  members: Member[];
  onSaveDeposit: (deposit: Omit<DepositRecord, 'id'>, existingId?: number) => void;
  onDeleteDeposit: (id: number) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Bank',
];

export function DepositsTab({
  lang,
  monthKey,
  isManager,
  isMonthLocked,
  deposits,
  members,
  onSaveDeposit,
  onDeleteDeposit,
}: DepositsTabProps) {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<number | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);

  // Form fields
  const [date, setDate] = useState(`${monthKey}-21`);
  const [memberId, setMemberId] = useState<number>(members[0]?.id || 1);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const monthDeposits = deposits.filter((d) => d.date.startsWith(monthKey));
  const filteredDeposits =
    selectedMemberFilter === 'ALL'
      ? monthDeposits
      : monthDeposits.filter((d) => d.memberId === selectedMemberFilter);

  const totalFilteredDeposit = filteredDeposits.reduce((s, d) => s + d.amount, 0);

  const openAddModal = () => {
    setEditingId(undefined);
    setDate(`${monthKey}-21`);
    setMemberId(
      selectedMemberFilter === 'ALL'
        ? members[0]?.id || 1
        : selectedMemberFilter
    );
    setAmount('');
    setPaymentMethod('Cash');
    setTransactionRef('');
    setDescription('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (dep: DepositRecord) => {
    setEditingId(dep.id);
    setDate(dep.date);
    setMemberId(dep.memberId);
    setAmount(String(dep.amount));
    setPaymentMethod(dep.paymentMethod);
    setTransactionRef(dep.transactionRef);
    setDescription(dep.description);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setFormError(
        lang === 'bn'
          ? 'সঠিক জমার পরিমাণ লিখুন'
          : 'Please enter a valid positive deposit amount'
      );
      return;
    }

    onSaveDeposit(
      {
        date,
        memberId,
        amount: numAmount,
        paymentMethod,
        transactionRef: transactionRef.trim(),
        description: description.trim(),
      },
      editingId
    );
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Member Filter Bar */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#173125] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? 'মেম্বার জমা ও পেমেন্ট এন্ট্রি (Deposits)'
                  : 'Member Cash & Mobile Banking Deposits'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'মেম্বারদের নগদ (Cash), বিকাশ, নগদ, রকেট বা ব্যাংক জমার পূর্ণাঙ্গ হিসাব'
                : 'Track member deposits via Cash, bKash, Nagad, Rocket, and Bank transfers'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'নির্বাচিত মোট জমা' : 'Selected Total Deposits'}
              </p>
              <p className="text-lg font-bold font-numeric text-[#438A53]">
                {formatCurrency(totalFilteredDeposit, lang, 0)}
              </p>
            </div>

            {isManager && !isMonthLocked && (
              <button
                type="button"
                onClick={openAddModal}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#FED24F]" />
                <span>{lang === 'bn' ? 'নতুন জমা যোগ করুন' : 'Add Deposit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Member Filter Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedMemberFilter('ALL')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedMemberFilter === 'ALL'
                ? 'bg-[#173125] text-[#FED24F]'
                : 'bg-[#F6F8F5] text-slate-600 hover:text-[#173125]'
            }`}
          >
            {lang === 'bn' ? 'সব মেম্বার (All Members)' : 'All Members'}
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMemberFilter(m.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedMemberFilter === m.id
                  ? 'bg-[#173125] text-white'
                  : 'bg-[#F6F8F5] text-slate-600 hover:text-[#173125]'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </section>

      {/* Deposits List */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 divide-y divide-slate-100">
        {filteredDeposits.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-600">
              {lang === 'bn'
                ? 'এই মাসে এখনো কোনো জমার এন্ট্রি পাওয়া যায়নি'
                : 'No deposit records found for this selection'}
            </p>
            {isManager && !isMonthLocked && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-2 px-4 py-2 rounded-xl bg-[#438A53] text-white text-xs font-semibold"
              >
                {lang === 'bn' ? 'প্রথম জমা এন্ট্রি করুন' : 'Record First Deposit'}
              </button>
            )}
          </div>
        ) : (
          filteredDeposits.map((dep) => {
            const memberObj = members.find((m) => m.id === dep.memberId);
            return (
              <div
                key={dep.id}
                className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#F6F8F5]/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-numeric font-semibold text-[#438A53]">
                      {dep.date}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-[#173125]">
                      {translatePaymentMethod(dep.paymentMethod, lang)}
                    </span>
                    {dep.transactionRef && (
                      <>
                        <span>·</span>
                        <span className="font-numeric">
                          TrxID: {dep.transactionRef}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-sm sm:text-base font-bold text-[#173125] mt-1">
                    {memberObj ? memberObj.name : `Member #${dep.memberId}`}
                  </h2>

                  {dep.description && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dep.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-base sm:text-lg font-bold font-numeric text-[#438A53]">
                    +{formatCurrency(dep.amount, lang, 0)}
                  </p>

                  {isManager && !isMonthLocked && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(dep)}
                        aria-label={`Edit deposit for ${memberObj?.name || dep.memberId}`}
                        className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDeposit(dep.id)}
                        aria-label={`Delete deposit for ${memberObj?.name || dep.memberId}`}
                        className="min-h-[36px] min-w-[36px] rounded-lg border border-rose-200 hover:bg-rose-50 flex items-center justify-center text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Add / Edit Deposit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-[#173125]">
              {editingId
                ? lang === 'bn'
                  ? 'জমার তথ্য সম্পাদনা করুন'
                  : 'Edit Deposit Record'
                : lang === 'bn'
                  ? 'নতুন মেম্বার জমা এন্ট্রি করুন'
                  : 'Record New Member Deposit'}
            </h3>

            {formError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg">
                {formError}
              </p>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'তারিখ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'মেম্বার নির্বাচন *' : 'Select Member *'}
                  </label>
                  <select
                    value={memberId}
                    onChange={(e) => setMemberId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.roomNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'জমার পরিমাণ (৳) *' : 'Deposit Amount (BDT) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-numeric font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'পেমেন্ট মাধ্যম *' : 'Payment Method *'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {translatePaymentMethod(pm, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'bn'
                    ? 'ট্রানজেকশন আইডি / রেফারেন্স (ঐচ্ছিক)'
                    : 'Transaction Ref / TrxID (Optional)'}
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. BK98234X1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-numeric"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'bn' ? 'নোট বা বিবরণ' : 'Description / Note'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: ১ম কিস্তি জমা'
                      : 'e.g. First installment'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold"
              >
                {lang === 'bn' ? 'জমা সেভ করুন' : 'Save Deposit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
