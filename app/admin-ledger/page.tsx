'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
  Printer,
  DollarSign,
  Building,
  User,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Calendar,
  Sparkles,
  CreditCard,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  AppUser,
  fetchCurrentUser,
  fetchMessDataFromMongo,
  fetchAdminReceivables,
  createAdminReceivable,
  recordReceivablePayment,
  updateAdminReceivable,
  deleteAdminReceivable,
  AdminReceivableRecord,
  LedgerEntryType,
} from '@/lib/mongo-client';
import { Member } from '@/lib/types';
import { decodeMemberFromCloud } from '@/lib/accounting';
import { formatCurrency, formatNumber, toBanglaDigits } from '@/lib/i18n';
import { CustomSelect } from '@/components/CustomSelect';

const CATEGORIES = [
  { id: 'PERSONAL_LOAN', labelBn: 'ব্যক্তিগত ধার / ঋণ', labelEn: 'Personal Loan' },
  { id: 'ADVANCE', labelBn: 'বিল অ্যাডভান্স', labelEn: 'Bill Advance' },
  { id: 'UTILITY', labelBn: 'ইউটিলিটি ও মেরামত', labelEn: 'Utility & Repair' },
  { id: 'FEAST', labelBn: 'মেস ভোজ / পার্টি', labelEn: 'Feast / Party' },
  { id: 'ROOM_EXPENSE', labelBn: 'রুম সংক্রান্ত খরচ', labelEn: 'Room Expense' },
  { id: 'SALARY_PAYABLE', labelBn: 'বেতন ও পারিশ্রমিক', labelEn: 'Salary & Wages' },
  { id: 'OTHER', labelBn: 'অন্যান্য হিসাব', labelEn: 'Other Dues' },
];

const QUICK_SUGGESTIONS_RECEIVABLE = [
  'ব্যক্তিগত ধার (Emergency Loan)',
  'ওয়াইফাই বিল অ্যাডভান্স',
  'বিদ্যুৎ বিল রিচার্জ',
  'রুম মেরামতের খরচ',
  'মেস স্পেশাল ডিনার চাঁদা',
  'গ্যাস সিলিন্ডার অ্যাডভান্স',
  'খালা/বুয়ার অগ্রিম বেতন',
];

const QUICK_SUGGESTIONS_PAYABLE = [
  'মেম্বারের বাজার খরচের টাকা ফেরত',
  'খালা/বুয়ার বাকি বেতন',
  'বাড়িওয়ালার সার্ভিস চার্জ/ভাড়া বাকি',
  'দোকানদারের বাকি বিল',
  'মেম্বারের থেকে ব্যক্তিগত ধার',
  'ওয়াইফাই বা বিদ্যুৎ বিল রিফান্ড',
];

