import {
  ActivityLogItem,
  CloudMessRecordPayload,
  DepositRecord,
  ExpenseCategory,
  ExpenseRecord,
  MealRecord,
  MealRecordedBy,
  Member,
  MemberAccountingSummary,
  MemberRole,
  MonthlyMessAccounting,
  NoticeCategory,
  NoticeItem,
  PaymentMethod,
  RosterItem,
  RosterStatus,
} from './types';

export const ADMIN_EMAIL = 'nafizalturabi18cse@gmail.com';
export const DEFAULT_MESS_ID = '9D';
export const DEFAULT_MANAGER_PIN = '16247';

/**
 * Helper for recordId:
 * returns baseId if messCode === "9D", otherwise `${messCode}_${baseId}`
 * (replace any non-[a-zA-Z0-9_-] with _).
 */
export function cloudRecordId(baseId: string, messCode: string): string {
  const cleanMess = (messCode || DEFAULT_MESS_ID).trim();
  const raw = cleanMess === '9D' ? baseId : `${cleanMess}_${baseId}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function safeTitle(val: string | undefined | null): string {
  const trimmed = (val ?? '').trim();
  if (!trimmed) return '-';
  return trimmed.slice(0, 200);
}

function safeSubtitle(val: string | undefined | null): string {
  return (val ?? '').slice(0, 500);
}

function safeRole(val: string | undefined | null): string {
  return (val ?? '').slice(0, 40);
}

function safeInt(val: number | undefined | null): number {
  const n = Math.floor(Number(val) || 0);
  return n >= 0 ? n : 0;
}

function safeNonNegative(val: number | undefined | null): number {
  const n = Number(val) || 0;
  return n >= 0 ? Number(n.toFixed(4)) : 0;
}

export interface CloudMetaContext {
  messCode: string;
  memberUids: string[];
  managerUids: string[];
  createdBy: string;
}

export function encodeMemberToCloud(
  member: Member,
  ctx: CloudMetaContext
): CloudMessRecordPayload {
  const recordId = cloudRecordId(`MEMBER_${member.id}`, ctx.messCode);
  return {
    recordId,
    messId: ctx.messCode,
    recordType: 'MEMBER',
    monthKey: 'ALL',
    title: safeTitle(member.name),
    subtitle: safeSubtitle(
      `${member.phone || ''}|${member.roomNumber || ''}|${member.email || ''}|${member.joiningDate || ''}`
    ),
    role: safeRole(member.role),
    linkedUid: (member.notes || '').slice(0, 128),
    entityLocalId: safeInt(member.id),
    targetMemberId: safeInt(member.id),
    amount: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    guestMeal: 0,
    active: Boolean(member.isActive),
    memberUids: ctx.memberUids,
    managerUids: ctx.managerUids,
    createdBy: ctx.createdBy,
  };
}

export function decodeMemberFromCloud(doc: CloudMessRecordPayload): Member {
  const parts = (doc.subtitle || '').split('|');
  const role: MemberRole = doc.role === 'Manager' ? 'Manager' : 'Member';
  return {
    id: doc.entityLocalId || doc.targetMemberId || 1,
    name: doc.title === '-' ? 'Unnamed Member' : doc.title,
    phone: parts[0] || '',
    roomNumber: parts[1] || '',
    email: parts[2] || '',
    joiningDate: parts[3] || '2026-10-01',
    role,
    notes: doc.linkedUid || '',
    isActive: Boolean(doc.active),
  };
}

export function encodeMealToCloud(
  meal: MealRecord,
  ctx: CloudMetaContext
): CloudMessRecordPayload {
  const dateUnderscore = meal.date.replaceAll('-', '_');
  const recordId = cloudRecordId(
    `MEAL_${dateUnderscore}_${meal.memberId}`,
    ctx.messCode
  );
  const cleanNotes = (meal.notes || '').replace(/^\[GUEST:[0-9.]+\]\s*/i, '').trim();
  const guestMeal = safeNonNegative(meal.guestMeal);
  const subtitleRaw =
    guestMeal > 0
      ? `[GUEST:${guestMeal.toFixed(1)}] ${cleanNotes}`.trim()
      : cleanNotes;
  const breakfast = safeNonNegative(meal.breakfast);
  const lunch = safeNonNegative(meal.lunch);
  const dinner = safeNonNegative(meal.dinner);
  const amount = safeNonNegative(breakfast + lunch + dinner + guestMeal);

  return {
    recordId,
    messId: ctx.messCode,
    recordType: 'MEAL',
    monthKey: meal.date.slice(0, 7),
    title: safeTitle(meal.date),
    subtitle: safeSubtitle(subtitleRaw),
    role: safeRole(meal.recordedBy || 'MANAGER'),
    linkedUid: '',
    entityLocalId: safeInt(meal.id),
    targetMemberId: safeInt(meal.memberId),
    amount,
    breakfast,
    lunch,
    dinner,
    guestMeal,
    active: true,
    memberUids: ctx.memberUids,
    managerUids: ctx.managerUids,
    createdBy: ctx.createdBy,
  };
}

export function decodeMealFromCloud(doc: CloudMessRecordPayload): MealRecord {
  const rawSubtitle = doc.subtitle || '';
  const guestMatch = rawSubtitle.match(/^\[GUEST:([0-9.]+)\]\s*(.*)$/i);
  const parsedGuestFromSub = guestMatch ? parseFloat(guestMatch[1]) || 0 : 0;
  const cleanNotes = guestMatch ? guestMatch[2] : rawSubtitle;
  const guestMeal =
    typeof doc.guestMeal === 'number' && doc.guestMeal > 0
      ? doc.guestMeal
      : parsedGuestFromSub;
  const recordedBy: MealRecordedBy = doc.role === 'SELF' ? 'SELF' : 'MANAGER';

  return {
    id: doc.entityLocalId || Date.now(),
    date: doc.title,
    memberId: doc.targetMemberId,
    breakfast: safeNonNegative(doc.breakfast),
    lunch: safeNonNegative(doc.lunch),
    dinner: safeNonNegative(doc.dinner),
    guestMeal: safeNonNegative(guestMeal),
    notes: cleanNotes,
    recordedBy,
  };
}

export function encodeExpenseToCloud(
  expense: ExpenseRecord,
  ctx: CloudMetaContext
): CloudMessRecordPayload {
  const recordId = cloudRecordId(`EXPENSE_${expense.id}`, ctx.messCode);
  return {
    recordId,
    messId: ctx.messCode,
    recordType: 'EXPENSE',
    monthKey: expense.date.slice(0, 7),
    title: safeTitle(expense.title),
    subtitle: safeSubtitle(
      `${expense.date}|${expense.paidByName || ''}|${expense.description || ''}`
    ),
    role: safeRole(expense.category),
    linkedUid: '',
    entityLocalId: safeInt(expense.id),
    targetMemberId: safeInt(expense.paidByMemberId),
    amount: safeNonNegative(expense.amount),
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    guestMeal: 0,
    active: Boolean(expense.isFoodExpense),
    memberUids: ctx.memberUids,
    managerUids: ctx.managerUids,
    createdBy: ctx.createdBy,
  };
}

export function decodeExpenseFromCloud(doc: CloudMessRecordPayload): ExpenseRecord {
  const parts = (doc.subtitle || '').split('|');
  const dateStr = parts[0] && /^\d{4}-\d{2}-\d{2}$/.test(parts[0]) ? parts[0] : `${doc.monthKey}-01`;
  const paidByName = parts[1] || 'Manager';
  const description = parts.slice(2).join('|') || '';
  const validCategories: ExpenseCategory[] = [
    'Bazar (Food)',
    'Gas',
    'Electricity',
    'WiFi',
    'Bua / Maid',
    'House Rent',
    'Water',
    'Other Shared',
  ];
  const category: ExpenseCategory = validCategories.includes(doc.role as ExpenseCategory)
    ? (doc.role as ExpenseCategory)
    : doc.active
      ? 'Bazar (Food)'
      : 'Other Shared';

  return {
    id: doc.entityLocalId || Date.now(),
    date: dateStr,
    title: doc.title === '-' ? category : doc.title,
    category,
    amount: safeNonNegative(doc.amount),
    paidByMemberId: doc.targetMemberId,
    paidByName,
    description,
    isFoodExpense: Boolean(doc.active),
  };
}

export function encodeDepositToCloud(
  deposit: DepositRecord,
  ctx: CloudMetaContext
): CloudMessRecordPayload {
  const recordId = cloudRecordId(`DEPOSIT_${deposit.id}`, ctx.messCode);
  return {
    recordId,
    messId: ctx.messCode,
    recordType: 'DEPOSIT',
    monthKey: deposit.date.slice(0, 7),
    title: safeTitle(deposit.date),
    subtitle: safeSubtitle(`${deposit.transactionRef || ''}|${deposit.description || ''}`),
    role: safeRole(deposit.paymentMethod),
    linkedUid: '',
    entityLocalId: safeInt(deposit.id),
    targetMemberId: safeInt(deposit.memberId),
    amount: safeNonNegative(deposit.amount),
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    guestMeal: 0,
    active: true,
    memberUids: ctx.memberUids,
    managerUids: ctx.managerUids,
    createdBy: ctx.createdBy,
  };
}

export function decodeDepositFromCloud(doc: CloudMessRecordPayload): DepositRecord {
  const parts = (doc.subtitle || '').split('|');
  const validMethods: PaymentMethod[] = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank'];
  const paymentMethod: PaymentMethod = validMethods.includes(doc.role as PaymentMethod)
    ? (doc.role as PaymentMethod)
    : 'Cash';

  return {
    id: doc.entityLocalId || Date.now(),
    date: doc.title,
    memberId: doc.targetMemberId,
    amount: safeNonNegative(doc.amount),
    paymentMethod,
    transactionRef: parts[0] || '',
    description: parts.slice(1).join('|') || '',
  };
}

export function encodeNoticeToCloud(
  notice: NoticeItem,
  ctx: CloudMetaContext
): CloudMessRecordPayload {
  const recordId = cloudRecordId('AUDIT_NOTICE_9D', ctx.messCode);
  return {
    recordId,
    messId: ctx.messCode,
    recordType: 'AUDIT',
    monthKey: 'ALL',
    title: safeTitle(notice.title),
    subtitle: safeSubtitle(`${notice.message}|${notice.postedBy}|${notice.postedAt}`),
    role: safeRole(`NOTICE_${notice.category}`),
    linkedUid: '',
    entityLocalId: 9001,
    targetMemberId: 0,
    amount: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    guestMeal: 0,
    active: true,
    memberUids: ctx.memberUids,
    managerUids: ctx.managerUids,
    createdBy: ctx.createdBy,
  };
}

export function decodeNoticeFromCloud(doc: CloudMessRecordPayload): NoticeItem {
  const parts = (doc.subtitle || '').split('|');
  const rawCat = (doc.role || '').replace(/^NOTICE_/, '') as NoticeCategory;
  const validCats: NoticeCategory[] = ['GENERAL', 'MEAL_OFF', 'BAZAR', 'URGENT'];
  return {
    id: doc.recordId,
    title: doc.title === '-' ? 'Notice' : doc.title,
    message: parts[0] || '',
    postedBy: parts[1] || 'Manager',
    postedAt: parts[2] || '',
    category: validCats.includes(rawCat) ? rawCat : 'GENERAL',
  };
}

export function encodeRosterToCloud(
  roster: RosterItem,
  ctx: CloudMetaContext
): CloudMessRecordPayload {
  const recordId = cloudRecordId(`AUDIT_ROSTER_${roster.id}`, ctx.messCode);
  return {
    recordId,
    messId: ctx.messCode,
    recordType: 'AUDIT',
    monthKey: roster.date.slice(0, 7),
    title: safeTitle(roster.date),
    subtitle: safeSubtitle(`${roster.memberName}|${roster.note || ''}|${roster.status}`),
    role: safeRole(`ROSTER_${roster.status}`),
    linkedUid: '',
    entityLocalId: safeInt(roster.id),
    targetMemberId: safeInt(roster.memberId),
    amount: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    guestMeal: 0,
    active: roster.status === 'UPCOMING',
    memberUids: ctx.memberUids,
    managerUids: ctx.managerUids,
    createdBy: ctx.createdBy,
  };
}

export function decodeRosterFromCloud(doc: CloudMessRecordPayload): RosterItem {
  const parts = (doc.subtitle || '').split('|');
  const rawStatus = (doc.role || '').replace(/^ROSTER_/, '');
  const status: RosterStatus = rawStatus === 'COMPLETED' || parts[2] === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING';
  return {
    id: doc.entityLocalId || Date.now(),
    date: doc.title,
    memberId: doc.targetMemberId,
    memberName: parts[0] || 'Member',
    note: parts[1] || '',
    status,
  };
}

export function encodeActivityLogToCloud(
  log: ActivityLogItem,
  ctx: CloudMetaContext
): CloudMessRecordPayload {
  const recordId = cloudRecordId(`AUDIT_LOG_${log.id}`, ctx.messCode);
  return {
    recordId,
    messId: ctx.messCode,
    recordType: 'AUDIT',
    monthKey: 'ALL',
    title: safeTitle(log.title),
    subtitle: safeSubtitle(`${log.description}|${log.actorName}|${log.timeText}`),
    role: safeRole(`LOG_${log.category}`),
    linkedUid: '',
    entityLocalId: safeInt(log.id),
    targetMemberId: 0,
    amount: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    guestMeal: 0,
    active: true,
    memberUids: ctx.memberUids,
    managerUids: ctx.managerUids,
    createdBy: ctx.createdBy,
  };
}

export function decodeActivityLogFromCloud(doc: CloudMessRecordPayload): ActivityLogItem {
  const parts = (doc.subtitle || '').split('|');
  const category = (doc.role || '').replace(/^LOG_/, '') || 'GENERAL';
  return {
    id: doc.entityLocalId || Date.now(),
    title: doc.title,
    description: parts[0] || '',
    actorName: parts[1] || 'Manager',
    timeText: parts[2] || '',
    category,
  };
}

/**
 * Exact Mess Accounting Formula for selected month (YYYY-MM)
 */
export function calculateMonthlyAccounting(params: {
  monthKey: string;
  members: Member[];
  meals: MealRecord[];
  expenses: ExpenseRecord[];
  deposits: DepositRecord[];
}): MonthlyMessAccounting {
  const { monthKey, members, meals, expenses, deposits } = params;

  const monthMeals = meals.filter((m) => m.date.startsWith(monthKey));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(monthKey));
  const monthDeposits = deposits.filter((d) => d.date.startsWith(monthKey));

  const activeMembers = members.filter((m) => m.isActive);
  const activeMemberCount = activeMembers.length;

  // 1. Total Mess Meals = Sum of (breakfast + lunch + dinner + guestMeal) for all meal records in that month
  const totalMessMeals = monthMeals.reduce(
    (sum, m) => sum + (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0) + (m.guestMeal || 0),
    0
  );

  // 2. Total Food Cost (বাজার খরচ) = Sum of expenses where isFoodExpense === true
  const totalFoodCost = monthExpenses
    .filter((e) => e.isFoodExpense === true)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // 3. Total Shared Cost (শেয়ার্ড বিল) = Sum of expenses where isFoodExpense === false
  const totalSharedCost = monthExpenses
    .filter((e) => e.isFoodExpense === false)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalMessCost = totalFoodCost + totalSharedCost;

  // 4. Meal Rate (মিল রেট) = Total Food Cost / Total Mess Meals (0 if Total Meals is 0)
  const mealRate = totalMessMeals > 0 ? totalFoodCost / totalMessMeals : 0;

  // 5. Per-Member Shared Cost (জনপ্রতি শেয়ার্ড খরচ) = Total Shared Cost / Active Member Count
  const perMemberSharedCost =
    activeMemberCount > 0 ? totalSharedCost / activeMemberCount : 0;

  const totalCashDeposits = monthDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalOutOfPocketExpenses = monthExpenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
  );

  // Member summaries
  const memberSummaries: MemberAccountingSummary[] = members.map((member) => {
    const memberMeals = monthMeals.filter((m) => m.memberId === member.id);
    const breakfastCount = memberMeals.reduce((s, m) => s + (m.breakfast || 0), 0);
    const lunchCount = memberMeals.reduce((s, m) => s + (m.lunch || 0), 0);
    const dinnerCount = memberMeals.reduce((s, m) => s + (m.dinner || 0), 0);
    const guestMealCount = memberMeals.reduce((s, m) => s + (m.guestMeal || 0), 0);
    const totalMeals = breakfastCount + lunchCount + dinnerCount + guestMealCount;

    const mealCost = totalMeals * mealRate;
    const sharedCost = member.isActive ? perMemberSharedCost : 0;
    // 6. Member Total Cost (মোট খরচ) = (Member Total Meals * Meal Rate) + (isActive ? Per-Member Shared Cost : 0)
    const totalCost = mealCost + sharedCost;

    const cashDeposit = monthDeposits
      .filter((d) => d.memberId === member.id)
      .reduce((s, d) => s + (d.amount || 0), 0);

    const paidExpenseCredit = monthExpenses
      .filter((e) => e.paidByMemberId === member.id)
      .reduce((s, e) => s + (e.amount || 0), 0);

    // 7. Member Total Credit (মোট জমা) = Sum of Member Cash Deposits + Sum of Expenses Paid Out-of-Pocket by this Member
    const totalCredit = cashDeposit + paidExpenseCredit;

    // 8. Member Net Balance (নেট ব্যালেন্স) = Total Credit - Total Cost
    const netBalance = totalCredit - totalCost;

    return {
      member,
      breakfastCount,
      lunchCount,
      dinnerCount,
      guestMealCount,
      totalMeals,
      mealCost,
      sharedCost,
      totalCost,
      cashDeposit,
      paidExpenseCredit,
      totalCredit,
      netBalance,
    };
  });

  const totalCredits = memberSummaries.reduce((s, ms) => s + ms.totalCredit, 0);
  // Cash in Hand = Total Cash Deposits + Out-of-pocket expenses credited - Total Mess Cost (= Total Credit - Total Mess Cost)
  // Note: Since paidExpenseCredit equals totalExpenses when paidByMemberId matches a member, Cash in Hand = Total Cash Deposits - Expenses paid from Mess Fund, or more generally: totalCredits - totalMessCost
  const cashInHand = totalCredits - totalMessCost;

  return {
    monthKey,
    activeMemberCount,
    totalMemberCount: members.length,
    totalMessMeals,
    totalFoodCost,
    totalSharedCost,
    totalMessCost,
    mealRate,
    perMemberSharedCost,
    totalCashDeposits,
    totalOutOfPocketExpenses,
    totalCredits,
    cashInHand,
    memberSummaries,
  };
}

/**
 * Locked Dates / Month Closed / Cutoff Time helpers for mess_directory.lockedDates
 */
export function isDateLocked(lockedDates: string[], dateStr: string): boolean {
  const monthKey = dateStr.slice(0, 7);
  return (
    lockedDates.includes(dateStr) ||
    lockedDates.includes(`MONTH_CLOSED_${monthKey}`)
  );
}

export function isMonthClosed(lockedDates: string[], monthKey: string): boolean {
  return lockedDates.includes(`MONTH_CLOSED_${monthKey}`);
}

export function getMealCutoffTime(lockedDates: string[]): string {
  const found = lockedDates.find((item) => item.startsWith('CUTOFF_'));
  return found ? found.replace('CUTOFF_', '') : '22:00';
}

export function updateMealCutoffInLockedDates(
  lockedDates: string[],
  newCutoffHHmm: string
): string[] {
  const filtered = lockedDates.filter((item) => !item.startsWith('CUTOFF_'));
  return [...filtered, `CUTOFF_${newCutoffHHmm}`].slice(0, 500);
}

export function toggleDateLockInLockedDates(
  lockedDates: string[],
  dateStr: string
): string[] {
  if (lockedDates.includes(dateStr)) {
    return lockedDates.filter((d) => d !== dateStr);
  }
  return [...lockedDates, dateStr].slice(0, 500);
}

export function toggleMonthClosedInLockedDates(
  lockedDates: string[],
  monthKey: string
): string[] {
  const tag = `MONTH_CLOSED_${monthKey}`;
  if (lockedDates.includes(tag)) {
    return lockedDates.filter((d) => d !== tag);
  }
  return [...lockedDates, tag].slice(0, 500);
}

export function buildDueReminderMessage(
  messName: string,
  monthLabel: string,
  summary: MemberAccountingSummary,
  lang: 'bn' | 'en'
): string {
  const dueAmount = Math.abs(Math.round(summary.netBalance));
  if (lang === 'bn') {
    return `আসসালামু আলাইকুম ${summary.member.name}, "${messName}" মেসের ${monthLabel} মাসের হিসাব অনুযায়ী আপনার মোট মিল: ${summary.totalMeals.toFixed(1)}টি, মোট খরচ: ৳${Math.round(summary.totalCost)}, মোট জমা: ৳${Math.round(summary.totalCredit)}। আপনার বর্তমান বকেয়া (Due): ৳${dueAmount}। অনুগ্রহ করে দ্রুত পরিশোধ করার অনুরোধ করা হচ্ছে। ধন্যবাদ!`;
  }
  return `Hello ${summary.member.name}, for "${messName}" (${monthLabel}), your total meals: ${summary.totalMeals.toFixed(1)}, total cost: BDT ${Math.round(summary.totalCost)}, total credit: BDT ${Math.round(summary.totalCredit)}. Current Due Balance: BDT ${dueAmount}. Please clear the due at your convenience. Thank you!`;
}

/**
 * Rich Deterministic Seed Data for Mess "9D" (October 2026)
 */
export function getInitialSeedData() {
  const members: Member[] = [];
  const meals: MealRecord[] = [];
  const expenses: ExpenseRecord[] = [];
  const deposits: DepositRecord[] = [];

  const notice: NoticeItem = {
    id: "n_1",
    title: "মেস ম্যানেজারে স্বাগতম",
    message: "হিসাব শুরু করার জন্য প্রথমে সদস্য তালিকায় মেম্বার যুক্ত করুন।",
    category: "GENERAL",
    postedBy: "Super Admin",
    postedAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };

  const rosters: RosterItem[] = [];
  const activityLogs: ActivityLogItem[] = [];

  return {
    members,
    meals,
    expenses,
    deposits,
    notice,
    rosters,
    activityLogs,
    lockedDates: ["CUTOFF_22:00"],
  };
}
