"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Copy,
  Edit3,
  FileSpreadsheet,
  MessageCircle,
  Plus,
  Receipt,
  Send,
  ShoppingBag,
  UserCheck,
  UserPlus,
  Utensils,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  ActivityLogItem,
  JoinRequestItem,
  Language,
  MealRecord,
  Member,
  MemberAccountingSummary,
  MonthlyMessAccounting,
  NoticeCategory,
  NoticeItem,
  RosterItem,
} from "@/lib/types";
import { AppUser } from "@/lib/mongo-client";
import {
  formatCurrency,
  formatMonthLabel,
  formatNumber,
  translateNoticeCategory,
} from "@/lib/i18n";
import { buildDueReminderMessage } from "@/lib/accounting";

interface HomeTabProps {
  lang: Language;
  messId: string;
  messName: string;
  monthKey: string;
  isManager: boolean;
  currentUser?: AppUser | null;
  accounting: MonthlyMessAccounting;
  notice: NoticeItem;
  onSaveNotice: (updated: NoticeItem) => void;
  cutoffTime: string;
  onUpdateCutoffTime: (newTime: string) => void;
  selectedMemberIdForSelfMeal: number;
  onChangeSelfMealMember: (id: number) => void;
  tomorrowDate: string;
  tomorrowMeal: MealRecord | undefined;
  onSaveSelfMeal: (
    memberId: number,
    date: string,
    breakfast: number,
    lunch: number,
    dinner: number,
    guestMeal: number,
    notes: string,
  ) => void;
  rosters: RosterItem[];
  members: Member[];
  onAddRoster: (date: string, memberId: number, note: string) => void;
  onToggleRosterStatus: (rosterId: number) => void;
  onDeleteRoster: (rosterId: number) => void;
  joinRequests: JoinRequestItem[];
  onApproveJoinRequest: (req: JoinRequestItem) => void;
  onRejectJoinRequest: (req: JoinRequestItem) => void;
  onSimulateJoinRequest: (name: string, email: string) => void;
  activityLogs: ActivityLogItem[];
  onNavigateTab: (
    tab: "home" | "meals" | "expenses" | "deposits" | "reports",
  ) => void;
  onDownloadMonthlyPdf: () => void;
  onInspectMemberStatement: (summary: MemberAccountingSummary) => void;
}

