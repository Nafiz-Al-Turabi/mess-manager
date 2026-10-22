import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMonthlyAccounting,
  cloudRecordId,
  decodeDepositFromCloud,
  decodeExpenseFromCloud,
  decodeMealFromCloud,
  decodeMemberFromCloud,
  decodeNoticeFromCloud,
  decodeRosterFromCloud,
  encodeDepositToCloud,
  encodeExpenseToCloud,
  encodeMealToCloud,
  encodeMemberToCloud,
  encodeNoticeToCloud,
  encodeRosterToCloud,
  getMealCutoffTime,
  isDateLocked,
  isMonthClosed,
  toggleDateLockInLockedDates,
  toggleMonthClosedInLockedDates,
  updateMealCutoffInLockedDates,
} from './accounting';
import { DepositRecord, ExpenseRecord, MealRecord, Member } from './types';

const REQUIRED_MESS_RECORD_KEYS = [
  'recordId',
  'messId',
  'recordType',
  'monthKey',
  'title',
  'subtitle',
  'role',
  'linkedUid',
  'entityLocalId',
  'targetMemberId',
  'amount',
  'breakfast',
  'lunch',
  'dinner',
  'guestMeal',
  'active',
  'memberUids',
  'managerUids',
  'createdBy',
].sort();

test('cloudRecordId returns baseId for "9D" and prefixed sanitized ID for custom messCode', () => {
  assert.equal(cloudRecordId('MEMBER_1', '9D'), 'MEMBER_1');
  assert.equal(cloudRecordId('MEAL_2026_10_21_1', '9D'), 'MEAL_2026_10_21_1');
  assert.equal(cloudRecordId('MEMBER_1', 'UTTARA12'), 'UTTARA12_MEMBER_1');
  assert.equal(cloudRecordId('EXPENSE_5', 'Mirpur#10!'), 'Mirpur_10__EXPENSE_5');
});

