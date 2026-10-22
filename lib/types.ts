export type Language = 'bn' | 'en';

export type MemberRole = 'Manager' | 'Member';

export type MealRecordedBy = 'MANAGER' | 'SELF';

export type ExpenseCategory =
  | 'Bazar (Food)'
  | 'Gas'
  | 'Electricity'
  | 'WiFi'
  | 'Bua / Maid'
  | 'House Rent'
  | 'Water'
  | 'Other Shared';

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank';

export type NoticeCategory = 'GENERAL' | 'MEAL_OFF' | 'BAZAR' | 'URGENT';

export type RosterStatus = 'UPCOMING' | 'COMPLETED';

export type CloudRecordType = 'MEMBER' | 'MEAL' | 'EXPENSE' | 'DEPOSIT' | 'AUDIT';

export interface Member {
  id: number;
  name: string;
  phone: string;
  roomNumber: string;
  email: string;
  joiningDate: string;
  role: MemberRole;
  notes: string; // Stores linked Firebase UID if any
  isActive: boolean;
}

export interface MealRecord {
  id: number;
  date: string; // YYYY-MM-DD
  memberId: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeal: number;
  notes: string;
  recordedBy: MealRecordedBy;
}

export interface ExpenseRecord {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidByMemberId: number;
  paidByName: string;
  description: string;
  isFoodExpense: boolean; // true for "Bazar (Food)", false for shared bills
}

export interface DepositRecord {
  id: number;
  date: string; // YYYY-MM-DD
  memberId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  description: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  message: string;
  category: NoticeCategory;
  postedBy: string;
  postedAt: string;
}

export interface RosterItem {
  id: number;
  date: string; // YYYY-MM-DD
  memberId: number;
  memberName: string;
  note: string;
  status: RosterStatus;
}

export interface ActivityLogItem {
  id: number; // epochMillis
  title: string;
  description: string;
  actorName: string;
  timeText: string;
  category: string;
}

export interface JoinRequestItem {
  userId: string;
  userName: string;
  userEmail: string;
  messId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  managerUids: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MessDirectoryDoc {
  messId: string;
  messName: string;
  managerPin: string;
  managerUids: string[];
  memberUids: string[];
  lockedDates: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CloudMessRecordPayload {
  recordId: string;
  messId: string;
  recordType: CloudRecordType;
  monthKey: string;
  title: string;
  subtitle: string;
  role: string;
  linkedUid: string;
  entityLocalId: number;
  targetMemberId: number;
  amount: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeal: number;
  active: boolean;
  memberUids: string[];
  managerUids: string[];
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MemberAccountingSummary {
  member: Member;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  guestMealCount: number;
  totalMeals: number;
  mealCost: number;
  sharedCost: number;
  totalCost: number;
  cashDeposit: number;
  paidExpenseCredit: number;
  totalCredit: number;
  netBalance: number; // >= 0: Refundable (পাবে), < 0: Due (বকেয়া)
}

export interface MonthlyMessAccounting {
  monthKey: string; // YYYY-MM
  activeMemberCount: number;
  totalMemberCount: number;
  totalMessMeals: number;
  totalFoodCost: number;
  totalSharedCost: number;
  totalMessCost: number;
  mealRate: number;
  perMemberSharedCost: number;
  totalCashDeposits: number;
  totalOutOfPocketExpenses: number;
  totalCredits: number;
  cashInHand: number;
  memberSummaries: MemberAccountingSummary[];
}
