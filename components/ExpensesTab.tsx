'use client';

import React, { useState } from 'react';
import {
  Edit2,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  ExpenseCategory,
  ExpenseRecord,
  Language,
  Member,
} from '@/lib/types';
import {
  formatCurrency,
  translateExpenseCategory,
} from '@/lib/i18n';
import { ExpensesSkeleton } from '@/components/skeletons';

interface ExpensesTabProps {
  isLoading?: boolean;
  lang: Language;
  monthKey: string;
  isManager: boolean;
  isMonthLocked: boolean;
  expenses: ExpenseRecord[];
  members: Member[];
  onSaveExpense: (expense: Omit<ExpenseRecord, 'id'>, existingId?: number) => void;
  onDeleteExpense: (id: number) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Bazar (Food)',
  'Gas',
  'Electricity',
  'WiFi',
  'Bua / Maid',
  'House Rent',
  'Water',
  'Other Shared',
];

export function ExpensesTab({
  isLoading,
  lang,
  monthKey,
  isManager,
  isMonthLocked,
  expenses,
  members,
  onSaveExpense,
  onDeleteExpense,
}: ExpensesTabProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'food' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);

  // Form fields
  const [date, setDate] = useState(`${monthKey}-21`);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Bazar (Food)');
  const [amount, setAmount] = useState('');
  const [paidByMemberId, setPaidByMemberId] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  if (isLoading) {
    return <ExpensesSkeleton lang={lang} />;
  }

  const monthExpenses = expenses.filter((e) => e.date.startsWith(monthKey));

  const filteredExpenses = monthExpenses.filter((e) => {
    if (filterMode === 'food' && !e.isFoodExpense) return false;
    if (filterMode === 'shared' && e.isFoodExpense) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.paidByName.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalFood = monthExpenses
    .filter((e) => e.isFoodExpense)
    .reduce((s, e) => s + e.amount, 0);
  const totalShared = monthExpenses
    .filter((e) => !e.isFoodExpense)
    .reduce((s, e) => s + e.amount, 0);

  const openAddModal = () => {
    setEditingId(undefined);
    setDate(`${monthKey}-21`);
    setTitle('');
    setCategory('Bazar (Food)');
    setAmount('');
    setPaidByMemberId(0);
    setDescription('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (exp: ExpenseRecord) => {
    setEditingId(exp.id);
    setDate(exp.date);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setPaidByMemberId(exp.isFoodExpense ? 0 : exp.paidByMemberId);
    setDescription(exp.description);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setFormError(lang === 'bn' ? 'খরচের বিবরণ লিখুন' : 'Please enter expense title');
      return;
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setFormError(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Please enter a valid positive amount');
      return;
    }
    const isFoodExpense = category === 'Bazar (Food)';
    const payer = !isFoodExpense && paidByMemberId > 0 ? members.find((m) => m.id === paidByMemberId) : null;
    const finalPaidByMemberId = isFoodExpense ? 0 : paidByMemberId;
    const finalPaidByName = isFoodExpense
      ? (lang === 'bn' ? 'মেস ডিপোজিট ফান্ড' : 'Mess Deposit Fund')
      : payer
        ? payer.name
        : (lang === 'bn' ? 'মেস ডিপোজিট ফান্ড' : 'Mess Deposit Fund');


    onSaveExpense(
      {
        date,
        title: title.trim(),
        category,
        amount: numAmount,
        paidByMemberId: finalPaidByMemberId,
        paidByName: finalPaidByName,
        description: description.trim(),
        isFoodExpense,
      },
      editingId
    );
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Summary Strip */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#173125] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? 'বাজার খরচ ও শেয়ার্ড বিল (Expenses & Bills)'
                  : 'Mess Bazar & Shared Utility Bills'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'বাজার খরচ মেস ডিপোজিট ফান্ড থেকে কাটা হয় ও মিল রেটে যুক্ত হয় · শেয়ার্ড বিল সক্রিয় মেম্বারদের মাঝে সমান ভাগ হয়'
                : 'Food Bazar is paid from mess deposits & enters Meal Rate · Shared Bills split equally'}
            </p>
          </div>

          {isManager && !isMonthLocked && (
            <button
              type="button"
              onClick={openAddModal}
              className=" min-h-[42px] w-full md:w-fit px-4 py-2 rounded-xl bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold flex justify-center items-center md:justify-start gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4 text-[#FED24F]" />
              <span>{lang === 'bn' ? 'নতুন খরচ যোগ করুন' : 'Add New Expense'}</span>
            </button>
          )}
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-[#F6F8F5]">
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'মোট বাজার খরচ (মিল রেটে যুক্ত)'
                : 'Total Food Bazar (Meal Rate)'}
            </p>
            <p className="text-xl font-bold font-numeric text-[#173125] mt-1">
              {formatCurrency(totalFood, lang, 0)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F6F8F5]">
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'মোট শেয়ার্ড বিল (সবার মাঝে সমান ভাগ)'
                : 'Total Shared Bills (Equal Split)'}
            </p>
            <p className="text-xl font-bold font-numeric text-[#438A53] mt-1">
              {formatCurrency(totalShared, lang, 0)}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#173125] text-white">
            <p className="text-xs text-white/75">
              {lang === 'bn' ? 'সর্বমোট মেস খরচ' : 'Grand Total Mess Expense'}
            </p>
            <p className="text-xl font-bold font-numeric text-[#FED24F] mt-1">
              {formatCurrency(totalFood + totalShared, lang, 0)}
            </p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="inline-flex w-full md:w-fit rounded-xl bg-[#F6F8F5] p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterMode === 'all'
                  ? 'bg-[#173125] text-white'
                  : 'text-slate-600 hover:text-[#173125]'
              }`}
            >
              {lang === 'bn' ? 'সব খরচ (All)' : 'All Expenses'}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('food')}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterMode === 'food'
                  ? 'bg-[#173125] text-[#FED24F]'
                  : 'text-slate-600 hover:text-[#173125]'
              }`}
            >
              {lang === 'bn' ? 'বাজার খরচ (Food Bazar)' : 'Food Bazar'}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('shared')}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterMode === 'shared'
                  ? 'bg-[#173125] text-[#B2D959]'
                  : 'text-slate-600 hover:text-[#173125]'
              }`}
            >
              {lang === 'bn' ? 'শেয়ার্ড বিল (Shared Bills)' : 'Shared Bills'}
            </button>
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'খরচের নাম বা বাজারকারীর নাম খুঁজুন...'
                  : 'Search expense or payer...'
              }
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-[#173125] bg-[#F6F8F5] focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Expenses List */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 divide-y divide-slate-100">
        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-600">
              {lang === 'bn'
                ? 'এই ফিল্টারে কোনো খরচের হিসাব পাওয়া যায়নি'
                : 'No expenses found for this filter'}
            </p>
            {isManager && !isMonthLocked && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-2 px-4 py-2 rounded-xl bg-[#438A53] text-white text-xs font-semibold"
              >
                {lang === 'bn' ? 'প্রথম খরচ যোগ করুন' : 'Log First Expense'}
              </button>
            )}
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#F6F8F5]/60 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-numeric font-semibold text-[#438A53]">
                    {exp.date}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-[#173125]">
                    {translateExpenseCategory(exp.category, lang)}
                  </span>
                  <span>·</span>
                  <span>
                    {exp.isFoodExpense
                      ? lang === 'bn'
                        ? 'মিল রেটে যুক্ত'
                        : 'Meal Rate Food'
                      : lang === 'bn'
                        ? 'সমান শেয়ার্ড বিল'
                        : 'Equal Shared Bill'}
                  </span>
                </div>

                <h2 className="text-sm sm:text-base font-bold text-[#173125] mt-1">
                  {exp.title}
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  {exp.isFoodExpense ? (
                    <>
                      <span>{lang === 'bn' ? 'পরিশোধ:' : 'Paid From:'} </span>
                      <span className="font-semibold text-[#173125]">
                        {lang === 'bn' ? 'মেস ডিপোজিট ফান্ড' : 'Mess Deposit Fund'}
                      </span>
                    </>
                  ) : exp.paidByMemberId > 0 ? (
                    <>
                      <span>{lang === 'bn' ? 'নিজ খরচে দিয়েছেন:' : 'Paid Out-of-Pocket by:'} </span>
                      <span className="font-semibold text-[#173125]">{exp.paidByName}</span>
    
                    </>
                  ) : (
                    <>
                      <span>{lang === 'bn' ? 'পরিশোধ:' : 'Paid From:'} </span>
                      <span className="font-semibold text-[#173125]">
                        {lang === 'bn' ? 'মেস ডিপোজিট ফান্ড' : 'Mess Deposit Fund'}
                      </span>
                    </>
                  )}

                  {exp.description ? ` · ${exp.description}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <p className="text-base sm:text-lg font-bold font-numeric text-[#173125]">
                  {formatCurrency(exp.amount, lang, 0)}
                </p>

                {isManager && !isMonthLocked && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(exp)}
                      aria-label={`Edit expense ${exp.title}`}
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpense(exp.id)}
                      aria-label={`Delete expense ${exp.title}`}
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-rose-200 hover:bg-rose-50 flex items-center justify-center text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Add / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-[#173125]">
              {editingId
                ? lang === 'bn'
                  ? 'খরচের তথ্য সম্পাদনা করুন'
                  : 'Edit Expense'
                : lang === 'bn'
                  ? 'নতুন বাজার খরচ বা শেয়ার্ড বিল যোগ করুন'
                  : 'Add Expense or Shared Bill'}
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
                    {lang === 'bn' ? 'ক্যাটাগরি *' : 'Category *'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {translateExpenseCategory(cat, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'bn' ? 'খরচের শিরোনাম / বাজারের বিবরণ *' : 'Expense Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: মুরগি, ডিম ও সবজি বাজার'
                      : 'e.g. Chicken, eggs & vegetables'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (BDT) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-numeric font-bold"
                  />
                </div>
                {category === 'Bazar (Food)' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {lang === 'bn' ? 'পরিশোধের উৎস' : 'Payment Source'}
                    </label>
                    <div className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50/70 text-xs font-semibold text-[#173125] flex items-center gap-1.5 h-[38px]">
                      <span className="w-2 h-2 rounded-full bg-[#438A53]"></span>
                      <span>
                        {lang === 'bn'
                          ? '🏛️ মেস ডিপোজিট ফান্ড (সরাসরি কর্তন)'
                          : '🏛️ Mess Deposit Fund (Direct)'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {lang === 'bn' ? 'কে টাকা দিয়েছেন? (Payer) *' : 'Paid By Member / Fund *'}
                    </label>
                    <select
                      value={paidByMemberId}
                      onChange={(e) => setPaidByMemberId(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                    >
                      <option value={0}>
                        {lang === 'bn' ? '🏛️ মেস ডিপোজিট ফান্ড' : '🏛️ Mess Deposit Fund'}
                      </option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          👤 {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'bn' ? 'অতিরিক্ত নোট (ঐচ্ছিক)' : 'Additional Note (Optional)'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'রশিদ নম্বর বা বাজারের বিস্তারিত...'
                      : 'Receipt note or details...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <p className="text-[11px] text-[#438A53] bg-[#F6F8F5] p-2.5 rounded-lg">
                {category === 'Bazar (Food)'
                  ? lang === 'bn'
                    ? '✓ এটি "বাজার খরচ" হিসেবে সরাসরি মেস ডিপোজিট ফান্ড থেকে কর্তন হবে এবং মিল রেটে যুক্ত হবে (কোনো মেম্বারের ব্যক্তিগত জমায় যোগ হবে না)।'
                    : '✓ This Food Bazar expense is deducted directly from the Mess Deposit fund and enters the Meal Rate (not credited to any member).'
                  : paidByMemberId > 0
                    ? lang === 'bn'
                      ? '✓ এটি শেয়ার্ড বিল হিসেবে সবার মাঝে সমান ভাগ হবে এবং যিনি নিজ পকেট থেকে দিয়েছেন তার জমায় ক্রেডিট হবে।'
                      : '✓ This Shared Bill splits equally and credits the member who paid out-of-pocket.'
                    : lang === 'bn'
                      ? '✓ এটি মেস ডিপোজিট ফান্ড থেকে পরিশোধিত শেয়ার্ড বিল হিসেবে গণ্য হবে (কারো ব্যক্তিগত জমায় যোগ হবে না)।'
                      : '✓ This Shared Bill is paid directly from the Mess Deposit fund.'}
              </p>
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
                {lang === 'bn' ? 'খরচ সেভ করুন' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