test('all cloud encoders produce the exact 19 core payload keys and round-trip cleanly', () => {
  const ctx = {
    messCode: '9D',
    memberUids: ['uid_1', 'uid_2'],
    managerUids: ['uid_1'],
    createdBy: 'uid_1',
  };

  // 1. MEMBER
  const member: Member = {
    id: 7,
    name: 'Rahim Uddin',
    phone: '01700000000',
    roomNumber: '3B',
    email: 'rahim@example.com',
    joiningDate: '2026-10-01',
    role: 'Manager',
    notes: 'uid_1',
    isActive: true,
  };
  const encodedMember = encodeMemberToCloud(member, ctx);
  assert.deepEqual(Object.keys(encodedMember).sort(), REQUIRED_MESS_RECORD_KEYS);
  assert.equal(encodedMember.recordId, 'MEMBER_7');
  assert.equal(encodedMember.monthKey, 'ALL');
  const decodedMember = decodeMemberFromCloud(encodedMember);
  assert.deepEqual(decodedMember, member);

  // 2. MEAL with guest meal prefix
  const meal: MealRecord = {
    id: 55,
    date: '2026-10-21',
    memberId: 7,
    breakfast: 0.5,
    lunch: 1,
    dinner: 1,
    guestMeal: 2,
    notes: 'Brother visited',
    recordedBy: 'SELF',
  };
  const encodedMeal = encodeMealToCloud(meal, ctx);
  assert.deepEqual(Object.keys(encodedMeal).sort(), REQUIRED_MESS_RECORD_KEYS);
  assert.equal(encodedMeal.recordId, 'MEAL_2026_10_21_7');
  assert.equal(encodedMeal.monthKey, '2026-10');
  assert.equal(encodedMeal.subtitle, '[GUEST:2.0] Brother visited');
  assert.equal(encodedMeal.amount, 4.5);
  const decodedMeal = decodeMealFromCloud(encodedMeal);
  assert.deepEqual(decodedMeal, meal);

  // 3. EXPENSE
  const expense: ExpenseRecord = {
    id: 88,
    date: '2026-10-15',
    title: 'Chicken & Rice',
    category: 'Bazar (Food)',
    amount: 1200,
    paidByMemberId: 7,
    paidByName: 'Rahim Uddin',
    description: 'Fresh bazar',
    isFoodExpense: true,
  };
  const encodedExpense = encodeExpenseToCloud(expense, ctx);
  assert.deepEqual(Object.keys(encodedExpense).sort(), REQUIRED_MESS_RECORD_KEYS);
  assert.equal(encodedExpense.recordId, 'EXPENSE_88');
  assert.equal(encodedExpense.active, true);
  const decodedExpense = decodeExpenseFromCloud(encodedExpense);
  assert.deepEqual(decodedExpense, expense);

  // 4. DEPOSIT
  const deposit: DepositRecord = {
    id: 99,
    date: '2026-10-16',
    memberId: 7,
    amount: 2500,
    paymentMethod: 'bKash',
    transactionRef: 'TX123',
    description: 'Monthly deposit',
  };
  const encodedDeposit = encodeDepositToCloud(deposit, ctx);
  assert.deepEqual(Object.keys(encodedDeposit).sort(), REQUIRED_MESS_RECORD_KEYS);
  assert.equal(encodedDeposit.recordId, 'DEPOSIT_99');
  const decodedDeposit = decodeDepositFromCloud(encodedDeposit);
  assert.deepEqual(decodedDeposit, deposit);

  // 5. AUDIT Notice & Roster
  const encodedNotice = encodeNoticeToCloud(
    {
      id: 'AUDIT_NOTICE_9D',
      title: 'Meal Off Deadline',
      message: 'Turn off before 10PM',
      category: 'MEAL_OFF',
      postedBy: 'Manager',
      postedAt: '10:00 PM',
    },
    ctx
  );
  assert.equal(encodedNotice.recordId, 'AUDIT_NOTICE_9D');
  assert.equal(encodedNotice.role, 'NOTICE_MEAL_OFF');
  const decodedNotice = decodeNoticeFromCloud(encodedNotice);
  assert.equal(decodedNotice.category, 'MEAL_OFF');

  const encodedRoster = encodeRosterToCloud(
    {
      id: 301,
      date: '2026-10-25',
      memberId: 7,
      memberName: 'Rahim Uddin',
      note: 'Morning bazar',
      status: 'UPCOMING',
    },
    ctx
  );
  assert.equal(encodedRoster.recordId, 'AUDIT_ROSTER_301');
  const decodedRoster = decodeRosterFromCloud(encodedRoster);
  assert.equal(decodedRoster.status, 'UPCOMING');
});