export function HomeTab({
  lang,
  messId,
  messName,
  monthKey,
  isManager,
  currentUser,
  accounting,
  notice,
  onSaveNotice,
  cutoffTime,
  onUpdateCutoffTime,
  selectedMemberIdForSelfMeal,
  onChangeSelfMealMember,
  tomorrowDate,
  tomorrowMeal,
  onSaveSelfMeal,
  rosters,
  members,
  onAddRoster,
  onToggleRosterStatus,
  onDeleteRoster,
  joinRequests,
  onApproveJoinRequest,
  onRejectJoinRequest,
  onSimulateJoinRequest,
  activityLogs,
  onNavigateTab,
  onDownloadMonthlyPdf,
  onInspectMemberStatement,
}: HomeTabProps) {
  // Notice Modal State
  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState(notice.title);
  const [noticeMessage, setNoticeMessage] = useState(notice.message);
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>(
    notice.category,
  );

  // Roster Form State
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterDate, setRosterDate] = useState(tomorrowDate);
  const [rosterMemberId, setRosterMemberId] = useState<number>(
    members[0]?.id || 1,
  );
  const [rosterNote, setRosterNote] = useState("");

  // Join Request Test Modal State
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");

  // Copy feedback
  const [copiedMemberId, setCopiedMemberId] = useState<number | null>(null);

  const dueMembers = accounting.memberSummaries.filter(
    (m) => m.netBalance < -1,
  );
  const pendingRequests = joinRequests.filter((r) => r.status === "PENDING");
  const monthLabel = formatMonthLabel(monthKey, lang);

  // Current logged in user's individual accounting summary
  const mySummary = currentUser
    ? accounting.memberSummaries.find(
        (m) =>
          (currentUser.memberId && m.member.id === currentUser.memberId) ||
          m.member.notes?.toLowerCase() ===
            currentUser.username.toLowerCase() ||
          m.member.name.toLowerCase() === currentUser.name.toLowerCase(),
      ) || accounting.memberSummaries[0]
    : accounting.memberSummaries[0];

  const handleCopyReminder = (summary: MemberAccountingSummary) => {
    const text = buildDueReminderMessage(messName, monthLabel, summary, lang);
    navigator.clipboard?.writeText(text);
    setCopiedMemberId(summary.member.id);
    setTimeout(() => setCopiedMemberId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO FINANCIAL CARD */}
      <section className="rounded-2xl bg-[#173125] text-white p-5 sm:p-6 border border-[#438A53]/40 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <p className="text-xs text-[#B2D959] font-medium">
              {lang === "bn"
                ? `${monthLabel} · মেস আর্থিক সারসংক্ষেপ`
                : `${monthLabel} · Monthly Financial Summary`}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-white">
              {lang === "bn" ? "মিল রেট:" : "Meal Rate:"}{" "}
              <span className="font-numeric text-[#FED24F]">
                {formatCurrency(accounting.mealRate, lang, 2)}
              </span>
              <span className="text-sm font-normal text-white/75 ml-2">
                / {lang === "bn" ? "মিল" : "meal"}
              </span>
            </h1>
            <p className="text-xs text-white/75 mt-1">
              {lang === "bn"
                ? "মিল রেট = মোট বাজার খরচ ÷ মোট মিল · শেয়ার্ড বিল সক্রিয় মেম্বারদের মাঝে সমান ভাগ হয়"
                : "Meal Rate = Food Bazar ÷ Total Meals · Shared bills split equally among active members"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadMonthlyPdf}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#438A53] hover:bg-[#438A53]/90 text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#FED24F]" />
              <span>
                {lang === "bn" ? "মাসিক পিডিএফ রিপোর্ট" : "Download PDF Report"}
              </span>
            </button>
          </div>
        </div>

        {/* 6 Core Financial Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 whitespace-nowrap truncate">
              {lang === "bn" ? "মিল রেট (Meal Rate)" : "Current Meal Rate"}
            </p>
            <p className="text-xl font-bold font-numeric text-[#FED24F] mt-1">
              {formatCurrency(accounting.mealRate, lang, 2)}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5 whitespace-nowrap truncate">
              {lang === "bn" ? "প্রতি ১.০ মিলের খরচ" : "Per 1.0 meal unit"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 whitespace-nowrap truncate">
              {lang === "bn" ? "মোট মিল (Total Meals)" : "Total Mess Meals"}
            </p>
            <p className="text-xl font-bold font-numeric text-[#B2D959] mt-1">
              {formatNumber(accounting.totalMessMeals, lang, 1)}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5 whitespace-nowrap truncate">
              {lang === "bn"
                ? `${formatNumber(accounting.activeMemberCount, lang)} জন সক্রিয় মেম্বার`
                : `${accounting.activeMemberCount} active members`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 whitespace-nowrap truncate">
              {lang === "bn" ? "বাজার খরচ (Food Bazar)" : "Food Bazar Cost"}
            </p>
            <p className="text-xl font-bold font-numeric text-white mt-1">
              {formatCurrency(accounting.totalFoodCost, lang, 0)}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5 whitespace-nowrap truncate">
              {lang === "bn" ? "মিল রেটে যুক্ত হয়" : "Included in meal rate"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 whitespace-nowrap truncate">
              {lang === "bn"
                ? "শেয়ার্ড বিল (Shared Bills)"
                : "Shared Utility Bills"}
            </p>
            <p className="text-xl font-bold font-numeric text-white mt-1">
              {formatCurrency(accounting.totalSharedCost, lang, 0)}
            </p>
            <p className="text-[11px] text-[#B2D959] mt-0.5 font-numeric whitespace-nowrap truncate">
              {lang === "bn"
                ? `জনপ্রতি ${formatCurrency(accounting.perMemberSharedCost, lang, 0)}`
                : `${formatCurrency(accounting.perMemberSharedCost, lang, 0)} / member`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 whitespace-nowrap truncate">
              {lang === "bn"
                ? "মোট জমা (Total Credit)"
                : "Total Deposits & Credit"}
            </p>
            <p className="text-xl font-bold font-numeric text-[#7EC151] mt-1">
              {formatCurrency(accounting.totalCredits, lang, 0)}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5 whitespace-nowrap truncate">
              {lang === "bn"
                ? `নগদ জমা: ${formatCurrency(accounting.totalCashDeposits, lang, 0)}`
                : `Cash: ${formatCurrency(accounting.totalCashDeposits, lang, 0)}`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 whitespace-nowrap truncate">
              {lang === "bn" ? "ক্যাশ ইন হ্যান্ড (Balance)" : "Cash in Hand"}
            </p>
            <p
              className={`text-xl font-bold font-numeric mt-1 ${
                accounting.cashInHand >= 0 ? "text-[#FED24F]" : "text-rose-300"
              }`}
            >
              {formatCurrency(accounting.cashInHand, lang, 0)}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5 whitespace-nowrap truncate">
              {lang === "bn"
                ? "মোট জমা − মোট মেস খরচ"
                : "Total Credit − Total Cost"}
            </p>
          </div>
        </div>
      </section>

      {/* 2. NOTICE BOARD BANNER & 2x2 QUICK ACTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Notice Board Banner */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#173125]/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#438A53] font-semibold">
                <Bell className="w-4 h-4 text-[#438A53]" />
                <span>
                  {lang === "bn" ? "নোটিশ বোর্ড" : "Mess Notice Board"}
                </span>
                <span>·</span>
                <span>{translateNoticeCategory(notice.category, lang)}</span>
              </div>
              {isManager && (
                <button
                  type="button"
                  onClick={() => {
                    setNoticeTitle(notice.title);
                    setNoticeMessage(notice.message);
                    setNoticeCategory(notice.category);
                    setEditingNotice(true);
                  }}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#F6F8F5] hover:bg-[#438A53]/10 text-xs font-medium text-[#173125] flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{lang === "bn" ? "নোটিশ আপডেট" : "Edit Notice"}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "bn"
                ? "মেসের জরুরি ঘোষণা ও বাজার/মিল সংক্রান্ত আপডেট এখানে দেখানো হয়"
                : "Important mess announcements and meal cutoff alerts for all members"}
            </p>

            <h2 className="text-base sm:text-lg font-bold text-[#173125] mt-3">
              {notice.title}
            </h2>
            <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
              {notice.message}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-4 mt-4 border-t border-slate-100">
            <span>
              {lang === "bn" ? "পোস্ট করেছেন:" : "Posted by:"} {notice.postedBy}
            </span>
            <span className="font-numeric">{notice.postedAt}</span>
          </div>
        </div>

        {/* 2x2 Quick Action Grid */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-[#173125]/10 p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#173125]">
              {lang === "bn"
                ? "দ্রুত অ্যাকশন (Quick Actions)"
                : "Quick Actions"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "bn"
                ? "এক ক্লিকে প্রতিদিনের মিল, বাজার খরচ, জমা ও রিপোর্ট পরিচালনা করুন"
                : "One-click shortcuts to daily meals, expenses, deposits, and reports"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              onClick={() => onNavigateTab("meals")}
              className="p-3.5 rounded-xl bg-[#F6F8F5] hover:bg-[#438A53]/10 border border-[#438A53]/20 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#173125] text-[#FED24F] flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-[#173125] mt-2.5 whitespace-nowrap truncate">
                {lang === "bn" ? "মিল এন্ট্রি করুন" : "Log Daily Meals"}
              </p>
              <p className="text-[11px] text-slate-500 whitespace-nowrap truncate">
                {lang === "bn"
                  ? "সকাল, দুপুর, রাত ও গেস্ট"
                  : "Breakfast, Lunch & Dinner"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("expenses")}
              className="p-3.5 rounded-xl bg-[#F6F8F5] hover:bg-[#438A53]/10 border border-[#438A53]/20 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#438A53] text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-[#173125] mt-2.5 whitespace-nowrap truncate">
                {lang === "bn" ? "বাজার ও বিল যোগ" : "Add Expense"}
              </p>
              <p className="text-[11px] text-slate-500 whitespace-nowrap truncate">
                {lang === "bn"
                  ? "খাবার বাজার ও শেয়ার্ড বিল"
                  : "Food bazar & utility bills"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("deposits")}
              className="p-3.5 rounded-xl bg-[#F6F8F5] hover:bg-[#438A53]/10 border border-[#438A53]/20 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#7EC151] text-[#173125] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-[#173125] mt-2.5 whitespace-nowrap truncate">
                {lang === "bn" ? "টাকা জমা নিন" : "Record Deposit"}
              </p>
              <p className="text-[11px] text-slate-500 whitespace-nowrap truncate">
                {lang === "bn"
                  ? "ক্যাশ, বিকাশ, নগদ ও ব্যাংক"
                  : "Cash, bKash, Nagad & Bank"}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("reports")}
              className="p-3.5 rounded-xl bg-[#F6F8F5] hover:bg-[#438A53]/10 border border-[#438A53]/20 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#FED24F] text-[#173125] flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-[#173125] mt-2.5 whitespace-nowrap truncate">
                {lang === "bn" ? "পূর্ণাঙ্গ হিসাব শীট" : "Full Accounting"}
              </p>
              <p className="text-[11px] text-slate-500 whitespace-nowrap truncate">
                {lang === "bn"
                  ? "মেম্বার স্টেটমেন্ট ও পিডিএফ"
                  : "Statements & PDF export"}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 3. USER INDIVIDUAL ACCOUNTING CARD & BAZAR ROSTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* User Individual Account Ledger Card */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-[#173125]/10 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#173125]">
                    {mySummary
                      ? lang === "bn"
                        ? `${mySummary.member.name}-এর হিসাব`
                        : `${mySummary.member.name}'s Account`
                      : lang === "bn"
                        ? "আমার হিসাব সারসংক্ষেপ"
                        : "My Account Summary"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === "bn"
                      ? `${monthLabel}-এর ব্যক্তিগত মিল ও ব্যালেন্স হিসাব`
                      : `Personal meals & balance for ${monthLabel}`}
                  </p>
                </div>
              </div>

              {mySummary && (
                <button
                  type="button"
                  onClick={() => onInspectMemberStatement(mySummary)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
                >
                  {lang === "bn" ? "বিস্তারিত" : "Statement"}
                </button>
              )}
            </div>

            {mySummary ? (
              <div className="mt-4 space-y-3.5">
                {/* Balance Status Banner */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    mySummary.netBalance >= 0
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-900"
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider block text-slate-500">
                      {lang === "bn"
                        ? "বর্তমান ব্যালেন্স স্ট্যাটাস"
                        : "Net Balance Status"}
                    </span>
                    <span className="text-lg font-bold font-numeric">
                      {formatCurrency(Math.abs(mySummary.netBalance), lang)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      mySummary.netBalance >= 0
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {mySummary.netBalance >= 0
                      ? lang === "bn"
                        ? "মেস থেকে পাবেন"
                        : "Refundable (Due to you)"
                      : lang === "bn"
                        ? "বকেয়া দিতে হবে"
                        : "Pending Due (Pay to Mess)"}
                  </span>
                </div>

                {/* 4 Key Accounting Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      {lang === "bn" ? "মোট মিল" : "Total Meals"}
                    </span>
                    <span className="text-base font-bold font-numeric text-[#173125]">
                      {mySummary.totalMeals.toFixed(1)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      {lang === "bn" ? "মিল খরচ" : "Meal Cost"}
                    </span>
                    <span className="text-base font-bold font-numeric text-[#173125]">
                      {formatCurrency(mySummary.mealCost, lang)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      {lang === "bn" ? "শেয়ার্ড খরচ" : "Shared Cost"}
                    </span>
                    <span className="text-base font-bold font-numeric text-[#173125]">
                      {formatCurrency(mySummary.sharedCost, lang)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      {lang === "bn" ? "মোট জমা / ক্রেডিট" : "Total Credit"}
                    </span>
                    <span className="text-base font-bold font-numeric text-emerald-600">
                      {formatCurrency(mySummary.totalCredit, lang)}
                    </span>
                  </div>
                </div>

                {/* Breakdown details */}
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>
                      {lang === "bn"
                        ? "নাস্তা / দুপুর / রাত:"
                        : "B / L / D Counts:"}
                    </span>
                    <span className="font-numeric font-semibold text-[#173125]">
                      {mySummary.breakfastCount} / {mySummary.lunchCount} /{" "}
                      {mySummary.dinnerCount}
                      {mySummary.guestMealCount > 0
                        ? ` (+${mySummary.guestMealCount} Guest)`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {lang === "bn"
                        ? "নগদ / ব্যাংক জমা:"
                        : "Cash / Bank Deposit:"}
                    </span>
                    <span className="font-numeric font-semibold text-[#173125]">
                      {formatCurrency(mySummary.cashDeposit, lang)}
                    </span>
                  </div>
                  {mySummary.paidExpenseCredit > 0 && (
                    <div className="flex justify-between">
                      <span>
                        {lang === "bn"
                          ? "নিজের পকেট থেকে বাজার খরচ:"
                          : "Bazar Paid from Pocket:"}
                      </span>
                      <span className="font-numeric font-semibold text-emerald-600">
                        {formatCurrency(mySummary.paidExpenseCredit, lang)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-[#173125]">
                    <span>
                      {lang === "bn"
                        ? "মোট খরচ (মিল + শেয়ার্ড):"
                        : "Total Expense (Meal + Shared):"}
                    </span>
                    <span className="font-numeric">
                      {formatCurrency(mySummary.totalCost, lang)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                {lang === "bn"
                  ? "এই ইউজারের জন্য কোনো সক্রিয় মেম্বার হিসাব পাওয়া যায়নি।"
                  : "No accounting record linked yet."}
              </div>
            )}
          </div>
        </div>

        {/* Bazar Roster Card */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-[#173125]/10 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-[#173125] flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#438A53]" />
                  <span>
                    {lang === "bn"
                      ? "বাজার রোস্টার (Bazar Duty Roster)"
                      : "Bazar Duty Roster"}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === "bn"
                    ? "কোন তারিখে কে বাজার করবেন তার তালিকা ও স্ট্যাটাস"
                    : "Scheduled bazar dates by member with completion tracking"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRosterModal(true)}
                className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#173125] hover:bg-[#438A53] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#FED24F]" />
                <span>{lang === "bn" ? "রোস্টার যোগ" : "Add Duty"}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-3">
              {rosters.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  {lang === "bn"
                    ? "এই মাসে এখনো কোনো বাজার রোস্টার যোগ করা হয়নি"
                    : "No bazar roster entries scheduled yet"}
                </p>
              ) : (
                rosters.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-numeric font-semibold text-[#438A53]">
                          {r.date}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm font-semibold text-[#173125] truncate">
                          {r.memberName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {r.note ||
                          (lang === "bn"
                            ? "নিয়মিত বাজার"
                            : "Regular bazar duty")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleRosterStatus(r.id)}
                        className={`min-h-[30px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 whitespace-nowrap transition-colors ${
                          r.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {r.status === "COMPLETED"
                            ? lang === "bn"
                              ? "সম্পন্ন"
                              : "Done"
                            : lang === "bn"
                              ? "আসন্ন"
                              : "Upcoming"}
                        </span>
                      </button>
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => onDeleteRoster(r.id)}
                          aria-label={`Delete roster ${r.memberName}`}
                          className="min-h-[30px] min-w-[30px] rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. DUE REMINDER BANNER (1-CLICK WHATSAPP & MESSENGER SHARE) */}
      {dueMembers.length > 0 && (
        <section className="rounded-2xl bg-white border border-rose-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#173125]">
                {lang === "bn"
                  ? `বকেয়া তাগাদা ও রিমাইন্ডার (${formatNumber(dueMembers.length, lang)} জন মেম্বারের বকেয়া আছে)`
                  : `Due Payment Reminders (${dueMembers.length} members have pending dues)`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === "bn"
                  ? "১-ক্লিকে হোয়াটসঅ্যাপ বা মেসেঞ্জারে স্বয়ংক্রিয় হিসাবসহ বকেয়া মেসেজ পাঠান"
                  : "Send formatted accounting reminder directly via WhatsApp, Messenger, or Copy text"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {dueMembers.map((summary) => {
              const reminderText = buildDueReminderMessage(
                messName,
                monthLabel,
                summary,
                lang,
              );
              const cleanPhone = summary.member.phone.replace(/[^0-9]/g, "");
              const bdPhone = cleanPhone.startsWith("88")
                ? cleanPhone
                : `88${cleanPhone}`;
              const waUrl = `https://wa.me/${bdPhone}?text=${encodeURIComponent(reminderText)}`;
              const fbUrl = `https://m.me/?text=${encodeURIComponent(reminderText)}`;

              return (
                <div
                  key={summary.member.id}
                  className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#173125] truncate">
                      {summary.member.name}
                    </p>
                    <p className="text-xs text-rose-700 font-numeric font-semibold mt-0.5">
                      {lang === "bn" ? "বকেয়া (Due):" : "Due:"}{" "}
                      {formatCurrency(Math.abs(summary.netBalance), lang, 0)} ·{" "}
                      <span className="text-slate-600 font-normal">
                        {lang === "bn" ? "মিল:" : "Meals:"}{" "}
                        {formatNumber(summary.totalMeals, lang, 1)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-[#173125] hover:bg-[#438A53] text-white text-xs font-medium flex items-center gap-1 whitespace-nowrap transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#7EC151]" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={fbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1 whitespace-nowrap transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-[#FED24F]" />
                      <span>Messenger</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyReminder(summary)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-[#173125] flex items-center gap-1 whitespace-nowrap transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>
                        {copiedMemberId === summary.member.id
                          ? lang === "bn"
                            ? "কপি হয়েছে"
                            : "Copied"
                          : lang === "bn"
                            ? "কপি"
                            : "Copy"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. PENDING JOIN REQUESTS APPROVAL CARD */}
      {/* <section className="rounded-2xl bg-white border border-[#173125]/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#173125] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? `মেস জয়েন রিকোয়েস্ট (${formatNumber(pendingRequests.length, lang)}টি অপেক্ষমাণ)`
                  : `Pending Mess Join Requests (${pendingRequests.length})`}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? `মেস কোড "${messId}" ব্যবহার করে নতুন মেম্বারদের পাঠানো রিকোয়েস্ট ম্যানেজার অনুমোদন করতে পারবেন`
                : `Approve or reject members requesting to join mess code "${messId}"`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowJoinForm(!showJoinForm)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#F6F8F5] hover:bg-[#438A53]/10 text-xs font-semibold text-[#173125] flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#438A53]" />
            <span>
              {lang === 'bn' ? 'নতুন জয়েন রিকোয়েস্ট পাঠান' : 'Send Join Request'}
            </span>
          </button>
        </div>

        {showJoinForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!joinName.trim()) return;
              onSimulateJoinRequest(joinName.trim(), joinEmail.trim());
              setJoinName('');
              setJoinEmail('');
              setShowJoinForm(false);
            }}
            className="mt-3 p-3.5 rounded-xl bg-[#F6F8F5] border border-slate-200 flex flex-wrap items-center gap-2.5"
          >
            <input
              type="text"
              required
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder={lang === 'bn' ? 'আবেদনকারীর নাম *' : 'Applicant Name *'}
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
            />
            <input
              type="email"
              value={joinEmail}
              onChange={(e) => setJoinEmail(e.target.value)}
              placeholder={lang === 'bn' ? 'জিমেইল (ঐচ্ছিক)' : 'Gmail (optional)'}
              className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
            />
            <button
              type="submit"
              className="min-h-[36px] px-4 py-2 rounded-lg bg-[#173125] text-white text-xs font-semibold whitespace-nowrap"
            >
              {lang === 'bn' ? 'রিকোয়েস্ট জমা দিন' : 'Submit Request'}
            </button>
          </form>
        )}

        {pendingRequests.length === 0 ? (
          <p className="text-xs text-slate-400 mt-3">
            {lang === 'bn'
              ? 'বর্তমানে কোনো পেন্ডিং জয়েন রিকোয়েস্ট নেই।'
              : 'No pending join requests right now.'}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 mt-3">
            {pendingRequests.map((req) => (
              <div
                key={req.userId}
                className="py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-bold text-[#173125]">{req.userName}</p>
                  <p className="text-xs text-slate-500">
                    {req.userEmail || 'No email'} · Mess Code: {req.messId}
                  </p>
                </div>
                {isManager && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onApproveJoinRequest(req)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#438A53] text-white text-xs font-semibold whitespace-nowrap"
                    >
                      {lang === 'bn' ? 'অনুমোদন (Approve)' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectJoinRequest(req)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold whitespace-nowrap"
                    >
                      {lang === 'bn' ? 'বাতিল (Reject)' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section> */}

      {/* 6. MEMBER BALANCE SUMMARY LIST & ACTIVITY AUDIT LOG */}
      <div className="grid grid-cols-1  gap-6 items-start">
        {/* Member Balance Summary List */}
        <div className=" rounded-2xl bg-white border border-[#173125]/10 p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#173125]">
                {lang === "bn"
                  ? "মেম্বার ব্যালেন্স সামারি (পাবে / বকেয়া)"
                  : "Member Net Balance Summary"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === "bn"
                  ? "নেট ব্যালেন্স = মোট জমা (নগদ + নিজের পকেট থেকে বাজার) − মোট খরচ (মিল + শেয়ার্ড)"
                  : "Net Balance = Total Credit (Deposits + Out-of-Pocket Paid) − Total Cost"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("reports")}
              className="text-xs font-semibold text-[#438A53] hover:underline whitespace-nowrap"
            >
              {lang === "bn" ? "বিস্তারিত টেবিল →" : "Full Table →"}
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-4">
            {accounting.memberSummaries.map((ms) => {
              const isRefundable = ms.netBalance >= 0;
              return (
                <div
                  key={ms.member.id}
                  onClick={() => onInspectMemberStatement(ms)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onInspectMemberStatement(ms);
                    }
                  }}
                  className="py-3 px-2 -mx-2 rounded-xl hover:bg-[#F6F8F5] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#173125] truncate">
                        {ms.member.name}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-numeric">
                        {ms.member.roomNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-numeric mt-0.5">
                      {lang === "bn" ? "মিল:" : "Meals:"}{" "}
                      {formatNumber(ms.totalMeals, lang, 1)} ·{" "}
                      {lang === "bn" ? "খরচ:" : "Cost:"}{" "}
                      {formatCurrency(ms.totalCost, lang, 0)} ·{" "}
                      {lang === "bn" ? "জমা:" : "Credit:"}{" "}
                      {formatCurrency(ms.totalCredit, lang, 0)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold font-numeric ${
                        isRefundable ? "text-[#438A53]" : "text-rose-600"
                      }`}
                    >
                      {isRefundable ? "+" : "-"}
                      {formatCurrency(Math.abs(ms.netBalance), lang, 0)}
                    </p>
                    <p
                      className={`text-[11px] font-semibold ${
                        isRefundable ? "text-[#438A53]" : "text-rose-600"
                      }`}
                    >
                      {isRefundable
                        ? lang === "bn"
                          ? "পাবে (Refundable)"
                          : "Refundable"
                        : lang === "bn"
                          ? "বকেয়া (Due)"
                          : "Due"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Audit Log */}
        <div className="rounded-2xl bg-white border border-[#173125]/10 p-5">
          <h2 className="text-base font-bold text-[#173125]">
            {lang === "bn"
              ? "সাম্প্রতিক অ্যাক্টিভিটি লগ (Audit Log)"
              : "Recent Activity Audit Log"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === "bn"
              ? "মেসের সর্বশেষ মিল, খরচ এবং জমার পরিবর্তনের রেকর্ড"
              : "Chronological audit trail of meals, expenses, and deposits"}
          </p>

          <div className="divide-y divide-slate-100 mt-4">
            {activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#173125] truncate">
                    {log.title}
                  </p>
                  <span className="text-[11px] font-numeric text-slate-400 shrink-0">
                    {log.timeText}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                  {log.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notice Edit Modal */}
      {editingNotice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#173125]">
              {lang === "bn" ? "নোটিশ বোর্ড আপডেট করুন" : "Update Mess Notice"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === "bn" ? "ক্যাটাগরি" : "Category"}
                </label>
                <select
                  value={noticeCategory}
                  onChange={(e) =>
                    setNoticeCategory(e.target.value as NoticeCategory)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  <option value="URGENT">URGENT (জরুরি)</option>
                  <option value="MEAL_OFF">MEAL_OFF (মিল বন্ধ)</option>
                  <option value="BAZAR">BAZAR (বাজার সংক্রান্ত)</option>
                  <option value="GENERAL">GENERAL (সাধারণ)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === "bn" ? "শিরোনাম" : "Notice Title"}
                </label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === "bn" ? "বিস্তারিত বার্তা" : "Message"}
                </label>
                <textarea
                  rows={3}
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotice(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaveNotice({
                    id: "AUDIT_NOTICE_9D",
                    title: noticeTitle.trim() || "-",
                    message: noticeMessage.trim(),
                    category: noticeCategory,
                    postedBy: notice.postedBy,
                    postedAt: new Date().toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  });
                  setEditingNotice(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#173125] text-white text-xs font-semibold"
              >
                {lang === "bn" ? "নোটিশ প্রকাশ করুন" : "Publish Notice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Roster Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#173125]">
              {lang === "bn"
                ? "নতুন বাজার রোস্টার যোগ করুন"
                : "Schedule Bazar Roster"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === "bn" ? "বাজারের তারিখ" : "Bazar Date"}
                </label>
                <input
                  type="date"
                  value={rosterDate}
                  onChange={(e) => setRosterDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-numeric"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === "bn" ? "দায়িত্বপ্রাপ্ত মেম্বার" : "Assigned Member"}
                </label>
                <select
                  value={rosterMemberId}
                  onChange={(e) => setRosterMemberId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === "bn" ? "বাজারের ফর্দ বা নোট" : "Bazar Note"}
                </label>
                <input
                  type="text"
                  value={rosterNote}
                  onChange={(e) => setRosterNote(e.target.value)}
                  placeholder={
                    lang === "bn"
                      ? "যেমন: মাছ, সবজি ও ডিম বাজার"
                      : "e.g. Fish, vegetables & eggs"
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddRoster(rosterDate, rosterMemberId, rosterNote);
                  setRosterNote("");
                  setShowRosterModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#173125] text-white text-xs font-semibold"
              >
                {lang === "bn" ? "রোস্টার সেভ করুন" : "Save Roster"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
