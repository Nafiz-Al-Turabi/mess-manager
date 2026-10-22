import { ExpenseCategory, Language, NoticeCategory, PaymentMethod } from './types';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatNumber(val: number, lang: Language, decimals = 0): string {
  const safeVal = Number.isFinite(val) ? val : 0;
  const formatted = safeVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return lang === 'bn' ? toBanglaDigits(formatted) : formatted;
}

export function formatCurrency(val: number, lang: Language, decimals = 0): string {
  const safeVal = Number.isFinite(val) ? val : 0;
  const sign = safeVal < 0 ? '-' : '';
  const absFormatted = formatNumber(Math.abs(safeVal), lang, decimals);
  return `${sign}৳${absFormatted}`;
}

const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatMonthLabel(monthKey: string, lang: Language): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = Math.max(0, Math.min(11, parseInt(monthStr || '10', 10) - 1));
  if (lang === 'bn') {
    return `${MONTH_NAMES_BN[monthIdx]} ${toBanglaDigits(yearStr || '2026')}`;
  }
  return `${MONTH_NAMES_EN[monthIdx]} ${yearStr || '2026'}`;
}

export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [y, m] = monthKey.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y || 2026, (m || 10) - 1 + deltaMonths, 1);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
}

export function translateExpenseCategory(cat: ExpenseCategory, lang: Language): string {
  if (lang === 'en') return cat;
  const map: Record<ExpenseCategory, string> = {
    'Bazar (Food)': 'বাজার খরচ (খাবার)',
    Gas: 'গ্যাস বিল',
    Electricity: 'বিদ্যুৎ বিল',
    WiFi: 'ওয়াইফাই (WiFi)',
    'Bua / Maid': 'বুয়া / কাজের মানুষ',
    'House Rent': 'বাসা ভাড়া',
    Water: 'পানি বিল',
    'Other Shared': 'অন্যান্য শেয়ার্ড খরচ',
  };
  return map[cat] || cat;
}

export function translatePaymentMethod(method: PaymentMethod, lang: Language): string {
  if (lang === 'en') return method;
  const map: Record<PaymentMethod, string> = {
    Cash: 'নগদ (Cash)',
    bKash: 'বিকাশ (bKash)',
    Nagad: 'নগদ অ্যাপ (Nagad)',
    Rocket: 'রকেট (Rocket)',
    Bank: 'ব্যাংক ট্রান্সফার',
  };
  return map[method] || method;
}

export function translateNoticeCategory(cat: NoticeCategory, lang: Language): string {
  if (lang === 'en') {
    const enMap: Record<NoticeCategory, string> = {
      GENERAL: 'General Notice',
      MEAL_OFF: 'Meal Off Alert',
      BAZAR: 'Bazar Update',
      URGENT: 'Urgent Notice',
    };
    return enMap[cat] || cat;
  }
  const bnMap: Record<NoticeCategory, string> = {
    GENERAL: 'সাধারণ নোটিশ',
    MEAL_OFF: 'মিল বন্ধের নোটিশ',
    BAZAR: 'বাজার সংক্রান্ত',
    URGENT: 'জরুরি ঘোষণা',
  };
  return bnMap[cat] || cat;
}