test('calculateMonthlyAccounting computes exact meal rate, shared cost, out-of-pocket credit, and net balance', () => {
  const members: Member[] = [
    {
      id: 1,
      name: 'Member One',
      phone: '0171',
      roomNumber: 'A1',
      email: 'm1@test.com',
      joiningDate: '2026-01-01',
      role: 'Manager',
      notes: '',
      isActive: true,
    },
    {
      id: 2,
      name: 'Member Two',
      phone: '0172',
      roomNumber: 'A2',
      email: 'm2@test.com',
      joiningDate: '2026-01-01',
      role: 'Member',
      notes: '',
      isActive: true,
    },
    {
      id: 3,
      name: 'Inactive Member',
      phone: '0173',
      roomNumber: 'A3',
      email: 'm3@test.com',
      joiningDate: '2026-01-01',
      role: 'Member',
      notes: '',
      isActive: false,
    },
  ];

  // Member 1 has 10 meals, Member 2 has 15 meals => Total 25 meals
  const meals: MealRecord[] = [
    {
      id: 1,
      date: '2026-10-10',
      memberId: 1,
      breakfast: 2,
      lunch: 4,
      dinner: 4,
      guestMeal: 0,
      notes: '',
      recordedBy: 'MANAGER',
    },
    {
      id: 2,
      date: '2026-10-10',
      memberId: 2,
      breakfast: 3,
      lunch: 5,
      dinner: 5,
      guestMeal: 2,
      notes: '',
      recordedBy: 'MANAGER',
    },
  ];

  // Food Cost = 1500 (paid by Member 1 out of pocket) => Meal Rate = 1500 / 25 = 60
  // Shared Cost = 1000 (paid by Member 2 out of pocket) => Active members = 2 => Per-Member Shared = 500
  const expenses: ExpenseRecord[] = [
    {
      id: 10,
      date: '2026-10-11',
      title: 'Food Bazar',
      category: 'Bazar (Food)',
      amount: 1500,
      paidByMemberId: 1,
      paidByName: 'Member One',
      description: '',
      isFoodExpense: true,
    },
    {
      id: 11,
      date: '2026-10-12',
      title: 'WiFi Bill',
      category: 'WiFi',
      amount: 1000,
      paidByMemberId: 2,
      paidByName: 'Member Two',
      description: '',
      isFoodExpense: false,
    },
  ];

  // Member 1 deposits 500 cash. Member 2 deposits 200 cash.
  const deposits: DepositRecord[] = [
    {
      id: 20,
      date: '2026-10-05',
      memberId: 1,
      amount: 500,
      paymentMethod: 'Cash',
      transactionRef: '',
      description: '',
    },
    {
      id: 21,
      date: '2026-10-05',
      memberId: 2,
      amount: 200,
      paymentMethod: 'bKash',
      transactionRef: '',
      description: '',
    },
  ];

  const result = calculateMonthlyAccounting({
    monthKey: '2026-10',
    members,
    meals,
    expenses,
    deposits,
  });

  assert.equal(result.totalMessMeals, 25);
  assert.equal(result.totalFoodCost, 1500);
  assert.equal(result.totalSharedCost, 1000);
  assert.equal(result.mealRate, 60);
  assert.equal(result.perMemberSharedCost, 500);

  const m1 = result.memberSummaries.find((s) => s.member.id === 1)!;
  // Member 1 Cost = (10 * 60) + 500 = 1100
  // Member 1 Credit = 500 (deposit) + 1500 (paid expense) = 2000
  // Member 1 Net Balance = 2000 - 1100 = +900 (Refundable / পাবে)
  assert.equal(m1.totalMeals, 10);
  assert.equal(m1.totalCost, 1100);
  assert.equal(m1.totalCredit, 2000);
  assert.equal(m1.netBalance, 900);

  const m2 = result.memberSummaries.find((s) => s.member.id === 2)!;
  // Member 2 Cost = (15 * 60) + 500 = 1400
  // Member 2 Credit = 200 (deposit) + 1000 (paid expense) = 1200
  // Member 2 Net Balance = 1200 - 1400 = -200 (Due / বকেয়া)
  assert.equal(m2.totalMeals, 15);
  assert.equal(m2.totalCost, 1400);
  assert.equal(m2.totalCredit, 1200);
  assert.equal(m2.netBalance, -200);

  const m3 = result.memberSummaries.find((s) => s.member.id === 3)!;
  // Inactive member pays 0 shared cost
  assert.equal(m3.sharedCost, 0);
  assert.equal(m3.totalCost, 0);
});

test('lockedDates helpers manage date locks, month closure, and meal cutoff', () => {
  let locks = ['CUTOFF_21:30'];
  assert.equal(getMealCutoffTime(locks), '21:30');

  locks = updateMealCutoffInLockedDates(locks, '22:00');
  assert.equal(getMealCutoffTime(locks), '22:00');

  locks = toggleDateLockInLockedDates(locks, '2026-10-21');
  assert.equal(isDateLocked(locks, '2026-10-21'), true);
  assert.equal(isDateLocked(locks, '2026-10-22'), false);

  locks = toggleMonthClosedInLockedDates(locks, '2026-10');
  assert.equal(isMonthClosed(locks, '2026-10'), true);
  assert.equal(isDateLocked(locks, '2026-10-22'), true);
});
