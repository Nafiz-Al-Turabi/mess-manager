'use client';

import React, { useState } from 'react';
import {
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  Lock,
  Printer,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import {
  DepositRecord,
  ExpenseRecord,
  Language,
  MealRecord,
  Member,
  MemberAccountingSummary,
  MemberRole,
  MonthlyMessAccounting,
} from '@/lib/types';
import {
  formatCurrency,
  formatMonthLabel,
  formatNumber,
} from '@/lib/i18n';
import { generateMemberStatementPdf } from '@/lib/pdf-export';
import { AppUser } from '@/lib/mongo-client';

interface ReportsMembersTabProps {
  lang: Language;
  messId: string;
  messName: string;
  monthKey: string;
  isManager: boolean;
  currentUser?: AppUser | null;
  isMonthLocked: boolean;
  onToggleMonthLock: () => void;
  accounting: MonthlyMessAccounting;
  members: Member[];
  meals: MealRecord[];
  expenses: ExpenseRecord[];
  deposits: DepositRecord[];
  onDownloadMonthlyPdf: () => void;
  onSaveMember: (member: Omit<Member, 'id'>, existingId?: number) => void;
  onToggleMemberActive: (memberId: number) => void;
  onDeleteMember: (memberId: number) => void;
  statementMemberSummary: MemberAccountingSummary | null;
  onSelectStatementMember: (summary: MemberAccountingSummary | null) => void;
  onDownloadStatementPdf?: (memberName: string) => void;
}

export function ReportsMembersTab({
  lang,
  messId,
  messName,
  monthKey,
  isManager,
  currentUser,
  isMonthLocked,
  onToggleMonthLock,
  accounting,
  members,
  meals,
  expenses,
  deposits,
  onDownloadMonthlyPdf,
  onSaveMember,
  onToggleMemberActive,
  onDeleteMember,
  statementMemberSummary,
  onSelectStatementMember,
  onDownloadStatementPdf,
}: ReportsMembersTabProps) {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | undefined>(undefined);

  // Member Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-10-01');
  const [role, setRole] = useState<MemberRole>('Member');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const monthLabel = formatMonthLabel(monthKey, lang);

  const openAddMember = () => {
    setEditingMemberId(undefined);
    setName('');
    setPhone('');
    setRoomNumber('');
    setEmail('');
    setJoiningDate(`${monthKey}-01`);
    setRole('Member');
    setNotes('');
    setIsActive(true);
    setFormError('');
    setShowMemberModal(true);
  };

  const openEditMember = (m: Member) => {
    setEditingMemberId(m.id);
    setName(m.name);
    setPhone(m.phone);
    setRoomNumber(m.roomNumber);
    setEmail(m.email);
    setJoiningDate(m.joiningDate);
    setRole(m.role);
    setNotes(m.notes);
    setIsActive(m.isActive);
    setFormError('');
    setShowMemberModal(true);
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(lang === 'bn' ? 'মেম্বারের নাম লিখুন' : 'Please enter member name');
      return;
    }
    onSaveMember(
      {
        name: name.trim(),
        phone: phone.trim(),
        roomNumber: roomNumber.trim() || 'Room-1',
        email: email.trim(),
        joiningDate,
        role,
        notes: notes.trim(),
        isActive,
      },
      editingMemberId
    );
    setShowMemberModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. FULL MONTHLY ACCOUNTING REPORT TABLE */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#173125] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? `${monthLabel} — পূর্ণাঙ্গ মেস হিসাব শীট`
                  : `${monthLabel} — Accounting Sheet`}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? `মিল রেট: ${formatCurrency(accounting.mealRate, lang, 2)} · জনপ্রতি শেয়ার্ড খরচ: ${formatCurrency(accounting.perMemberSharedCost, lang, 0)} · যেকোনো মেম্বারের নামের ওপর ক্লিক করে ব্যক্তিগত স্টেটমেন্ট দেখুন`
                : `Meal Rate: ${formatCurrency(accounting.mealRate, lang, 2)} · Shared Cost/Member: ${formatCurrency(accounting.perMemberSharedCost, lang, 0)} · Click any member for detailed statement`}
            </p>
          </div>

          <div className="grid grid-cols-2 md:flex flex-wrap items-center gap-2 no-print w-full md:w-fit">
            {/* Download PDF - Only for Admin / Super Admin */}
            {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
              <button
                type="button"
                onClick={onDownloadMonthlyPdf}
                className="w-full md:w-fit min-h-[40px] px-3.5 py-2 rounded-xl bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#FED24F]" />
                <span>{lang === 'bn' ? 'পিডিএফ ডাউনলোড (PDF)' : 'Download PDF'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F6F8F5] hover:bg-slate-200 text-[#173125] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Printer className="w-4 h-4 text-[#438A53]" />
              <span>{lang === 'bn' ? 'প্রিন্ট করুন' : 'Print Report'}</span>
            </button>

            {isManager && (
              <button
                type="button"
                onClick={onToggleMonthLock}
                className={`col-span-2 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center md:justify-start gap-1.5 whitespace-nowrap transition-colors ${
                  isMonthLocked
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-[#438A53]/15 text-[#173125] hover:bg-[#438A53]/25'
                }`}
              >
                {isMonthLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'মাস লক করা (আনলক)' : 'Month Closed (Unlock)'}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-[#438A53]" />
                    <span>{lang === 'bn' ? 'মাস ক্লোজ / লক করুন' : 'Close & Lock Month'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* High-Density Accounting Table */}
        <div className="mt-5 overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="border-y border-slate-200 bg-[#F6F8F5] text-[11px] font-bold text-slate-600">
                <th className="py-3 px-3">
                  {lang === 'bn' ? 'মেম্বার ও রুম' : 'Member & Room'}
                </th>
                <th className="py-3 px-2.5 text-right">
                  {lang === 'bn' ? 'মোট মিল' : 'Total Meals'}
                </th>
                <th className="py-3 px-2.5 text-right">
                  {lang === 'bn' ? 'মিল খরচ' : 'Meal Cost'}
                </th>
                <th className="py-3 px-2.5 text-right">
                  {lang === 'bn' ? 'শেয়ার্ড বিল' : 'Shared Cost'}
                </th>
                <th className="py-3 px-2.5 text-right">
                  {lang === 'bn' ? 'মোট খরচ' : 'Total Cost'}
                </th>
                <th className="py-3 px-2.5 text-right">
                  {lang === 'bn' ? 'নগদ জমা' : 'Cash Deposit'}
                </th>
                <th className="py-3 px-2.5 text-right">
                  {lang === 'bn' ? 'নিজ খরচে বাজার' : 'Paid Bazar'}
                </th>
                <th className="py-3 px-2.5 text-right">
                  {lang === 'bn' ? 'মোট জমা' : 'Total Credit'}
                </th>
                <th className="py-3 px-3 text-right">
                  {lang === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}
                </th>
                <th className="py-3 px-2 text-center no-print">
                  {lang === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {accounting.memberSummaries.map((ms) => {
                const isRefundable = ms.netBalance >= 0;
                return (
                  <tr
                    key={ms.member.id}
                    className="hover:bg-[#F6F8F5]/80 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#173125]">
                        {ms.member.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-numeric">
                        {ms.member.roomNumber} ·{' '}
                        {ms.member.isActive
                          ? lang === 'bn'
                            ? 'সক্রিয়'
                            : 'Active'
                          : lang === 'bn'
                            ? 'নিষ্ক্রিয়'
                            : 'Inactive'}
                      </div>
                    </td>
                    <td className="py-3 px-2.5 text-right font-numeric font-bold text-[#173125]">
                      {formatNumber(ms.totalMeals, lang, 1)}
                    </td>
                    <td className="py-3 px-2.5 text-right font-numeric text-slate-700">
                      {formatCurrency(ms.mealCost, lang, 0)}
                    </td>
                    <td className="py-3 px-2.5 text-right font-numeric text-slate-700">
                      {formatCurrency(ms.sharedCost, lang, 0)}
                    </td>
                    <td className="py-3 px-2.5 text-right font-numeric font-bold text-[#173125]">
                      {formatCurrency(ms.totalCost, lang, 0)}
                    </td>
                    <td className="py-3 px-2.5 text-right font-numeric text-slate-700">
                      {formatCurrency(ms.cashDeposit, lang, 0)}
                    </td>
                    <td className="py-3 px-2.5 text-right font-numeric text-[#438A53]">
                      {formatCurrency(ms.paidExpenseCredit, lang, 0)}
                    </td>
                    <td className="py-3 px-2.5 text-right font-numeric font-bold text-[#438A53]">
                      {formatCurrency(ms.totalCredit, lang, 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-numeric">
                      <div
                        className={`font-bold ${
                          isRefundable ? 'text-[#438A53]' : 'text-rose-600'
                        }`}
                      >
                        {isRefundable ? '+' : '-'}
                        {formatCurrency(Math.abs(ms.netBalance), lang, 0)}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          isRefundable ? 'text-[#438A53]' : 'text-rose-600'
                        }`}
                      >
                        {isRefundable
                          ? lang === 'bn'
                            ? 'পাবে (Get)'
                            : 'Refundable'
                          : lang === 'bn'
                            ? 'বকেয়া (Due)'
                            : 'Due'}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center no-print">
                      <button
                        type="button"
                        onClick={() => onSelectStatementMember(ms)}
                        aria-label={`View statement for ${ms.member.name}`}
                        className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#F6F8F5] hover:bg-[#173125] hover:text-white text-xs font-semibold text-[#173125] inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'দেখুন' : 'View'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#173125]/20 bg-[#F6F8F5] text-xs font-bold text-[#173125] font-numeric">
                <td className="py-3 px-3">
                  {lang === 'bn' ? 'সর্বমোট (Total)' : 'Grand Total'}
                </td>
                <td className="py-3 px-2.5 text-right">
                  {formatNumber(accounting.totalMessMeals, lang, 1)}
                </td>
                <td className="py-3 px-2.5 text-right">
                  {formatCurrency(accounting.totalFoodCost, lang, 0)}
                </td>
                <td className="py-3 px-2.5 text-right">
                  {formatCurrency(accounting.totalSharedCost, lang, 0)}
                </td>
                <td className="py-3 px-2.5 text-right">
                  {formatCurrency(accounting.totalMessCost, lang, 0)}
                </td>
                <td className="py-3 px-2.5 text-right">
                  {formatCurrency(accounting.totalCashDeposits, lang, 0)}
                </td>
                <td className="py-3 px-2.5 text-right">
                  {formatCurrency(accounting.totalOutOfPocketExpenses, lang, 0)}
                </td>
                <td className="py-3 px-2.5 text-right text-[#438A53]">
                  {formatCurrency(accounting.totalCredits, lang, 0)}
                </td>
                <td className="py-3 px-3 text-right">
                  {formatCurrency(accounting.cashInHand, lang, 0)}
                </td>
                <td className="no-print" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 2. MEMBER DIRECTORY (ADD / EDIT / ACTIVE TOGGLE / DELETE / GMAIL LINKING) */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5 no-print">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#173125] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? `মেম্বার ডিরেক্টরি (${formatNumber(members.length, lang)} জন মেম্বার)`
                  : `Mess Member (${members.length} Members)`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'মেম্বারের জিমেইল যুক্ত করলে গুগল সাইন-ইনের সাথে স্বয়ংক্রিয়ভাবে প্রোফাইল লিঙ্ক হবে · নিষ্ক্রিয় মেম্বারদের ওপর শেয়ার্ড বিল ধার্য হয় না'
                : 'Link member Gmail for automatic Google Sign-In profile matching · Inactive members are exempt from shared utility bills'}
            </p>
          </div>

          {isManager && (
            <button
              type="button"
              onClick={openAddMember}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#FED24F]" />
              <span>{lang === 'bn' ? 'নতুন মেম্বার যোগ করুন' : 'Add New Member'}</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100 mt-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="py-3.5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-[#173125]">
                    {m.name}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-[#438A53]">
                    {m.role === 'Manager'
                      ? lang === 'bn'
                        ? 'ম্যানেজার'
                        : 'Manager'
                      : lang === 'bn'
                        ? 'মেম্বার'
                        : 'Member'}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-numeric text-slate-600">
                    {lang === 'bn' ? 'রুম:' : 'Room:'} {m.roomNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-numeric mt-0.5">
                  {m.phone || 'No phone'}
                  {m.email ? ` · ${m.email}` : ''}
                  {` · Joined: ${m.joiningDate}`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isManager ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onToggleMemberActive(m.id)}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                        m.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {m.isActive ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditMember(m)}
                      aria-label={`Edit member ${m.name}`}
                      className="min-h-[36px] min-w-[36px] rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteMember(m.id)}
                        aria-label={`Delete member ${m.name}`}
                        className="min-h-[36px] min-w-[36px] rounded-lg border border-rose-200 hover:bg-rose-50 flex items-center justify-center text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    {m.isActive
                      ? lang === 'bn'
                        ? 'সক্রিয় মেম্বার'
                        : 'Active Member'
                      : lang === 'bn'
                        ? 'নিষ্ক্রিয়'
                        : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INDIVIDUAL MEMBER STATEMENT MODAL */}
      {statementMemberSummary && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold text-[#438A53]">
                  {lang === 'bn'
                    ? `${monthLabel} · ব্যক্তিগত মেম্বার স্টেটমেন্ট`
                    : `${monthLabel} · Individual Member Statement`}
                </p>
                <h3 className="text-xl font-bold text-[#173125] mt-0.5">
                  {statementMemberSummary.member.name}
                </h3>
                <p className="text-xs text-slate-500 font-numeric mt-0.5">
                  {lang === 'bn' ? 'রুম:' : 'Room:'}{' '}
                  {statementMemberSummary.member.roomNumber} ·{' '}
                  {statementMemberSummary.member.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectStatementMember(null)}
                aria-label="Close statement modal"
                className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#F6F8F5]">
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'মোট মিল' : 'Total Meals'}
                </p>
                <p className="text-lg font-bold font-numeric text-[#173125] mt-0.5">
                  {formatNumber(statementMemberSummary.totalMeals, lang, 1)}
                </p>
                <p className="text-[10px] font-numeric text-slate-500">
                  L:{statementMemberSummary.lunchCount} D:{statementMemberSummary.dinnerCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5]">
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'মোট খরচ (মিল+শেয়ার্ড)' : 'Total Cost'}
                </p>
                <p className="text-lg font-bold font-numeric text-[#173125] mt-0.5">
                  {formatCurrency(statementMemberSummary.totalCost, lang, 0)}
                </p>
                <p className="text-[10px] font-numeric text-slate-500">
                  {formatCurrency(statementMemberSummary.mealCost, lang, 0)} +{' '}
                  {formatCurrency(statementMemberSummary.sharedCost, lang, 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F8F5]">
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'মোট জমা (নগদ+বাজার)' : 'Total Credit'}
                </p>
                <p className="text-lg font-bold font-numeric text-[#438A53] mt-0.5">
                  {formatCurrency(statementMemberSummary.totalCredit, lang, 0)}
                </p>
                <p className="text-[10px] font-numeric text-slate-500">
                  {formatCurrency(statementMemberSummary.cashDeposit, lang, 0)} +{' '}
                  {formatCurrency(statementMemberSummary.paidExpenseCredit, lang, 0)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#173125] text-white">
                <p className="text-xs text-white/75">
                  {lang === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}
                </p>
                <p
                  className={`text-lg font-bold font-numeric mt-0.5 ${
                    statementMemberSummary.netBalance >= 0
                      ? 'text-[#FED24F]'
                      : 'text-rose-300'
                  }`}
                >
                  {statementMemberSummary.netBalance >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(statementMemberSummary.netBalance), lang, 0)}
                </p>
                <p className="text-[10px] text-white/75">
                  {statementMemberSummary.netBalance >= 0
                    ? lang === 'bn'
                      ? 'মেস থেকে পাবে'
                      : 'Refundable'
                    : lang === 'bn'
                      ? 'মেসে বকেয়া'
                      : 'Due to Mess'}
                </p>
              </div>
            </div>

            {/* Member's Deposits & Out-of-Pocket Expenses */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#173125]">
                {lang === 'bn'
                  ? 'নগদ জমা এবং নিজ পকেট থেকে করা বাজারের তালিকা'
                  : 'Recorded Cash Deposits & Out-of-Pocket Paid Expenses'}
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl px-3">
                {deposits
                  .filter(
                    (d) =>
                      d.date.startsWith(monthKey) &&
                      d.memberId === statementMemberSummary.member.id
                  )
                  .map((d) => (
                    <div
                      key={`dep-${d.id}`}
                      className="py-2 flex items-center justify-between text-xs"
                    >
                      <span>
                        <span className="font-numeric text-[#438A53] font-semibold">
                          {d.date}
                        </span>{' '}
                        · {d.paymentMethod} {d.description ? `(${d.description})` : ''}
                      </span>
                      <span className="font-numeric font-bold text-[#438A53]">
                        +{formatCurrency(d.amount, lang, 0)}
                      </span>
                    </div>
                  ))}
                {expenses
                  .filter(
                    (e) =>
                      e.date.startsWith(monthKey) &&
                      e.paidByMemberId === statementMemberSummary.member.id
                  )
                  .map((e) => (
                    <div
                      key={`exp-${e.id}`}
                      className="py-2 flex items-center justify-between text-xs"
                    >
                      <span>
                        <span className="font-numeric text-[#173125] font-semibold">
                          {e.date}
                        </span>{' '}
                        · [Paid Expense] {e.title}
                      </span>
                      <span className="font-numeric font-bold text-[#438A53]">
                        +{formatCurrency(e.amount, lang, 0)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onSelectStatementMember(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={() => {
                    const memberId = statementMemberSummary.member.id;
                    generateMemberStatementPdf({
                      messName,
                      messId,
                      monthKey,
                      mealRate: accounting.mealRate,
                      summary: statementMemberSummary,
                      memberMeals: meals.filter(
                        (m) => m.date.startsWith(monthKey) && m.memberId === memberId
                      ),
                      memberDeposits: deposits.filter(
                        (d) => d.date.startsWith(monthKey) && d.memberId === memberId
                      ),
                      memberPaidExpenses: expenses.filter(
                        (e) =>
                          e.date.startsWith(monthKey) && e.paidByMemberId === memberId
                      ),
                    });
                    onDownloadStatementPdf?.(statementMemberSummary.member.name);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#FED24F]" />
                  <span>
                    {lang === 'bn'
                      ? 'ব্যক্তিগত স্টেটমেন্ট পিডিএফ'
                      : 'Download Statement PDF'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ADD / EDIT MEMBER MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleMemberSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-[#173125]">
              {editingMemberId
                ? lang === 'bn'
                  ? 'মেম্বারের তথ্য সম্পাদনা করুন'
                  : 'Edit Member Profile'
                : lang === 'bn'
                  ? 'নতুন মেস মেম্বার যোগ করুন'
                  : 'Add New Mess Member'}
            </h3>

            {formError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg">
                {formError}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'bn' ? 'মেম্বারের পূর্ণ নাম *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: শাকিল আহমেদ (Shakil)' : 'e.g. Shakil Ahmed'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'রুম / সিট নম্বর' : 'Room / Seat No'}
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="9D-B2"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-numeric"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'bn'
                    ? 'জিমেইল (অটো গুগল সাইন-ইন লিঙ্কিংয়ের জন্য)'
                    : 'Gmail Address (For Auto Google Sign-In Link)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'ভূমিকা (Role)' : 'Role'}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as MemberRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                  >
                    <option value="Member">Member (মেম্বার)</option>
                    <option value="Manager">Manager (ম্যানেজার)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {lang === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-numeric"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold"
              >
                {lang === 'bn' ? 'মেম্বার সেভ করুন' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
