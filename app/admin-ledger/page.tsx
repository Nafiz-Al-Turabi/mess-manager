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

          // Fetch members for debtor dropdown
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

          // Fetch ledger records if admin
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
    let totalReceivable = 0; // আমি পাবো (মোট)
    let collectedReceivable = 0; // ইতিমধ্যে আদায়
    let pendingReceivable = 0; // বকেয়া পাওনা

    let totalPayable = 0; // আমি দেবো (মোট)
    let settledPayable = 0; // ইতিমধ্যে শোধ
    let pendingPayable = 0; // বকেয়া দেনা

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

    const netPosition = pendingReceivable - pendingPayable; // Net Balance (পাওনা - দেনা)

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
      // Tab filter
      if (activeTab === 'RECEIVABLE' && item.type === 'PAYABLE') return false;
      if (activeTab === 'PAYABLE' && item.type !== 'PAYABLE') return false;

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      // Search query
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
    <div className="min-h-screen bg-[#F6F8F5] text-[#173125] flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#173125] text-white border border-[#438A53]/40 shadow-2xl animate-in slide-in-from-top duration-200"
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toast.tone === 'danger'
                ? 'bg-rose-400'
                : toast.tone === 'info'
                ? 'bg-sky-400'
                : 'bg-[#FED24F]'
            }`}
          />
          <div>
            <div className="text-xs font-bold text-white">{toast.title}</div>
            {toast.subtitle && <div className="text-[11px] text-white/70">{toast.subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/50 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#173125] text-white border-b border-[#438A53]/30 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition shrink-0"
              title={lang === 'bn' ? 'মেস ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-4 h-4 text-[#FED24F]" />
              <span className="hidden sm:inline">
                {lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
              </span>
            </Link>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#438A53] flex items-center justify-center text-[#FED24F] shrink-0">
                <HandCoins className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white truncate">
                    {lang === 'bn' ? 'ব্যক্তিগত পাওনা ও দেনা খাতা' : 'Admin Receivables & Payables'}
                  </h1>
                  <span className="hidden md:inline px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FED24F] text-[#173125]">
                    Admin Only
                  </span>
                </div>
                <p className="text-[11px] text-white/70 truncate hidden sm:block">
                  {lang === 'bn'
                    ? `মেস: ${messName} (${messId}) · কার কাছে কি পাবেন ও কার কি দেনা আলাদা হিসাব`
                    : `Mess: ${messName} (${messId}) · Personal credits & debits ledger`}
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={() => loadLedgerData()}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
              title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 text-[#B2D959] ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-2.5 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-semibold text-white transition"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5 text-[#FED24F]" />
              <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            {/* Add Entry Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenAddForm('RECEIVABLE')}
                className="px-3.5 py-1.5 rounded-xl bg-[#FED24F] hover:bg-[#FED24F]/90 active:scale-95 text-[#173125] text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নতুন হিসাব' : 'Add Entry'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-6 flex-1">
        {/* Auth Check Warning if not admin */}
        {authChecked && !isAdmin ? (
          <div className="bg-white rounded-3xl p-8 max-w-xl mx-auto mt-12 text-center border border-rose-200 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {lang === 'bn' ? 'অ্যাক্সেস সংরক্ষিত (শুধুমাত্র অ্যাডমিন)' : 'Admin Access Restricted'}
            </h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              {lang === 'bn'
                ? 'ব্যক্তিগত পাওনা ও দেনার খাতাটি শুধুমাত্র মেসের Super Admin এবং Admin-দের ব্যবহারের জন্য প্রস্তুত করা হয়েছে। সাধারণ মেম্বাররা এই তথ্য দেখতে বা পরিবর্তন করতে পারবেন না।'
                : 'This ledger is strictly accessible by Mess Super Admins and Admins. Please log in with admin credentials.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#173125] text-[#FED24F] text-xs font-bold hover:bg-[#234736] transition shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Return to Dashboard'}</span>
            </Link>
          </div>
        ) : loading ? (
          // Loading Skeleton
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200/60 p-4" />
              ))}
            </div>
            <div className="h-12 bg-white rounded-2xl border border-slate-200/60" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200/60" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* 1. মোট পাওনা (To Receive) */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'bn' ? 'মোট পাওনা (আমি পাবো)' : 'Total Receivables'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    {lang === 'bn' ? 'প্রাপ্য' : 'Incoming'}
                  </span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-950 font-numeric tracking-tight">
                    ৳{formatNumber(stats.pendingReceivable, lang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'মোট দাবি:' : 'Total:'} ৳{formatNumber(stats.totalReceivable, lang)}</span>
                    <span className="text-emerald-700 font-medium">
                      {lang === 'bn' ? 'আদায়:' : 'Paid:'} ৳{formatNumber(stats.collectedReceivable, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. মোট দেনা (To Pay) */}
              <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    <span>{lang === 'bn' ? 'মোট দেনা (আমি দেবো)' : 'Total Payables'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                    {lang === 'bn' ? 'দেয়' : 'Outgoing'}
                  </span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-rose-950 font-numeric tracking-tight">
                    ৳{formatNumber(stats.pendingPayable, lang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'মোট দেনা:' : 'Total:'} ৳{formatNumber(stats.totalPayable, lang)}</span>
                    <span className="text-rose-700 font-medium">
                      {lang === 'bn' ? 'পরিশোধ:' : 'Settled:'} ৳{formatNumber(stats.settledPayable, lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. নেট ব্যালেন্স (Net Position) */}
              <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'bn' ? 'নেট পজিশন (পাওনা - দেনা)' : 'Net Position'}</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
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
                    className={`text-xl sm:text-2xl font-black font-numeric tracking-tight ${
                      stats.netPosition >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {stats.netPosition >= 0 ? '+' : ''}৳{formatNumber(stats.netPosition, lang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {stats.netPosition >= 0
                      ? lang === 'bn'
                        ? 'আপনার প্রাপ্য বাকি দেনার চেয়ে বেশি'
                        : 'Net positive balance'
                      : lang === 'bn'
                      ? 'আপনার দেনা বাকি পাওনার চেয়ে বেশি'
                      : 'Net negative balance'}
                  </div>
                </div>
              </div>

              {/* 4. মোট আদায় ও নিষ্পত্তি */}
              <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>{lang === 'bn' ? 'মোট লেনদেন নিষ্পত্তি' : 'Total Settled'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                    {lang === 'bn' ? 'কমপ্লিট' : 'Done'}
                  </span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-blue-950 font-numeric tracking-tight">
                    ৳{formatNumber(stats.collectedReceivable + stats.settledPayable, lang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>
                      {lang === 'bn'
                        ? `${toBanglaDigits(stats.totalRecords)} টি মোট রেকর্ড`
                        : `${stats.totalRecords} records`}
                    </span>
                    {stats.overdueCount > 0 && (
                      <span className="text-rose-600 font-bold">
                        {toBanglaDigits(stats.overdueCount)} {lang === 'bn' ? 'ওভারডিউ' : 'overdue'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting Mode Tabs & Action Quick Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Tabs */}
              <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200/80 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'ALL'
                      ? 'bg-[#173125] text-[#FED24F] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{lang === 'bn' ? 'সব হিসাব' : 'All Entries'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-numeric">
                    {records.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('RECEIVABLE')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'RECEIVABLE'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-emerald-800'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'আমি পাবো (পাওনা)' : 'Receivables'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-numeric">
                    {records.filter((r) => r.type !== 'PAYABLE').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('PAYABLE')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'PAYABLE'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-rose-800'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'আমি দেবো (দেনা)' : 'Payables'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-numeric">
                    {records.filter((r) => r.type === 'PAYABLE').length}
                  </span>
                </button>
              </div>

              {/* Quick Add Buttons for Receivable & Payable */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddForm('RECEIVABLE')}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '+ পাওনা যুক্ত করুন' : '+ Add Receivable'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddForm('PAYABLE')}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '+ দেনা যুক্ত করুন' : '+ Add Payable'}</span>
                </button>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'নাম, ফোন, রুম বা কারণ দিয়ে খুঁজুন...'
                      : 'Search by debtor/creditor, phone, room, reason...'
                  }
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#438A53]/30 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 shrink-0">
                {(
                  [
                    { id: 'ALL', labelBn: 'সব স্ট্যাটাস', labelEn: 'All Status' },
                    { id: 'PENDING', labelBn: 'বকেয়া', labelEn: 'Pending' },
                    { id: 'PARTIAL', labelBn: 'আংশিক', labelEn: 'Partial' },
                    { id: 'PAID', labelBn: 'পরিশোধিত', labelEn: 'Paid' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      statusFilter === tab.id
                        ? 'bg-[#173125] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'bn' ? tab.labelBn : tab.labelEn}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="shrink-0">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full md:w-auto px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="ALL">{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'bn' ? c.labelBn : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Ledger Items */}
            {filteredList.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                  <HandCoins className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কোনো হিসাব পাওয়া যায়নি' : 'No records found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                  {lang === 'bn'
                    ? 'আপনার ফিল্টারে কোনো তথ্য মেলেনি অথবা এখনো কোনো পাওনা বা দেনার এন্ট্রি যুক্ত করা হয়নি।'
                    : 'No matching entries or you have not recorded any receivables or payables yet.'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('RECEIVABLE')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition"
                  >
                    {lang === 'bn' ? '+ পাওনা যুক্ত করুন' : '+ Add Receivable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm('PAYABLE')}
                    className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition"
                  >
                    {lang === 'bn' ? '+ দেনা যুক্ত করুন' : '+ Add Payable'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
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
                      className={`bg-white rounded-2xl border transition shadow-sm overflow-hidden ${
                        isPayable ? 'border-rose-100 hover:border-rose-200' : 'border-emerald-100 hover:border-emerald-200'
                      }`}
                    >
                      {/* Main Card Header Row */}
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Person, Reason, Badge */}
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Type Avatar */}
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm ${
                              isPayable
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isPayable ? (
                              <ArrowUpRight className="w-5 h-5 text-rose-600" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                                {item.debtorName}
                              </span>

                              {/* Type Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  isPayable
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {isPayable
                                  ? lang === 'bn'
                                    ? '↗ দেনা (আমি দেবো)'
                                    : 'Payable'
                                  : lang === 'bn'
                                  ? '↙ পাওনা (আমি পাবো)'
                                  : 'Receivable'}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
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
                                    ? 'আংশিক পরিশোধ'
                                    : 'Partial'
                                  : lang === 'bn'
                                  ? 'বকেয়া'
                                  : 'Pending'}
                              </span>

                              {/* Overdue alert */}
                              {isOverdue && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                                  {lang === 'bn' ? 'মেয়াদোত্তীর্ণ!' : 'Overdue!'}
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                              <span>{item.title}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                {catLabel}
                              </span>
                            </div>

                            {/* Meta info: Room, Phone, Dates */}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                              {item.debtorRoom && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3 text-slate-400" />
                                  <span>{item.debtorRoom}</span>
                                </span>
                              )}
                              {item.debtorPhone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span className="font-numeric">{item.debtorPhone}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>
                                  {lang === 'bn' ? 'তারিখ:' : 'Date:'}{' '}
                                  {toBanglaDigits(item.issueDate)}
                                </span>
                              </span>
                              {item.dueDate && (
                                <span
                                  className={`flex items-center gap-1 ${
                                    isOverdue ? 'text-rose-600 font-semibold' : ''
                                  }`}
                                >
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>
                                    {lang === 'bn' ? 'শেষ তারিখ:' : 'Due:'}{' '}
                                    {toBanglaDigits(item.dueDate)}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amounts, Progress & Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 sm:gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                          {/* Financial snapshot */}
                          <div className="text-left sm:text-right">
                            <div className="text-xs text-slate-500 mb-0.5">
                              {isPayable
                                ? lang === 'bn'
                                  ? 'অবশিষ্ট দিতে হবে'
                                  : 'Remaining to Pay'
                                : lang === 'bn'
                                ? 'অবশিষ্ট পাওনা'
                                : 'Remaining Due'}
                            </div>
                            <div
                              className={`text-lg sm:text-xl font-black font-numeric ${
                                item.remainingAmount <= 0
                                  ? 'text-blue-700'
                                  : isPayable
                                  ? 'text-rose-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              ৳{formatNumber(item.remainingAmount, lang)}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {lang === 'bn' ? 'মোট:' : 'Total:'} ৳
                              {formatNumber(item.totalAmount, lang)} ·{' '}
                              <span className="text-slate-600 font-medium">
                                {isPayable ? (lang === 'bn' ? 'শোধ:' : 'Paid:') : (lang === 'bn' ? 'আদায়:' : 'Recv:')} ৳
                                {formatNumber(item.paidAmount || 0, lang)} ({percentPaid}%)
                              </span>
                            </div>

                            {/* Mini progress bar */}
                            <div className="w-36 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 sm:ml-auto">
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

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Record Payment Button */}
                            {item.remainingAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentModalItem(item);
                                  setPayAmount(String(item.remainingAmount));
                                  setPayDate(new Date().toISOString().split('T')[0]);
                                  setPayNotes('');
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-sm transition ${
                                  isPayable
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                                title={
                                  isPayable
                                    ? lang === 'bn'
                                      ? 'টাকা পরিশোধ করুন'
                                      : 'Make Payment'
                                    : lang === 'bn'
                                    ? 'টাকা আদায়/জমা নিন'
                                    : 'Record Receipt'
                                }
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>
                                  {isPayable
                                    ? lang === 'bn'
                                      ? 'শোধ দিন'
                                      : 'Pay'
                                    : lang === 'bn'
                                    ? 'জমা নিন'
                                    : 'Receive'}
                                </span>
                              </button>
                            )}

                            {/* WhatsApp Button */}
                            {item.debtorPhone && (
                              <a
                                href={getWhatsAppUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                title={lang === 'bn' ? 'হোয়াটসঅ্যাপে মেসেজ পাঠান' : 'Send WhatsApp Reminder'}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Call Button */}
                            {item.debtorPhone && (
                              <a
                                href={`tel:${item.debtorPhone}`}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                                title={lang === 'bn' ? 'সরাসরি কল দিন' : 'Call'}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(item)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                              title={lang === 'bn' ? 'এডিট করুন' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                              title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Expand History Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedIds((prev) => ({
                                  ...prev,
                                  [item._id]: !prev[item._id],
                                }))
                              }
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
                              title={lang === 'bn' ? 'কিস্তি ও হিস্ট্রি দেখুন' : 'View Installments'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Installment Payment History */}
                      {isExpanded && (
                        <div className="bg-slate-50/70 border-t border-slate-100 px-4 sm:px-5 py-3 text-xs">
                          {item.notes && (
                            <div className="mb-3 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700">
                              <span className="font-semibold text-slate-900">
                                {lang === 'bn' ? 'নোট / মন্তব্য:' : 'Notes:'}{' '}
                              </span>
                              {item.notes}
                            </div>
                          )}

                          <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                            <span>
                              {isPayable
                                ? lang === 'bn'
                                  ? 'পরিশোধের ইতিহাস / কিস্তি তালিকা'
                                  : 'Payment Installments History'
                                : lang === 'bn'
                                ? 'টাকা আদায়ের ইতিহাস / কিস্তি তালিকা'
                                : 'Receipt Installments History'}
                            </span>
                            <span className="text-[11px] font-normal text-slate-500 font-numeric">
                              {item.installments?.length || 0} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                            </span>
                          </div>

                          {!item.installments || item.installments.length === 0 ? (
                            <p className="text-slate-400 italic text-[11px]">
                              {lang === 'bn'
                                ? 'এখনও কোনো কিস্তি বা আংশিক টাকা নেওয়া/দেওয়া হয়নি।'
                                : 'No installment payment recorded yet.'}
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {item.installments.map((inst, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                                      #{idx + 1}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-800">
                                        ৳{formatNumber(inst.amount, lang)}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {toBanglaDigits(inst.date)}
                                        {inst.receivedBy ? ` · ${inst.receivedBy}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  {inst.notes && (
                                    <div className="text-[11px] text-slate-500 max-w-xs truncate">
                                      {inst.notes}
                                    </div>
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
          MODAL: ADD / EDIT ENTRY (RECEIVABLE OR PAYABLE)
         ========================================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    formType === 'PAYABLE'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {formType === 'PAYABLE' ? (
                    <ArrowUpRight className="w-5 h-5 text-rose-600" />
                  ) : (
                    <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingId
                      ? lang === 'bn'
                        ? 'হিসাব পরিবর্তন / এডিট'
                        : 'Edit Entry'
                      : formType === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'আমি দেবো (দেনা) এন্ট্রি'
                        : 'New Payable Entry'
                      : lang === 'bn'
                      ? 'আমি পাবো (পাওনা) এন্ট্রি'
                      : 'New Receivable Entry'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formType === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'কে কত টাকা পাবে এডমিনের কাছ থেকে'
                        : 'Who is owed money by admin'
                      : lang === 'bn'
                      ? 'কার কাছে কত টাকা পাবে এডমিন'
                      : 'Who owes money to admin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEntry} className="space-y-4">
              {/* Type Switcher: Receivable vs Payable */}
              {!editingId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'bn' ? 'লেনদেনের ধরন নির্বাচন করুন' : 'Select Entry Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setFormType('RECEIVABLE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        formType === 'RECEIVABLE'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'আমি পাবো (পাওনা)' : 'Receivable (I will get)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('PAYABLE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        formType === 'PAYABLE'
                          ? 'bg-rose-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'আমি দেবো (দেনা)' : 'Payable (I will give)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Member Picker / External */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {formType === 'PAYABLE'
                    ? lang === 'bn'
                      ? 'টাকা কে পাবে? (ব্যক্তি নির্বাচন)'
                      : 'Who is owed? (Select Person)'
                    : lang === 'bn'
                    ? 'কার কাছে টাকা পাবেন? (ব্যক্তি নির্বাচন)'
                    : 'Who owes money? (Select Person)'}
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleSelectMember(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#438A53]/30"
                >
                  <option value="CUSTOM">
                    {lang === 'bn'
                      ? '✍️ মেসের বাইরের ব্যক্তি (নাম নিচে লিখুন)'
                      : '✍️ External Person (Enter manually below)'}
                  </option>
                  <optgroup label={lang === 'bn' ? 'মেসের মেম্বারবৃন্দ' : 'Mess Members'}>
                    {members.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.name} {m.roomNumber ? `(রুম ${m.roomNumber})` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Name, Phone, Room */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {lang === 'bn' ? 'নাম *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={debtorName}
                    onChange={(e) => setDebtorName(e.target.value)}
                    placeholder={lang === 'bn' ? 'ব্যক্তির নাম' : 'Person name'}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={debtorPhone}
                    onChange={(e) => setDebtorPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {lang === 'bn' ? 'রুম / ঠিকানা' : 'Room / Flat'}
                  </label>
                  <input
                    type="text"
                    value={debtorRoom}
                    onChange={(e) => setDebtorRoom(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: 402' : 'e.g. 402'}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Title / Reason & Quick Suggestions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কিসের টাকা? (বিবরণ / কারণ) *' : 'Reason / Purpose *'}
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
                        : 'e.g. Refund for grocery expense'
                      : lang === 'bn'
                      ? 'যেমন: ব্যক্তিগত ধার বা ওয়াইফাই বিল'
                      : 'e.g. WiFi bill advance or loan'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(formType === 'PAYABLE' ? QUICK_SUGGESTIONS_PAYABLE : QUICK_SUGGESTIONS_RECEIVABLE).map(
                    (sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTitle(sug)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-[#FED24F]/30 text-slate-600 hover:text-slate-900 transition border border-slate-200/60"
                      >
                        + {sug}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'bn' ? c.labelBn : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amounts: Total & Initial Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'মোট টাকার পরিমাণ (৳) *' : 'Total Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-numeric font-bold"
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formType === 'PAYABLE'
                        ? lang === 'bn'
                          ? 'ইতিমধ্যে পরিশোধিত (যদি থাকে)'
                          : 'Already Paid (if any)'
                        : lang === 'bn'
                        ? 'ইতিমধ্যে আদায়কৃত (যদি থাকে)'
                        : 'Already Received (if any)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={initialPaidAmount}
                      onChange={(e) => setInitialPaidAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-numeric"
                    />
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'ইস্যুর তারিখ' : 'Issue Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'সম্ভাব্য পরিশোধের শেষ তারিখ' : 'Due Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-numeric"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'মন্তব্য বা অতিরিক্ত বিবরণ' : 'Notes / Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'প্রয়োজনীয় কোনো নোট থাকলে লিখুন...' : 'Add any remarks...'}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition ${
                    formType === 'PAYABLE'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-[#173125] hover:bg-[#224736]'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting
                    ? lang === 'bn'
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'Saving...'
                    : editingId
                    ? lang === 'bn'
                      ? 'আপডেট করুন'
                      : 'Update Entry'
                    : lang === 'bn'
                    ? 'সংরক্ষণ করুন'
                    : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RECORD INSTALLMENT PAYMENT
         ========================================================================= */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    paymentModalItem.type === 'PAYABLE'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {paymentModalItem.type === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'টাকা পরিশোধ / প্রদান করুন'
                        : 'Record Payment (Payable)'
                      : lang === 'bn'
                      ? 'টাকা আদায় / জমা নিন'
                      : 'Record Receipt (Receivable)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {paymentModalItem.debtorName} · {paymentModalItem.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Due Snapshot */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500">
                    {paymentModalItem.type === 'PAYABLE'
                      ? lang === 'bn'
                        ? 'অবশিষ্ট দিতে হবে'
                        : 'Remaining to pay'
                      : lang === 'bn'
                      ? 'অবশিষ্ট পাওনা'
                      : 'Remaining due'}
                  </div>
                  <div className="text-lg font-black text-slate-900 font-numeric">
                    ৳{formatNumber(paymentModalItem.remainingAmount, lang)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPayAmount(String(paymentModalItem.remainingAmount))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  {lang === 'bn' ? 'পুরো টাকা' : 'Full Amount'}
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-numeric font-bold focus:ring-2 focus:ring-[#438A53]/30"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'লেনদেনের তারিখ' : 'Payment Date'}
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-numeric"
                />
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'bn' ? 'নোট / মাধ্যম (ক্যাশ, বিকাশ, নগদ ইত্যাদি)' : 'Method / Notes'}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: বিকাশ বা ক্যাশ পরিশোধ' : 'e.g. bKash / Cash'}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition ${
                    paymentModalItem.type === 'PAYABLE'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } ${submittingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submittingPayment
                    ? lang === 'bn'
                      ? 'প্রসেস হচ্ছে...'
                      : 'Processing...'
                    : lang === 'bn'
                    ? 'জমা নিশ্চিত করুন'
                    : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