export default function AdminLedgerPage() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [messId, setMessId] = useState<string>('9D');
  const [messName, setMessName] = useState<string>('My Mess');

  // Ledger records
  const [records, setRecords] = useState<AdminReceivableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ id: number; title: string; subtitle?: string; tone?: string } | null>(null);

  // Tabs: 'ALL' | 'RECEIVABLE' | 'PAYABLE'
  const [activeTab, setActiveTab] = useState<'ALL' | 'RECEIVABLE' | 'PAYABLE'>('ALL');

  // Desktop View Mode: 'grid' (compact cards 3-col) | 'table' (compact data table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'PAID'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Add / Edit Entry Drawer Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<LedgerEntryType>('RECEIVABLE');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('CUSTOM');
  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [debtorRoom, setDebtorRoom] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('PERSONAL_LOAN');
  const [totalAmount, setTotalAmount] = useState('');
  const [initialPaidAmount, setInitialPaidAmount] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Installment Payment Modal State
  const [paymentModalItem, setPaymentModalItem] = useState<AdminReceivableRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Expanded History cards
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const showToast = (title: string, subtitle?: string, tone: 'success' | 'danger' | 'info' = 'success') => {
    setToast({ id: Date.now(), title, subtitle, tone });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  // Check auth and load mess data
  useEffect(() => {
    fetchCurrentUser()
      .then(async (user) => {
        if (user) {
          setCurrentUser(user);
          const mId = user.messId || '9D';
          setMessId(mId);

          try {
            const data = await fetchMessDataFromMongo(mId);
            if (data.settings?.messName) {
              setMessName(data.settings.messName);
            }
            const decodedMembers = data.records
              .filter((r) => r.recordType === 'MEMBER')
              .map(decodeMemberFromCloud);
            setMembers(decodedMembers);
          } catch (e) {
            console.error('Error fetching mess members:', e);
          }

          if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
            await loadLedgerData(mId);
          }
        }
      })
      .finally(() => {
        setAuthChecked(true);
        setLoading(false);
      });
  }, []);

  const loadLedgerData = async (mId = messId) => {
    try {
      setRefreshing(true);
      const data = await fetchAdminReceivables(mId);
      setRecords(data);
    } catch (err: any) {
      showToast(lang === 'bn' ? 'ডাটা লোড করতে সমস্যা হয়েছে' : 'Failed to load ledger', err.message, 'danger');
    } finally {
      setRefreshing(false);
    }
  };

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  // KPI Calculations
  const stats = useMemo(() => {
    let totalReceivable = 0;
    let collectedReceivable = 0;
    let pendingReceivable = 0;

    let totalPayable = 0;
    let settledPayable = 0;
    let pendingPayable = 0;

    let overdueCount = 0;
    const today = new Date().toISOString().split('T')[0];

    records.forEach((r) => {
      const isPayable = r.type === 'PAYABLE';
      const tot = Number(r.totalAmount) || 0;
      const paid = Number(r.paidAmount) || 0;
      const rem = Number(r.remainingAmount) || 0;

      if (isPayable) {
        totalPayable += tot;
        settledPayable += paid;
        pendingPayable += rem;
      } else {
        totalReceivable += tot;
        collectedReceivable += paid;
        pendingReceivable += rem;
      }

      if (rem > 0 && r.dueDate && r.dueDate < today) {
        overdueCount += 1;
      }
    });

    const netPosition = pendingReceivable - pendingPayable;

    return {
      totalReceivable,
      collectedReceivable,
      pendingReceivable,
      totalPayable,
      settledPayable,
      pendingPayable,
      netPosition,
      overdueCount,
      totalRecords: records.length,
    };
  }, [records]);

  // Handle member picker
  const handleSelectMember = (val: string) => {
    setSelectedMemberId(val);
    if (val === 'CUSTOM') {
      setDebtorName('');
      setDebtorPhone('');
      setDebtorRoom('');
    } else {
      const found = members.find((m) => String(m.id) === val);
      if (found) {
        setDebtorName(found.name);
        setDebtorPhone(found.phone || '');
        setDebtorRoom(found.roomNumber || '');
      }
    }
  };

  // Open Add Form
  const handleOpenAddForm = (type: LedgerEntryType = 'RECEIVABLE') => {
    setEditingId(null);
    setFormType(type);
    setSelectedMemberId('CUSTOM');
    setDebtorName('');
    setDebtorPhone('');
    setDebtorRoom('');
    setTitle('');
    setCategory(type === 'PAYABLE' ? 'SALARY_PAYABLE' : 'PERSONAL_LOAN');
    setTotalAmount('');
    setInitialPaidAmount('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNotes('');
    setShowFormModal(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (item: AdminReceivableRecord) => {
    setEditingId(item._id);
    setFormType(item.type || 'RECEIVABLE');
    if (item.memberId) {
      setSelectedMemberId(String(item.memberId));
    } else {
      setSelectedMemberId('CUSTOM');
    }
    setDebtorName(item.debtorName);
    setDebtorPhone(item.debtorPhone || '');
    setDebtorRoom(item.debtorRoom || '');
    setTitle(item.title);
    setCategory(item.category);
    setTotalAmount(String(item.totalAmount));
    setInitialPaidAmount(String(item.paidAmount || ''));
    setIssueDate(item.issueDate || new Date().toISOString().split('T')[0]);
    setDueDate(item.dueDate || '');
    setNotes(item.notes || '');
    setShowFormModal(true);
  };

  // Save Entry (Create / Update)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtorName.trim()) {
      alert(
        formType === 'PAYABLE'
          ? lang === 'bn'
            ? 'টাকা কে পাবে তার নাম দিন'
            : 'Enter creditor name'
          : lang === 'bn'
          ? 'কার কাছে টাকা পাবেন তার নাম দিন'
          : 'Enter debtor name'
      );
      return;
    }
    if (!title.trim()) {
      alert(lang === 'bn' ? 'কিসের টাকা (বিবরণ / কারণ) দিন' : 'Enter reason or title');
      return;
    }
    const numTotal = parseFloat(totalAmount);
    if (isNaN(numTotal) || numTotal <= 0) {
      alert(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter valid total amount');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateAdminReceivable(editingId, {
          type: formType,
          debtorName: debtorName.trim(),
          debtorPhone: debtorPhone.trim(),
          debtorRoom: debtorRoom.trim(),
          memberId: selectedMemberId !== 'CUSTOM' ? Number(selectedMemberId) : undefined,
          title: title.trim(),
          category,
          totalAmount: numTotal,
          issueDate,
          dueDate,
          notes,
          messId,
        });
        showToast(
          lang === 'bn' ? 'হিসাব সফলভাবে আপডেট হয়েছে' : 'Entry updated successfully',
          `${debtorName} — ৳${numTotal}`,
          'success'
        );
      } else {
        const numInitial = parseFloat(initialPaidAmount) || 0;
        await createAdminReceivable({
          messId,
          type: formType,
          debtorName: debtorName.trim(),
          debtorPhone: debtorPhone.trim(),
          debtorRoom: debtorRoom.trim(),
          memberId: selectedMemberId !== 'CUSTOM' ? Number(selectedMemberId) : undefined,
          title: title.trim(),
          category,
          totalAmount: numTotal,
          paidAmount: numInitial,
          issueDate,
          dueDate,
          notes,
        });
        showToast(
          formType === 'PAYABLE'
            ? lang === 'bn'
              ? 'নতুন দেনার হিসাব যুক্ত হয়েছে'
              : 'New payable entry added'
            : lang === 'bn'
            ? 'নতুন পাওনার হিসাব যুক্ত হয়েছে'
            : 'New receivable entry added',
          `${debtorName} — ৳${numTotal}`,
          'success'
        );
      }
      setShowFormModal(false);
      await loadLedgerData();
    } catch (err: any) {
      alert(err.message || 'সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Installment Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalItem) return;
    const numPay = parseFloat(payAmount);
    if (isNaN(numPay) || numPay <= 0) {
      alert(lang === 'bn' ? 'সঠিক টাকার পরিমাণ দিন' : 'Enter valid payment amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      await recordReceivablePayment({
        id: paymentModalItem._id,
        amount: numPay,
        date: payDate,
        notes: payNotes,
        messId,
      });
      const isPayable = paymentModalItem.type === 'PAYABLE';
      showToast(
        isPayable
          ? lang === 'bn'
            ? 'টাকা পরিশোধ রেকর্ড হয়েছে'
            : 'Payment recorded successfully'
          : lang === 'bn'
          ? 'টাকা আদায়/জমা সম্পন্ন হয়েছে'
          : 'Receipt recorded successfully',
        `${paymentModalItem.debtorName} — ৳${numPay}`,
        'success'
      );
      setPaymentModalItem(null);
      await loadLedgerData();
    } catch (err: any) {
      alert(err.message || 'পেমেন্ট রেকর্ড করতে সমস্যা হয়েছে');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Delete Entry
  const handleDelete = async (item: AdminReceivableRecord) => {
    const isPayable = item.type === 'PAYABLE';
    const confirmMsg =
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে "${item.debtorName}"-এর ${isPayable ? 'দেনার' : 'পাওনার'} "${item.title}" হিসাবটি মুছে ফেলতে চান?`
        : `Are you sure you want to delete the record for ${item.debtorName}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteAdminReceivable(item._id, messId);
      showToast(lang === 'bn' ? 'হিসাব মুছে ফেলা হয়েছে' : 'Record deleted', item.title, 'info');
      await loadLedgerData();
    } catch (err: any) {
      alert(err.message || 'ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  // WhatsApp Message Generator in 100% Bangla
  const getWhatsAppUrl = (item: AdminReceivableRecord) => {
    const rawPhone = item.debtorPhone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const bdPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
    const isPayable = item.type === 'PAYABLE';

    let message = '';
    if (isPayable) {
      message = `আসসালামু আলাইকুম ${item.debtorName} ভাই,
"${messName}" মেসের হিসাব থেকে জানানো যাচ্ছে যে,
"${item.title}" বাবদ আপনার মোট প্রাপ্য ছিল ৳${toBanglaDigits(item.totalAmount)}।
• ইতিমধ্যে পরিশোধিত: ৳${toBanglaDigits(item.paidAmount || 0)}
👉 আপনার কাছে এখনও বাকি আছে: ৳${toBanglaDigits(item.remainingAmount)}
${item.dueDate ? `• সম্ভাব্য পরিশোধের তারিখ: ${toBanglaDigits(item.dueDate)}\n` : ''}
বাকি টাকাটি দ্রুত পরিশোধ করে দেওয়া হবে ইনশাআল্লাহ। ধন্যবাদ!
— ${messName} ম্যানেজমেন্ট`;
    } else {
      message = `আসসালামু আলাইকুম ${item.debtorName} ভাই,
"${messName}" মেসের হিসাব থেকে জানানো যাচ্ছে যে,
"${item.title}" বাবদ আপনার নিকট পাওনা বাকি আছে ৳${toBanglaDigits(item.remainingAmount)}।
• মোট পাওনা: ৳${toBanglaDigits(item.totalAmount)}
• ইতিমধ্যে পরিশোধিত: ৳${toBanglaDigits(item.paidAmount || 0)}
👉 অবশিষ্ট বকেয়া: ৳${toBanglaDigits(item.remainingAmount)}
${item.dueDate ? `• পরিশোধের শেষ তারিখ: ${toBanglaDigits(item.dueDate)}\n` : ''}
অনুগ্রহ করে বকেয়া টাকাটি দ্রুত পরিশোধ করার অনুরোধ করা হচ্ছে। ধন্যবাদ!
— ${messName} ম্যানেজমেন্ট`;
    }

    return `https://wa.me/${bdPhone}?text=${encodeURIComponent(message)}`;
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return records.filter((item) => {
      if (activeTab === 'RECEIVABLE' && item.type === 'PAYABLE') return false;
      if (activeTab === 'PAYABLE' && item.type !== 'PAYABLE') return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.debtorName.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesRoom = item.debtorRoom?.toLowerCase().includes(q);
        const matchesPhone = item.debtorPhone?.includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesTitle && !matchesRoom && !matchesPhone && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [records, activeTab, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F6F8F5] text-[#173125] flex flex-col font-sans pb-20 sm:pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          className="fixed top-4 right-3 left-3 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#173125] text-white border border-[#438A53]/40 shadow-xl animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                toast.tone === 'danger'
                  ? 'bg-rose-400'
                  : toast.tone === 'info'
                  ? 'bg-sky-400'
                  : 'bg-[#FED24F]'
              }`}
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{toast.title}</div>
              {toast.subtitle && <div className="text-[11px] text-white/70 truncate">{toast.subtitle}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/60 hover:text-white p-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP STICKY HEADER (CLEAN & COMPACT ON BOTH PC & MOBILE)
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#173125] text-white border-b border-[#438A53]/30 shadow-sm no-print">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition shrink-0 active:scale-95"
              title={lang === 'bn' ? 'মেস ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-4 h-4 text-[#FED24F]" />
            </Link>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#438A53] flex items-center justify-center text-[#FED24F] shrink-0">
                <HandCoins className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm font-bold text-white truncate">
                    {lang === 'bn' ? 'ব্যক্তিগত পাওনা ও দেনা খাতা' : 'Admin Receivables & Payables'}
                  </h1>
                  <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FED24F] text-[#173125]">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-[#B2D959] truncate hidden xs:block">
                  {messName} ({messId})
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={() => loadLedgerData()}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition shrink-0 active:scale-95"
              title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B2D959] ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="h-8 px-2 rounded-lg border border-white/20 hover:bg-white/10 text-[11px] font-semibold text-white transition flex items-center justify-center shrink-0"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>

            {/* Print Button (Desktop only) */}
            <button
              type="button"
              onClick={() => window.print()}
              className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white items-center gap-1.5 transition hidden md:flex"
            >
              <Printer className="w-3.5 h-3.5 text-[#FED24F]" />
              <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            {/* Desktop Add Entry Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenAddForm('RECEIVABLE')}
                className="hidden sm:flex h-8 px-3 rounded-lg bg-[#FED24F] hover:bg-[#FED24F]/90 active:scale-95 text-[#173125] text-xs font-bold items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন এন্ট্রি' : 'Add Entry'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Container: max-w-6xl for elegant compact desktop proportions */}
      <main className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-3.5 sm:py-5 flex-1">
        {/* Auth Check Warning if not admin */}
        {authChecked && !isAdmin ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md mx-auto mt-8 text-center border border-rose-200 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">
              {lang === 'bn' ? 'অ্যাক্সেস সংরক্ষিত (শুধুমাত্র অ্যাডমিন)' : 'Admin Access Restricted'}
            </h2>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {lang === 'bn'
                ? 'ব্যক্তিগত পাওনা ও দেনার খাতাটি শুধুমাত্র মেসের Super Admin এবং Admin-দের ব্যবহারের জন্য প্রস্তুত করা হয়েছে।'
                : 'This ledger is strictly accessible by Mess Super Admins and Admins.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#173125] text-[#FED24F] text-xs font-bold hover:bg-[#234736] transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Return to Dashboard'}</span>
            </Link>
          </div>
        ) : loading ? (
          // Loading Skeleton
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 sm:h-22 rounded-xl bg-white border border-slate-200/60 p-3" />
              ))}
            </div>
            <div className="h-10 bg-white rounded-xl border border-slate-200/60" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white rounded-xl border border-slate-200/60" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 sm:space-y-4">
            {/* =========================================================================
                1. 4 KPI SUMMARY CARDS (COMPACT & SLEEK ON PC & MOBILE)
               ========================================================================= */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Card 1: মোট পাওনা (To Receive) */}
              <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 truncate">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{lang === 'bn' ? 'পাওনা (আমি পাবো)' : 'Receivables'}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shrink-0">
                    {lang === 'bn' ? 'প্রাপ্য' : 'In'}
                  </span>
                </div>
                <div>
                  <div className="text-base sm:text-xl font-black text-emerald-950 font-numeric tracking-tight truncate">
                    ৳{formatNumber(stats.pendingReceivable, lang)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between gap-1">
                    <span className="truncate">{lang === 'bn' ? 'মোট:' : 'Tot:'} ৳{formatNumber(stats.totalReceivable, lang)}</span>
                    <span className="text-emerald-700 font-medium shrink-0">
                      {lang === 'bn' ? 'আদায়:' : 'Paid:'} ৳{formatNumber(stats.collectedReceivable, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: মোট দেনা (To Pay) */}
              <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-xs flex flex-col justify-between hover:border-rose-200 transition">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1 truncate">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">{lang === 'bn' ? 'দেনা (আমি দেবো)' : 'Payables'}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 shrink-0">
                    {lang === 'bn' ? 'দেয়' : 'Out'}
                  </span>
                </div>
                <div>
                  <div className="text-base sm:text-xl font-black text-rose-950 font-numeric tracking-tight truncate">
                    ৳{formatNumber(stats.pendingPayable, lang)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between gap-1">
                    <span className="truncate">{lang === 'bn' ? 'মোট:' : 'Tot:'} ৳{formatNumber(stats.totalPayable, lang)}</span>
                    <span className="text-rose-700 font-medium shrink-0">
                      {lang === 'bn' ? 'শোধ:' : 'Paid:'} ৳{formatNumber(stats.settledPayable, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: নেট ব্যালেন্স (Net Position) */}
              <div className="bg-white rounded-xl p-3 border border-amber-100 shadow-xs flex flex-col justify-between hover:border-amber-200 transition">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 truncate">
                    <Scale className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{lang === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}</span>
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold border shrink-0 ${
                      stats.netPosition >= 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {stats.netPosition >= 0
                      ? lang === 'bn'
                        ? 'সারপ্লাস'
                        : 'Surplus'
                      : lang === 'bn'
                      ? 'ঘাটতি'
                      : 'Deficit'}
                  </span>
                </div>
                <div>
                  <div
                    className={`text-base sm:text-xl font-black font-numeric tracking-tight truncate ${
                      stats.netPosition >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {stats.netPosition >= 0 ? '+' : ''}৳{formatNumber(stats.netPosition, lang)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {stats.netPosition >= 0
                      ? lang === 'bn'
                        ? 'প্রাপ্য দেনার চেয়ে বেশি'
                        : 'Positive position'
                      : lang === 'bn'
                      ? 'দেনা পাওনার চেয়ে বেশি'
                      : 'Negative position'}
                  </div>
                </div>
              </div>

              {/* Card 4: মোট নিষ্পত্তি */}
              <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-xs flex flex-col justify-between hover:border-blue-200 transition">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{lang === 'bn' ? 'নিষ্পত্তি' : 'Settled'}</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 shrink-0">
                    {toBanglaDigits(stats.totalRecords)} {lang === 'bn' ? 'টি' : ''}
                  </span>
                </div>
                <div>
                  <div className="text-base sm:text-xl font-black text-blue-950 font-numeric tracking-tight truncate">
                    ৳{formatNumber(stats.collectedReceivable + stats.settledPayable, lang)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between gap-1">
                    <span className="truncate">{lang === 'bn' ? 'আদায় ও শোধ' : 'Settled'}</span>
                    {stats.overdueCount > 0 && (
                      <span className="text-rose-600 font-bold shrink-0">
                        {toBanglaDigits(stats.overdueCount)} {lang === 'bn' ? 'বকেয়া' : 'overdue'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                2. CONSOLIDATED TOOLBAR (COMPACT ON PC & TOUCH-FRIENDLY ON MOBILE)
               ========================================================================= */}
            <div className="bg-white rounded-xl p-2 sm:p-2.5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
              {/* Left / Top: Segmented Tabs */}
              <div className="grid grid-cols-3 sm:inline-flex gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 truncate ${
                    activeTab === 'ALL'
                      ? 'bg-white text-[#173125] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{lang === 'bn' ? 'সব' : 'All'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 font-numeric shrink-0">
                    {records.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('RECEIVABLE')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 truncate ${
                    activeTab === 'RECEIVABLE'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-800'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3 shrink-0" />
                  <span className="truncate">{lang === 'bn' ? 'আমি পাবো' : 'Receivables'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-numeric shrink-0">
                    {records.filter((r) => r.type !== 'PAYABLE').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PAYABLE')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 truncate ${
                    activeTab === 'PAYABLE'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-800'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                  <span className="truncate">{lang === 'bn' ? 'আমি দেবো' : 'Payables'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-numeric shrink-0">
                    {records.filter((r) => r.type === 'PAYABLE').length}
                  </span>
                </button>
              </div>

              {/* Middle: Search Box & Category Filter */}
              <div className="flex items-center gap-1.5 flex-1 md:max-w-md">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'নাম, ফোন, রুম বা কারণ দিয়ে খুঁজুন...'
                        : 'Search name, phone, room, reason...'
                    }
                    className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#438A53]/40 bg-slate-50/50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <CustomSelect
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sizeVariant="sm"
                  containerClassName="shrink-0 w-auto min-w-[130px] sm:min-w-[150px]"
                  options={[
                    { value: 'ALL', label: lang === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories' },
                    ...CATEGORIES.map((c) => ({
                      value: c.id,
                      label: lang === 'bn' ? c.labelBn : c.labelEn,
                    })),
                  ]}
                />
              </div>

              {/* Right: Status Pills & Desktop View Toggle */}
              <div className="flex items-center justify-between sm:justify-end gap-1.5 overflow-x-auto">
                {/* Status Pills */}
                <div className="flex items-center gap-1 shrink-0">
                  {(
                    [
                      { id: 'ALL', labelBn: 'সব', labelEn: 'All' },
                      { id: 'PENDING', labelBn: 'বকেয়া', labelEn: 'Pending' },
                      { id: 'PARTIAL', labelBn: 'আংশিক', labelEn: 'Partial' },
                      { id: 'PAID', labelBn: 'পরিশোধিত', labelEn: 'Paid' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        statusFilter === tab.id
                          ? 'bg-[#173125] text-[#FED24F] shadow-xs font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {lang === 'bn' ? tab.labelBn : tab.labelEn}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle (Desktop only: Grid vs Table) */}
                <div className="hidden md:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-md transition ${
                      viewMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={lang === 'bn' ? 'কার্ড গ্রিড ভিউ' : 'Card Grid View'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1 rounded-md transition ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title={lang === 'bn' ? 'টেবিল ভিউ' : 'Table View'}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Add Buttons on PC toolbar */}
                <div className="hidden lg:flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('RECEIVABLE')}
                    className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>{lang === 'bn' ? '+ পাওনা' : '+ Recv'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('PAYABLE')}
                    className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{lang === 'bn' ? '+ দেনা' : '+ Pay'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Only: 2 Quick Action Buttons under Toolbar */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => handleOpenAddForm('RECEIVABLE')}
                className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ পাওনা যুক্ত করুন' : '+ Add Receivable'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddForm('PAYABLE')}
                className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ দেনা যুক্ত করুন' : '+ Add Payable'}</span>
              </button>
            </div>

            {/* =========================================================================
                3. ITEM LISTINGS (CLEAN 3-COL GRID OR HIGH-DENSITY TABLE ON PC)
               ========================================================================= */}
            {filteredList.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-dashed border-slate-300">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2.5">
                  <HandCoins className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কোনো হিসাব পাওয়া যায়নি' : 'No records found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  {lang === 'bn'
                    ? 'আপনার ফিল্টারে কোনো তথ্য মেলেনি অথবা এখনো কোনো পাওনা বা দেনার এন্ট্রি যুক্ত করা হয়নি।'
                    : 'No matching entries or you have not recorded any receivables or payables yet.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('RECEIVABLE')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition active:scale-95"
                  >
                    {lang === 'bn' ? '+ পাওনা যুক্ত করুন' : '+ Add Receivable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('PAYABLE')}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition active:scale-95"
                  >
                    {lang === 'bn' ? '+ দেনা যুক্ত করুন' : '+ Add Payable'}
                  </button>
                </div>
              </div>
            ) : viewMode === 'table' ? (
              /* ===================================================================
                 DESKTOP DATA TABLE VIEW (Compact, High-Density Spreadsheet Style)
                 =================================================================== */
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3">{lang === 'bn' ? 'ধরন' : 'Type'}</th>
                        <th className="py-2.5 px-3">{lang === 'bn' ? 'ব্যক্তি ও যোগাযোগ' : 'Person'}</th>
                        <th className="py-2.5 px-3">{lang === 'bn' ? 'কিসের টাকা ও ক্যাটাগরি' : 'Reason & Category'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'মোট দাবি' : 'Total'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'পরিশোধিত' : 'Paid'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'অবশিষ্ট বাকি' : 'Remaining'}</th>
                        <th className="py-2.5 px-3">{lang === 'bn' ? 'স্ট্যাটাস ও মেয়াদ' : 'Status & Due'}</th>
                        <th className="py-2.5 px-3 text-center">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.map((item) => {
                        const isPayable = item.type === 'PAYABLE';
                        const today = new Date().toISOString().split('T')[0];
                        const isOverdue =
                          item.remainingAmount > 0 && item.dueDate && item.dueDate < today;
                        const catObj = CATEGORIES.find((c) => c.id === item.category);
                        const catLabel = catObj
                          ? lang === 'bn'
                            ? catObj.labelBn
                            : catObj.labelEn
                          : item.category;

                        return (
                          <tr
                            key={item._id}
                            className={`hover:bg-slate-50/70 transition ${
                              isPayable ? 'hover:bg-rose-50/30' : 'hover:bg-emerald-50/30'
                            }`}
                          >
                            {/* Type Pill */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isPayable
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {isPayable ? (
                                  <>
                                    <ArrowUpRight className="w-3 h-3 text-rose-600" />
                                    <span>{lang === 'bn' ? 'দেনা' : 'Payable'}</span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                                    <span>{lang === 'bn' ? 'পাওনা' : 'Receivable'}</span>
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Person info */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{item.debtorName}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                {item.debtorRoom && <span>রুম: {item.debtorRoom}</span>}
                                {item.debtorPhone && (
                                  <a href={`tel:${item.debtorPhone}`} className="hover:text-emerald-700 font-numeric">
                                    · {item.debtorPhone}
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Title & Category */}
                            <td className="py-2 px-3 max-w-[200px]">
                              <div className="font-semibold text-slate-800 truncate" title={item.title}>
                                {item.title}
                              </div>
                              <div className="text-[10px] text-slate-500">{catLabel}</div>
                            </td>

                            {/* Total Amount */}
                            <td className="py-2 px-3 text-right font-numeric font-semibold text-slate-700 whitespace-nowrap">
                              ৳{formatNumber(item.totalAmount, lang)}
                            </td>

                            {/* Paid Amount */}
                            <td className="py-2 px-3 text-right font-numeric text-slate-600 whitespace-nowrap">
                              ৳{formatNumber(item.paidAmount || 0, lang)}
                            </td>

                            {/* Remaining Amount */}
                            <td className="py-2 px-3 text-right font-numeric font-bold whitespace-nowrap">
                              <span className={item.remainingAmount <= 0 ? 'text-blue-700' : isPayable ? 'text-rose-600' : 'text-emerald-700'}>
                                ৳{formatNumber(item.remainingAmount, lang)}
                              </span>
                            </td>

                            {/* Status & Due Date */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                    item.status === 'PAID'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : item.status === 'PARTIAL'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {item.status === 'PAID'
                                    ? lang === 'bn'
                                      ? 'পরিশোধিত'
                                      : 'Paid'
                                    : item.status === 'PARTIAL'
                                    ? lang === 'bn'
                                      ? 'আংশিক'
                                      : 'Partial'
                                    : lang === 'bn'
                                    ? 'বকেয়া'
                                    : 'Pending'}
                                </span>

                                {isOverdue && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white">
                                    {lang === 'bn' ? 'ওভারডিউ' : 'Overdue'}
                                  </span>
                                )}
                              </div>
                              {item.dueDate && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {lang === 'bn' ? 'মেয়াদ: ' : 'Due: '}
                                  {toBanglaDigits(item.dueDate)}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {item.remainingAmount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaymentModalItem(item);
                                      setPayAmount(String(item.remainingAmount));
                                      setPayDate(new Date().toISOString().split('T')[0]);
                                      setPayNotes('');
                                    }}
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold text-white shadow-xs transition active:scale-95 ${
                                      isPayable ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                  >
                                    {isPayable ? (lang === 'bn' ? 'শোধ' : 'Pay') : (lang === 'bn' ? 'জমা' : 'Recv')}
                                  </button>
                                )}

                                {item.debtorPhone && (
                                  <a
                                    href={getWhatsAppUrl(item)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditForm(item)}
                                  className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(item)}
                                  className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ===================================================================
                 COMPACT 3-COLUMN CARD GRID ON PC (NOT Bloated or Oversized)
                 =================================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredList.map((item) => {
                  const isPayable = item.type === 'PAYABLE';
                  const isExpanded = Boolean(expandedIds[item._id]);
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue =
                    item.remainingAmount > 0 && item.dueDate && item.dueDate < today;

                  const catObj = CATEGORIES.find((c) => c.id === item.category);
                  const catLabel = catObj
                    ? lang === 'bn'
                      ? catObj.labelBn
                      : catObj.labelEn
                    : item.category;

                  const percentPaid =
                    item.totalAmount > 0
                      ? Math.min(100, Math.round(((item.paidAmount || 0) / item.totalAmount) * 100))
                      : 0;

                  return (
                    <div
                      key={item._id}
                      className={`bg-white rounded-xl border transition shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-sm ${
                        isPayable
                          ? 'border-rose-100 hover:border-rose-200'
                          : 'border-emerald-100 hover:border-emerald-200'
                      }`}
                    >
                      <div className="p-3 sm:p-3.5 space-y-2.5">
                        {/* Top Card Row: Person & Remaining */}
                        <div className="flex items-start justify-between gap-2">
                          {/* Left: Avatar + Name + Badges */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                                isPayable
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isPayable ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {item.debtorName}
                                </span>
                                {item.debtorRoom && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                    {item.debtorRoom}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                                    isPayable
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {isPayable
                                    ? lang === 'bn'
                                      ? '↗ দেনা'
                                      : 'Payable'
                                    : lang === 'bn'
                                    ? '↙ পাওনা'
                                    : 'Receivable'}
                                </span>

                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                                    item.status === 'PAID'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : item.status === 'PARTIAL'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {item.status === 'PAID'
                                    ? lang === 'bn'
                                      ? 'পরিশোধিত'
                                      : 'Paid'
                                    : item.status === 'PARTIAL'
                                    ? lang === 'bn'
                                      ? 'আংশিক'
                                      : 'Partial'
                                    : lang === 'bn'
                                    ? 'বকেয়া'
                                    : 'Pending'}
                                </span>

                                {isOverdue && (
                                  <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-rose-500 text-white animate-pulse">
                                    {lang === 'bn' ? 'ওভারডিউ' : 'Overdue'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Remaining Amount */}
                          <div className="text-right shrink-0">
                            <div className="text-[9px] text-slate-400">
                              {isPayable ? (lang === 'bn' ? 'বাকি দেনা' : 'To Pay') : (lang === 'bn' ? 'বাকি পাওনা' : 'Due')}
                            </div>
                            <div
                              className={`text-sm sm:text-base font-black font-numeric leading-tight ${
                                item.remainingAmount <= 0
                                  ? 'text-blue-700'
                                  : isPayable
                                  ? 'text-rose-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              ৳{formatNumber(item.remainingAmount, lang)}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Title & Progress */}
                        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold text-slate-800 truncate" title={item.title}>
                              {item.title}
                            </span>
                            <span className="text-[9px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                              {catLabel}
                            </span>
                          </div>

                          {/* Mini Progress */}
                          <div>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                              <span>
                                {isPayable ? (lang === 'bn' ? 'শোধ: ' : 'Paid: ') : (lang === 'bn' ? 'আদায়: ' : 'Recv: ')}
                                <strong className="text-slate-700 font-numeric">
                                  ৳{formatNumber(item.paidAmount || 0, lang)}
                                </strong>
                              </span>
                              <span>
                                {lang === 'bn' ? 'মোট: ' : 'Tot: '}
                                <strong className="text-slate-700 font-numeric">
                                  ৳{formatNumber(item.totalAmount, lang)}
                                </strong>{' '}
                                ({percentPaid}%)
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  item.status === 'PAID'
                                    ? 'bg-blue-500'
                                    : isPayable
                                    ? 'bg-rose-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </div>

                          {/* Date and Phone */}
                          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-slate-400" />
                              <span>{toBanglaDigits(item.issueDate)}</span>
                              {item.dueDate && (
                                <span className={isOverdue ? 'text-rose-600 font-bold ml-1' : 'ml-1'}>
                                  · মেয়াদ: {toBanglaDigits(item.dueDate)}
                                </span>
                              )}
                            </span>

                            {item.debtorPhone && (
                              <a
                                href={`tel:${item.debtorPhone}`}
                                className="hover:text-emerald-700 font-numeric"
                              >
                                {item.debtorPhone}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions Row */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {/* Primary Button */}
                          {item.remainingAmount > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentModalItem(item);
                                setPayAmount(String(item.remainingAmount));
                                setPayDate(new Date().toISOString().split('T')[0]);
                                setPayNotes('');
                              }}
                              className={`flex-1 h-7 px-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1 shadow-xs transition active:scale-95 ${
                                isPayable
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>{isPayable ? (lang === 'bn' ? 'শোধ দিন' : 'Pay') : (lang === 'bn' ? 'জমা নিন' : 'Receive')}</span>
                            </button>
                          ) : (
                            <div className="flex-1 h-7 px-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center gap-1 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'পরিশোধিত' : 'Settled'}</span>
                            </div>
                          )}

                          {/* WhatsApp */}
                          {item.debtorPhone && (
                            <a
                              href={getWhatsAppUrl(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition shrink-0 active:scale-95"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Call */}
                          {item.debtorPhone && (
                            <a
                              href={`tel:${item.debtorPhone}`}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition shrink-0 active:scale-95"
                              title="Call"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(item)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition shrink-0 active:scale-95"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition shrink-0 active:scale-95"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          {/* History toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedIds((prev) => ({
                                ...prev,
                                [item._id]: !prev[item._id],
                              }))
                            }
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 flex items-center justify-center transition shrink-0 active:scale-95"
                            title="Installments"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable History inside Card */}
                      {isExpanded && (
                        <div className="bg-slate-50/90 border-t border-slate-100 p-2.5 text-xs space-y-1.5">
                          {item.notes && (
                            <div className="p-2 rounded bg-white border border-slate-200 text-slate-700 text-[11px]">
                              <span className="font-semibold text-slate-900">নোট: </span>
                              {item.notes}
                            </div>
                          )}

                          <div className="font-bold text-slate-800 flex items-center justify-between text-[11px]">
                            <span>{isPayable ? 'পরিশোধের ইতিহাস' : 'আদায়ের ইতিহাস'}</span>
                            <span className="text-[10px] text-slate-500 font-numeric">
                              {item.installments?.length || 0} টি কিস্তি
                            </span>
                          </div>

                          {!item.installments || item.installments.length === 0 ? (
                            <p className="text-slate-400 italic text-[10px]">কোনো কিস্তি নেওয়া/দেওয়া হয়নি।</p>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {item.installments.map((inst, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white p-1.5 rounded border border-slate-200 text-[11px]"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 font-numeric">
                                      ৳{formatNumber(inst.amount, lang)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-1.5">
                                      {toBanglaDigits(inst.date)}
                                    </span>
                                  </div>
                                  {inst.notes && (
                                    <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                                      {inst.notes}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          4. MOBILE FLOATING ACTION BUTTON (FAB)
         ========================================================================= */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => handleOpenAddForm('RECEIVABLE')}
          className="fixed bottom-5 right-4 sm:hidden z-30 flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#173125] text-[#FED24F] shadow-xl border border-[#FED24F]/30 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs font-bold">{lang === 'bn' ? 'নতুন হিসাব' : 'Add Entry'}</span>
        </button>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT ENTRY (SLEEK COMPACT ON PC & BOTTOM SHEET ON MOBILE)
         ========================================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    formType === 'PAYABLE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {formType === 'PAYABLE' ? (
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {editingId
                      ? lang === 'bn'
                        ? 'হিসাব এডিট'
                        : 'Edit Entry'
                      : formType === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'আমি দেবো (দেনা) এন্ট্রি'
                        : 'New Payable Entry'
                      : lang === 'bn'
                      ? 'আমি পাবো (পাওনা) এন্ট্রি'
                      : 'New Receivable Entry'}
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {formType === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'কে টাকা পাবে এডমিনের কাছ থেকে'
                        : 'Creditor ledger'
                      : lang === 'bn'
                      ? 'কার কাছে টাকা পাবে এডমিন'
                      : 'Debtor ledger'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEntry} className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 space-y-3">
              {/* Type Switcher */}
              {!editingId && (
                <div>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFormType('RECEIVABLE')}
                      className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition ${
                        formType === 'RECEIVABLE' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowDownLeft className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'আমি পাবো' : 'Receivable'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('PAYABLE')}
                      className={`py-1.5 px-2 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition ${
                        formType === 'PAYABLE' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'আমি দেবো' : 'Payable'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Member Picker / External */}
              <CustomSelect
                label={
                  formType === 'PAYABLE'
                    ? lang === 'bn'
                      ? 'টাকা কে পাবে? (ব্যক্তি নির্বাচন)'
                      : 'Who is owed?'
                    : lang === 'bn'
                    ? 'কার কাছে টাকা পাবেন?'
                    : 'Who owes money?'
                }
                value={selectedMemberId}
                onChange={(e) => handleSelectMember(e.target.value)}
                sizeVariant="sm"
                options={[
                  {
                    value: 'CUSTOM',
                    label: lang === 'bn' ? '✍️ মেসের বাইরের ব্যক্তি (নাম নিচে লিখুন)' : '✍️ External Person',
                  },
                  {
                    label: lang === 'bn' ? 'মেসের মেম্বারবৃন্দ' : 'Mess Members',
                    options: members.map((m) => ({
                      value: String(m.id),
                      label: `${m.name} ${m.roomNumber ? `(রুম ${m.roomNumber})` : ''}`,
                    })),
                  },
                ]}
              />

              {/* Name, Phone, Room */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {lang === 'bn' ? 'নাম *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={debtorName}
                    onChange={(e) => setDebtorName(e.target.value)}
                    placeholder={lang === 'bn' ? 'নাম' : 'Name'}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {lang === 'bn' ? 'মোবাইল' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={debtorPhone}
                    onChange={(e) => setDebtorPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    {lang === 'bn' ? 'রুম / ফ্ল্যাট' : 'Room'}
                  </label>
                  <input
                    type="text"
                    value={debtorRoom}
                    onChange={(e) => setDebtorRoom(e.target.value)}
                    placeholder={lang === 'bn' ? '402' : '402'}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* Title / Reason & Quick Suggestions */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {lang === 'bn' ? 'কিসের টাকা? (বিবরণ / কারণ) *' : 'Reason *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    formType === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'যেমন: বাজার খরচের বাকি টাকা ফেরত'
                        : 'e.g. Grocery refund'
                      : lang === 'bn'
                      ? 'যেমন: ব্যক্তিগত ধার বা ওয়াইফাই বিল'
                      : 'e.g. WiFi advance'
                  }
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200"
                />

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {(formType === 'PAYABLE' ? QUICK_SUGGESTIONS_PAYABLE : QUICK_SUGGESTIONS_RECEIVABLE).map(
                    (sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTitle(sug)}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 hover:bg-[#FED24F]/30 text-slate-600 transition border border-slate-200/60"
                      >
                        + {sug}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Category */}
              <CustomSelect
                label={lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sizeVariant="sm"
                options={CATEGORIES.map((c) => ({
                  value: c.id,
                  label: lang === 'bn' ? c.labelBn : c.labelEn,
                }))}
              />

              {/* Amounts: Total & Initial Paid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    {lang === 'bn' ? 'মোট টাকার পরিমাণ (৳) *' : 'Total (৳) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 font-numeric font-bold"
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      {formType === 'PAYABLE'
                        ? lang === 'bn'
                          ? 'ইতিমধ্যে পরিশোধিত'
                          : 'Already Paid'
                        : lang === 'bn'
                        ? 'ইতিমধ্যে আদায়কৃত'
                        : 'Already Received'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={initialPaidAmount}
                      onChange={(e) => setInitialPaidAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 font-numeric"
                    />
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    {lang === 'bn' ? 'ইস্যুর তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    {lang === 'bn' ? 'পরিশোধের শেষ তারিখ' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 font-numeric"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {lang === 'bn' ? 'মন্তব্য বা অতিরিক্ত বিবরণ' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'প্রয়োজনীয় নোট...' : 'Add remarks...'}
                  className="w-full p-2 text-xs rounded-lg border border-slate-200"
                />
              </div>

              {/* Sticky Submit Footer inside Modal */}
              <div className="pt-2.5 pb-1 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`h-8 px-4 rounded-lg text-xs font-bold text-white shadow-xs transition active:scale-95 ${
                    formType === 'PAYABLE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#173125] hover:bg-[#224736]'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting
                    ? lang === 'bn'
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'Saving...'
                    : editingId
                    ? lang === 'bn'
                      ? 'আপডেট করুন'
                      : 'Update'
                    : lang === 'bn'
                    ? 'সংরক্ষণ করুন'
                    : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RECORD INSTALLMENT PAYMENT (COMPACT & CLEAN)
         ========================================================================= */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    paymentModalItem.type === 'PAYABLE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {paymentModalItem.type === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'টাকা পরিশোধ করুন'
                        : 'Record Payment'
                      : lang === 'bn'
                      ? 'টাকা জমা নিন'
                      : 'Record Receipt'}
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[200px]">
                    {paymentModalItem.debtorName} · {paymentModalItem.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalItem(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-4 sm:p-5 space-y-3 flex-1 overflow-y-auto">
              {/* Due Snapshot Card */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500">
                    {paymentModalItem.type === 'PAYABLE' ? 'বাকি দেনা' : 'বাকি পাওনা'}
                  </div>
                  <div className="text-base font-black text-slate-900 font-numeric">
                    ৳{formatNumber(paymentModalItem.remainingAmount, lang)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayAmount(String(paymentModalItem.remainingAmount))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs active:scale-95"
                >
                  {lang === 'bn' ? 'পুরো টাকা' : 'Full'}
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {lang === 'bn' ? 'পরিশোধিত টাকার পরিমাণ (৳) *' : 'Amount (৳) *'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 px-2.5 text-sm rounded-lg border border-slate-200 font-numeric font-bold focus:ring-1 focus:ring-[#438A53]/40"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {lang === 'bn' ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 font-numeric"
                />
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  {lang === 'bn' ? 'মাধ্যম বা নোট (ক্যাশ, বিকাশ ইত্যাদি)' : 'Method / Notes'}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: বিকাশ বা ক্যাশ' : 'e.g. bKash / Cash'}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className={`h-8 px-4 rounded-lg text-xs font-bold text-white shadow-xs transition active:scale-95 ${
                    paymentModalItem.type === 'PAYABLE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  } ${submittingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submittingPayment
                    ? lang === 'bn'
                      ? 'প্রসেস হচ্ছে...'
                      : 'Processing...'
                    : lang === 'bn'
                    ? 'জমা নিশ্চিত করুন'
                    : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
