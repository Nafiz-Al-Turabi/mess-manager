'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Home,
  ShoppingBag,
  Utensils,
  Wallet,
} from 'lucide-react';
import {
  ActivityLogItem,
  CloudMessRecordPayload,
  DepositRecord,
  ExpenseRecord,
  JoinRequestItem,
  Language,
  MealRecord,
  Member,
  MemberAccountingSummary,
  NoticeItem,
  RosterItem,
} from '@/lib/types';
import {
  ADMIN_EMAIL,
  calculateMonthlyAccounting,
  cloudRecordId,
  decodeActivityLogFromCloud,
  decodeDepositFromCloud,
  decodeExpenseFromCloud,
  decodeMealFromCloud,
  decodeMemberFromCloud,
  decodeNoticeFromCloud,
  decodeRosterFromCloud,
  DEFAULT_MANAGER_PIN,
  DEFAULT_MESS_ID,
  encodeActivityLogToCloud,
  encodeDepositToCloud,
  encodeExpenseToCloud,
  encodeMealToCloud,
  encodeMemberToCloud,
  encodeNoticeToCloud,
  encodeRosterToCloud,
  getInitialSeedData,
  getMealCutoffTime,
  isDateLocked,
  isMonthClosed,
  toggleDateLockInLockedDates,
  toggleMonthClosedInLockedDates,
  updateMealCutoffInLockedDates,
} from '@/lib/accounting';
import { shiftMonthKey } from '@/lib/i18n';
import {
  auth,
  deleteCloudMessRecord,
  ensureUserInMessDirectory,
  onAuthStateChanged,
  signInWithGooglePopup,
  signOutFirebase,
  subscribeJoinRequests,
  subscribeMessDirectory,
  subscribeMessRecords,
  upsertCloudMessRecord,
  upsertJoinRequest,
  upsertMessDirectoryDoc,
  User,
} from '@/lib/firebase';
import { generateMonthlyMessPdf } from '@/lib/pdf-export';
import { HeaderBar } from '@/components/HeaderBar';
import { HomeTab } from '@/components/HomeTab';
import { MealsTab } from '@/components/MealsTab';
import { ExpensesTab } from '@/components/ExpensesTab';
import { DepositsTab } from '@/components/DepositsTab';
import { ReportsMembersTab } from '@/components/ReportsMembersTab';
import { MessSwitcherModal } from '@/components/MessSwitcherModal';

const STORAGE_KEY_PREFIX = 'mess_hisab_state_v1_';

export default function MessManagerApp() {
  const [lang, setLang] = useState<Language>('bn');
  const [activeTab, setActiveTab] = useState<
    'home' | 'meals' | 'expenses' | 'deposits' | 'reports'
  >('home');

  // Mess Directory State
  const [messId, setMessId] = useState<string>(DEFAULT_MESS_ID);
  const [messName, setMessName] = useState<string>('স্বপ্ননীড় মেস');
  const [managerPin, setManagerPin] = useState<string>(DEFAULT_MANAGER_PIN);
  const [managerUids, setManagerUids] = useState<string[]>([]);
  const [memberUids, setMemberUids] = useState<string[]>([]);
  const [lockedDates, setLockedDates] = useState<string[]>(['CUTOFF_22:00']);

  // Auth & Role State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isManager, setIsManager] = useState<boolean>(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Selected Month & Date
  const [monthKey, setMonthKey] = useState<string>('2026-10');
  const [selectedMealDate, setSelectedMealDate] = useState<string>('2026-10-21');
  const [selectedSelfMealMemberId, setSelectedSelfMealMemberId] =
    useState<number>(1);

  // Domain Records State
  const seed = useMemo(() => getInitialSeedData(), []);
  const [members, setMembers] = useState<Member[]>(seed.members);
  const [meals, setMeals] = useState<MealRecord[]>(seed.meals);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(seed.expenses);
  const [deposits, setDeposits] = useState<DepositRecord[]>(seed.deposits);
  const [notice, setNotice] = useState<NoticeItem>(seed.notice);
  const [rosters, setRosters] = useState<RosterItem[]>(seed.rosters);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(
    seed.activityLogs
  );
  const [joinRequests, setJoinRequests] = useState<JoinRequestItem[]>([]);

  // Modals
  const [showMessSwitcher, setShowMessSwitcher] = useState(false);
  const [statementMemberSummary, setStatementMemberSummary] =
    useState<MemberAccountingSummary | null>(null);

  // Load offline state from localStorage on messId change
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${messId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.members) && parsed.members.length > 0) {
          setMembers(parsed.members);
        }
        if (Array.isArray(parsed.meals)) setMeals(parsed.meals);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (Array.isArray(parsed.deposits)) setDeposits(parsed.deposits);
        if (parsed.notice) setNotice(parsed.notice);
        if (Array.isArray(parsed.rosters)) setRosters(parsed.rosters);
        if (Array.isArray(parsed.activityLogs))
          setActivityLogs(parsed.activityLogs);
        if (Array.isArray(parsed.lockedDates))
          setLockedDates(parsed.lockedDates);
        if (parsed.messName) setMessName(parsed.messName);
        if (parsed.managerPin) setManagerPin(parsed.managerPin);
      }
    } catch {
      // Ignore storage parse error
    }
  }, [messId]);

  // Persist to localStorage automatically for Offline Mode resilience
  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${messId}`,
        JSON.stringify({
          messName,
          managerPin,
          lockedDates,
          members,
          meals,
          expenses,
          deposits,
          notice,
          rosters,
          activityLogs,
        })
      );
    } catch {
      // Ignore storage quota error
    }
  }, [
    messId,
    messName,
    managerPin,
    lockedDates,
    members,
    meals,
    expenses,
    deposits,
    notice,
    rosters,
    activityLogs,
  ]);

  // Listen to Firebase Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        if ((user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setIsManager(true);
        }
        await ensureUserInMessDirectory(
          user,
          messId,
          messName,
          managerPin,
          lockedDates
        );
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messId]);

  // Subscribe to Firestore 2-Way Real-Time Sync when signed in
  useEffect(() => {
    if (!currentUser) return;

    const unsubDir = subscribeMessDirectory(messId, (dirDoc) => {
      if (dirDoc) {
        if (dirDoc.messName) setMessName(dirDoc.messName);
        if (dirDoc.managerPin) setManagerPin(dirDoc.managerPin);
        if (Array.isArray(dirDoc.managerUids)) {
          setManagerUids(dirDoc.managerUids);
          if (
            dirDoc.managerUids.includes(currentUser.uid) ||
            (currentUser.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
          ) {
            setIsManager(true);
          }
        }
        if (Array.isArray(dirDoc.memberUids)) {
          setMemberUids(dirDoc.memberUids);
        }
        if (Array.isArray(dirDoc.lockedDates)) {
          setLockedDates(dirDoc.lockedDates);
        }
      }
    });

    const unsubRecords = subscribeMessRecords(
      currentUser.uid,
      messId,
      (cloudDocs: CloudMessRecordPayload[]) => {
        if (cloudDocs.length === 0) return;

        const nextMembers: Member[] = [];
        const nextMeals: MealRecord[] = [];
        const nextExpenses: ExpenseRecord[] = [];
        const nextDeposits: DepositRecord[] = [];
        const nextRosters: RosterItem[] = [];
        const nextLogs: ActivityLogItem[] = [];
        let nextNotice: NoticeItem | null = null;

        cloudDocs.forEach((doc) => {
          if (doc.recordType === 'MEMBER') {
            nextMembers.push(decodeMemberFromCloud(doc));
          } else if (doc.recordType === 'MEAL') {
            nextMeals.push(decodeMealFromCloud(doc));
          } else if (doc.recordType === 'EXPENSE') {
            nextExpenses.push(decodeExpenseFromCloud(doc));
          } else if (doc.recordType === 'DEPOSIT') {
            nextDeposits.push(decodeDepositFromCloud(doc));
          } else if (doc.recordType === 'AUDIT') {
            if (doc.role.startsWith('NOTICE_')) {
              nextNotice = decodeNoticeFromCloud(doc);
            } else if (doc.role.startsWith('ROSTER_')) {
              nextRosters.push(decodeRosterFromCloud(doc));
            } else if (doc.role.startsWith('LOG_')) {
              nextLogs.push(decodeActivityLogFromCloud(doc));
            }
          }
        });

        if (nextMembers.length > 0) {
          setMembers(nextMembers.sort((a, b) => a.id - b.id));
        }
        if (nextMeals.length > 0) {
          setMeals(nextMeals);
        }
        if (nextExpenses.length > 0) {
          setExpenses(nextExpenses.sort((a, b) => b.date.localeCompare(a.date)));
        }
        if (nextDeposits.length > 0) {
          setDeposits(nextDeposits.sort((a, b) => b.date.localeCompare(a.date)));
        }
        if (nextNotice) {
          setNotice(nextNotice);
        }
        if (nextRosters.length > 0) {
          setRosters(nextRosters.sort((a, b) => a.date.localeCompare(b.date)));
        }
        if (nextLogs.length > 0) {
          setActivityLogs(nextLogs.sort((a, b) => b.id - a.id));
        }
      }
    );

    const unsubJoin = subscribeJoinRequests(
      currentUser.uid,
      messId,
      (reqs) => {
        setJoinRequests(reqs);
      }
    );

    return () => {
      unsubDir();
      unsubRecords();
      unsubJoin();
    };
  }, [currentUser, messId]);

  const getCloudMeta = () => {
    const uid = currentUser?.uid || 'offline_local_uid';
    const effManagers =
      managerUids.length > 0 ? managerUids : [uid];
    const effMembers =
      memberUids.length > 0
        ? Array.from(new Set([...effManagers, ...memberUids, uid]))
        : [uid];
    return {
      messCode: messId,
      memberUids: effMembers,
      managerUids: effManagers,
      createdBy: uid,
    };
  };

  const appendActivityLog = (title: string, description: string, category: string) => {
    const logItem: ActivityLogItem = {
      id: Date.now(),
      title,
      description,
      actorName: currentUser?.displayName || (isManager ? 'Manager' : 'Member'),
      timeText: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      category,
    };
    setActivityLogs((prev) => [logItem, ...prev.slice(0, 29)]);
    if (currentUser) {
      upsertCloudMessRecord(
        encodeActivityLogToCloud(logItem, getCloudMeta())
      ).catch(() => {});
    }
  };

  // Monthly Accounting Calculation
  const accounting = useMemo(
    () =>
      calculateMonthlyAccounting({
        monthKey,
        members,
        meals,
        expenses,
        deposits,
      }),
    [monthKey, members, meals, expenses, deposits]
  );

  const monthLocked = isMonthClosed(lockedDates, monthKey);
  const selectedDateLocked = isDateLocked(lockedDates, selectedMealDate);
  const cutoffTime = getMealCutoffTime(lockedDates);
  const tomorrowDate = `${monthKey}-22`;

  // Handlers
  const handleGoogleSignIn = async () => {
    try {
      setAuthNotice(null);
      const user = await signInWithGooglePopup();
      if ((user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsManager(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled';
      setAuthNotice(
        lang === 'bn'
          ? `গুগল সাইন-ইন পপআপ সম্পন্ন হয়নি (${msg}) — অফলাইন মোড চালু আছে।`
          : `Google Sign-In popup did not complete (${msg}) — Offline Mode remains active.`
      );
    }
  };

  const handleSignOut = async () => {
    await signOutFirebase();
    setCurrentUser(null);
  };

  const syncLockedDatesToCloud = (nextLocks: string[]) => {
    setLockedDates(nextLocks);
    if (currentUser) {
      const meta = getCloudMeta();
      upsertMessDirectoryDoc({
        messId,
        messName,
        managerPin,
        managerUids: meta.managerUids,
        memberUids: meta.memberUids,
        lockedDates: nextLocks,
      }).catch(() => {});
    }
  };

  const handleToggleMonthLock = () => {
    const next = toggleMonthClosedInLockedDates(lockedDates, monthKey);
    syncLockedDatesToCloud(next);
    appendActivityLog(
      isMonthClosed(next, monthKey)
        ? `মাসিক হিসাব লক করা হয়েছে (${monthKey})`
        : `মাসিক হিসাব আনলক করা হয়েছে (${monthKey})`,
      `Mess ${messId} month status updated`,
      'MONTH_LOCK'
    );
  };

  const handleToggleDateLock = (dateStr: string) => {
    const next = toggleDateLockInLockedDates(lockedDates, dateStr);
    syncLockedDatesToCloud(next);
  };

  const handleUpdateCutoffTime = (newTime: string) => {
    const next = updateMealCutoffInLockedDates(lockedDates, newTime);
    syncLockedDatesToCloud(next);
  };

  const handleUpsertMeal = (
    memberId: number,
    date: string,
    breakfast: number,
    lunch: number,
    dinner: number,
    guestMeal: number,
    notes: string,
    recordedBy: 'MANAGER' | 'SELF' = 'MANAGER'
  ) => {
    const existing = meals.find(
      (m) => m.date === date && m.memberId === memberId
    );
    const mealObj: MealRecord = {
      id: existing ? existing.id : Date.now() + memberId,
      date,
      memberId,
      breakfast,
      lunch,
      dinner,
      guestMeal,
      notes,
      recordedBy,
    };

    setMeals((prev) => {
      const idx = prev.findIndex(
        (m) => m.date === date && m.memberId === memberId
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = mealObj;
        return copy;
      }
      return [...prev, mealObj];
    });

    if (currentUser) {
      upsertCloudMessRecord(encodeMealToCloud(mealObj, getCloudMeta())).catch(
        () => {}
      );
    }
  };

  const handleQuickFillAllActive = (
    date: string,
    bWeight: number,
    lWeight: number,
    dWeight: number
  ) => {
    const activeList = members.filter((m) => m.isActive);
    const updatedMeals = [...meals];
    const meta = getCloudMeta();

    activeList.forEach((m, i) => {
      const idx = updatedMeals.findIndex(
        (rec) => rec.date === date && rec.memberId === m.id
      );
      const existing = idx >= 0 ? updatedMeals[idx] : null;
      const mealObj: MealRecord = {
        id: existing ? existing.id : Date.now() + i,
        date,
        memberId: m.id,
        breakfast: bWeight,
        lunch: lWeight,
        dinner: dWeight,
        guestMeal: existing ? existing.guestMeal : 0,
        notes: existing ? existing.notes : '',
        recordedBy: 'MANAGER',
      };
      if (idx >= 0) {
        updatedMeals[idx] = mealObj;
      } else {
        updatedMeals.push(mealObj);
      }
      if (currentUser) {
        upsertCloudMessRecord(encodeMealToCloud(mealObj, meta)).catch(() => {});
      }
    });

    setMeals(updatedMeals);
    appendActivityLog(
      `ডেইলি মিল কুইক-ফিল (${date})`,
      `${activeList.length} জন সক্রিয় মেম্বারের মিল আপডেট করা হয়েছে`,
      'MEAL'
    );
  };

  const handleSaveExpense = (
    expInput: Omit<ExpenseRecord, 'id'>,
    existingId?: number
  ) => {
    const expObj: ExpenseRecord = {
      ...expInput,
      id: existingId || Date.now(),
    };
    setExpenses((prev) =>
      existingId
        ? prev.map((e) => (e.id === existingId ? expObj : e))
        : [expObj, ...prev]
    );
    if (currentUser) {
      upsertCloudMessRecord(encodeExpenseToCloud(expObj, getCloudMeta())).catch(
        () => {}
      );
    }
    appendActivityLog(
      `${expObj.isFoodExpense ? 'বাজার খরচ' : 'শেয়ার্ড বিল'} যুক্ত (৳${expObj.amount})`,
      `${expObj.title} — ${expObj.paidByName}`,
      'EXPENSE'
    );
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (currentUser) {
      deleteCloudMessRecord(cloudRecordId(`EXPENSE_${id}`, messId)).catch(
        () => {}
      );
    }
  };

  const handleSaveDeposit = (
    depInput: Omit<DepositRecord, 'id'>,
    existingId?: number
  ) => {
    const depObj: DepositRecord = {
      ...depInput,
      id: existingId || Date.now(),
    };
    setDeposits((prev) =>
      existingId
        ? prev.map((d) => (d.id === existingId ? depObj : d))
        : [depObj, ...prev]
    );
    if (currentUser) {
      upsertCloudMessRecord(encodeDepositToCloud(depObj, getCloudMeta())).catch(
        () => {}
      );
    }
    const mem = members.find((m) => m.id === depObj.memberId);
    appendActivityLog(
      `টাকা জমা যুক্ত (৳${depObj.amount})`,
      `${mem ? mem.name : 'Member'} (${depObj.paymentMethod})`,
      'DEPOSIT'
    );
  };

  const handleDeleteDeposit = (id: number) => {
    setDeposits((prev) => prev.filter((d) => d.id !== id));
    if (currentUser) {
      deleteCloudMessRecord(cloudRecordId(`DEPOSIT_${id}`, messId)).catch(
        () => {}
      );
    }
  };

  const handleSaveMember = (
    memberInput: Omit<Member, 'id'>,
    existingId?: number
  ) => {
    const nextId =
      existingId ||
      (members.length > 0 ? Math.max(...members.map((m) => m.id)) + 1 : 1);
    const memberObj: Member = {
      ...memberInput,
      id: nextId,
    };
    setMembers((prev) =>
      existingId
        ? prev.map((m) => (m.id === existingId ? memberObj : m))
        : [...prev, memberObj]
    );
    if (currentUser) {
      upsertCloudMessRecord(
        encodeMemberToCloud(memberObj, getCloudMeta())
      ).catch(() => {});
    }
    appendActivityLog(
      existingId ? `মেম্বার তথ্য আপডেট: ${memberObj.name}` : `নতুন মেম্বার যুক্ত: ${memberObj.name}`,
      `রুম: ${memberObj.roomNumber} · রোল: ${memberObj.role}`,
      'MEMBER'
    );
  };

  const handleToggleMemberActive = (memberId: number) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const updated: Member = { ...target, isActive: !target.isActive };
    setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    if (currentUser) {
      upsertCloudMessRecord(encodeMemberToCloud(updated, getCloudMeta())).catch(
        () => {}
      );
    }
  };

  const handleDeleteMember = (memberId: number) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (currentUser) {
      deleteCloudMessRecord(cloudRecordId(`MEMBER_${memberId}`, messId)).catch(
        () => {}
      );
    }
  };

  const handleSaveNotice = (updated: NoticeItem) => {
    setNotice(updated);
    if (currentUser) {
      upsertCloudMessRecord(encodeNoticeToCloud(updated, getCloudMeta())).catch(
        () => {}
      );
    }
    appendActivityLog(`নোটিশ আপডেট: ${updated.title}`, updated.message, 'NOTICE');
  };

  const handleAddRoster = (date: string, memberId: number, note: string) => {
    const mem = members.find((m) => m.id === memberId);
    const item: RosterItem = {
      id: Date.now(),
      date,
      memberId,
      memberName: mem ? mem.name : 'Member',
      note,
      status: 'UPCOMING',
    };
    setRosters((prev) => [item, ...prev]);
    if (currentUser) {
      upsertCloudMessRecord(encodeRosterToCloud(item, getCloudMeta())).catch(
        () => {}
      );
    }
  };

  const handleToggleRosterStatus = (rosterId: number) => {
    const target = rosters.find((r) => r.id === rosterId);
    if (!target) return;
    const updated: RosterItem = {
      ...target,
      status: target.status === 'UPCOMING' ? 'COMPLETED' : 'UPCOMING',
    };
    setRosters((prev) => prev.map((r) => (r.id === rosterId ? updated : r)));
    if (currentUser) {
      upsertCloudMessRecord(encodeRosterToCloud(updated, getCloudMeta())).catch(
        () => {}
      );
    }
  };

  const handleDeleteRoster = (rosterId: number) => {
    setRosters((prev) => prev.filter((r) => r.id !== rosterId));
    if (currentUser) {
      deleteCloudMessRecord(
        cloudRecordId(`AUDIT_ROSTER_${rosterId}`, messId)
      ).catch(() => {});
    }
  };

  const handleSimulateJoinRequest = (userName: string, userEmail: string) => {
    const req: JoinRequestItem = {
      userId: currentUser?.uid || `req_${Date.now()}`,
      userName,
      userEmail,
      messId,
      status: 'PENDING',
      managerUids: getCloudMeta().managerUids,
    };
    setJoinRequests((prev) => [req, ...prev]);
    if (currentUser) {
      upsertJoinRequest(req).catch(() => {});
    }
  };

  const handleApproveJoinRequest = (req: JoinRequestItem) => {
    setJoinRequests((prev) =>
      prev.map((r) =>
        r.userId === req.userId ? { ...r, status: 'APPROVED' } : r
      )
    );
    // Add to Member Directory if not already present
    handleSaveMember({
      name: req.userName,
      phone: '',
      roomNumber: `${messId}-New`,
      email: req.userEmail,
      joiningDate: `${monthKey}-01`,
      role: 'Member',
      notes: req.userId,
      isActive: true,
    });
    if (currentUser) {
      upsertJoinRequest({ ...req, status: 'APPROVED' }).catch(() => {});
    }
  };

  const handleRejectJoinRequest = (req: JoinRequestItem) => {
    setJoinRequests((prev) =>
      prev.map((r) =>
        r.userId === req.userId ? { ...r, status: 'REJECTED' } : r
      )
    );
    if (currentUser) {
      upsertJoinRequest({ ...req, status: 'REJECTED' }).catch(() => {});
    }
  };

  const handleForceCloudPush = async () => {
    if (!currentUser) return;
    const meta = getCloudMeta();
    await upsertMessDirectoryDoc({
      messId,
      messName,
      managerPin,
      managerUids: meta.managerUids,
      memberUids: meta.memberUids,
      lockedDates,
    });
    for (const m of members) {
      await upsertCloudMessRecord(encodeMemberToCloud(m, meta));
    }
    for (const meal of meals) {
      await upsertCloudMessRecord(encodeMealToCloud(meal, meta));
    }
    for (const exp of expenses) {
      await upsertCloudMessRecord(encodeExpenseToCloud(exp, meta));
    }
    for (const dep of deposits) {
      await upsertCloudMessRecord(encodeDepositToCloud(dep, meta));
    }
    await upsertCloudMessRecord(encodeNoticeToCloud(notice, meta));
    for (const r of rosters) {
      await upsertCloudMessRecord(encodeRosterToCloud(r, meta));
    }
  };

  const handleDownloadMonthlyPdf = () => {
    generateMonthlyMessPdf({
      messName,
      messId,
      monthKey,
      accounting,
      expenses: expenses.filter((e) => e.date.startsWith(monthKey)),
      deposits: deposits.filter((d) => d.date.startsWith(monthKey)),
    });
  };

  const tomorrowMeal = meals.find(
    (m) =>
      m.date === tomorrowDate && m.memberId === selectedSelfMealMemberId
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F5] text-[#173125] pb-20 lg:pb-10">
      {/* Top App Bar */}
      <HeaderBar
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
        messId={messId}
        messName={messName}
        isManager={isManager}
        isMonthLocked={monthLocked}
        monthKey={monthKey}
        onPrevMonth={() => {
          const prev = shiftMonthKey(monthKey, -1);
          setMonthKey(prev);
          setSelectedMealDate(`${prev}-15`);
        }}
        onNextMonth={() => {
          const next = shiftMonthKey(monthKey, 1);
          setMonthKey(next);
          setSelectedMealDate(`${next}-15`);
        }}
        onToggleMonthLock={handleToggleMonthLock}
        onOpenMessSwitcher={() => setShowMessSwitcher(true)}
        isOnlineSynced={Boolean(currentUser)}
        userEmail={currentUser?.email || null}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Optional Non-Intrusive Auth Feedback Banner */}
      {authNotice && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-3 no-print">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>{authNotice}</span>
            <button
              type="button"
              onClick={() => setAuthNotice(null)}
              className="font-bold ml-3 underline"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        {activeTab === 'home' && (
          <HomeTab
            lang={lang}
            messId={messId}
            messName={messName}
            monthKey={monthKey}
            isManager={isManager}
            accounting={accounting}
            notice={notice}
            onSaveNotice={handleSaveNotice}
            cutoffTime={cutoffTime}
            onUpdateCutoffTime={handleUpdateCutoffTime}
            selectedMemberIdForSelfMeal={selectedSelfMealMemberId}
            onChangeSelfMealMember={setSelectedSelfMealMemberId}
            tomorrowDate={tomorrowDate}
            tomorrowMeal={tomorrowMeal}
            onSaveSelfMeal={(mId, date, b, l, d, g, notes) =>
              handleUpsertMeal(mId, date, b, l, d, g, notes, 'SELF')
            }
            rosters={rosters}
            members={members}
            onAddRoster={handleAddRoster}
            onToggleRosterStatus={handleToggleRosterStatus}
            onDeleteRoster={handleDeleteRoster}
            joinRequests={joinRequests}
            onApproveJoinRequest={handleApproveJoinRequest}
            onRejectJoinRequest={handleRejectJoinRequest}
            onSimulateJoinRequest={handleSimulateJoinRequest}
            activityLogs={activityLogs}
            onNavigateTab={setActiveTab}
            onDownloadMonthlyPdf={handleDownloadMonthlyPdf}
            onInspectMemberStatement={(summary) => {
              setStatementMemberSummary(summary);
              setActiveTab('reports');
            }}
          />
        )}

        {activeTab === 'meals' && (
          <MealsTab
            lang={lang}
            monthKey={monthKey}
            selectedDate={selectedMealDate}
            onSelectDate={setSelectedMealDate}
            isManager={isManager}
            isSelectedDateLocked={selectedDateLocked}
            onToggleDateLock={handleToggleDateLock}
            members={members}
            meals={meals}
            onUpsertMeal={(mId, date, b, l, d, g, notes) =>
              handleUpsertMeal(mId, date, b, l, d, g, notes, 'MANAGER')
            }
            onQuickFillAllActive={handleQuickFillAllActive}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            lang={lang}
            monthKey={monthKey}
            isManager={isManager}
            isMonthLocked={monthLocked}
            expenses={expenses}
            members={members}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'deposits' && (
          <DepositsTab
            lang={lang}
            monthKey={monthKey}
            isManager={isManager}
            isMonthLocked={monthLocked}
            deposits={deposits}
            members={members}
            onSaveDeposit={handleSaveDeposit}
            onDeleteDeposit={handleDeleteDeposit}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsMembersTab
            lang={lang}
            messId={messId}
            messName={messName}
            monthKey={monthKey}
            isManager={isManager}
            isMonthLocked={monthLocked}
            onToggleMonthLock={handleToggleMonthLock}
            accounting={accounting}
            members={members}
            meals={meals}
            expenses={expenses}
            deposits={deposits}
            onDownloadMonthlyPdf={handleDownloadMonthlyPdf}
            onSaveMember={handleSaveMember}
            onToggleMemberActive={handleToggleMemberActive}
            onDeleteMember={handleDeleteMember}
            statementMemberSummary={statementMemberSummary}
            onSelectStatementMember={setStatementMemberSummary}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (5 Tabs) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center h-16 px-1 no-print"
      >
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeTab === 'home' ? 'text-[#173125] font-bold' : 'text-slate-500'
          }`}
        >
          <Home
            className={`w-5 h-5 ${
              activeTab === 'home' ? 'text-[#438A53]' : 'text-slate-400'
            }`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('meals')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeTab === 'meals' ? 'text-[#173125] font-bold' : 'text-slate-500'
          }`}
        >
          <Utensils
            className={`w-5 h-5 ${
              activeTab === 'meals' ? 'text-[#438A53]' : 'text-slate-400'
            }`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            {lang === 'bn' ? 'মিল' : 'Meals'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeTab === 'expenses'
              ? 'text-[#173125] font-bold'
              : 'text-slate-500'
          }`}
        >
          <ShoppingBag
            className={`w-5 h-5 ${
              activeTab === 'expenses' ? 'text-[#438A53]' : 'text-slate-400'
            }`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            {lang === 'bn' ? 'খরচ' : 'Expenses'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deposits')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeTab === 'deposits'
              ? 'text-[#173125] font-bold'
              : 'text-slate-500'
          }`}
        >
          <Wallet
            className={`w-5 h-5 ${
              activeTab === 'deposits' ? 'text-[#438A53]' : 'text-slate-400'
            }`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            {lang === 'bn' ? 'জমা' : 'Deposits'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
            activeTab === 'reports'
              ? 'text-[#173125] font-bold'
              : 'text-slate-500'
          }`}
        >
          <FileSpreadsheet
            className={`w-5 h-5 ${
              activeTab === 'reports' ? 'text-[#438A53]' : 'text-slate-400'
            }`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            {lang === 'bn' ? 'রিপোর্ট' : 'Reports'}
          </span>
        </button>
      </nav>

      {/* Mess Switcher & Manager PIN Modal */}
      <MessSwitcherModal
        lang={lang}
        isOpen={showMessSwitcher}
        onClose={() => setShowMessSwitcher(false)}
        messId={messId}
        messName={messName}
        managerPin={managerPin}
        isManager={isManager}
        onSaveMessSettings={(nextId, nextName, nextPin) => {
          setMessId(nextId);
          setMessName(nextName);
          setManagerPin(nextPin);
          if (currentUser) {
            const meta = getCloudMeta();
            upsertMessDirectoryDoc({
              messId: nextId,
              messName: nextName,
              managerPin: nextPin,
              managerUids: meta.managerUids,
              memberUids: meta.memberUids,
              lockedDates,
            }).catch(() => {});
          }
        }}
        onUnlockWithPin={(enteredPin) => {
          if (enteredPin === managerPin || enteredPin === DEFAULT_MANAGER_PIN) {
            setIsManager(true);
            return true;
          }
          return false;
        }}
        onSwitchToMemberMode={() => setIsManager(false)}
        isOnlineSynced={Boolean(currentUser)}
        onForceCloudPush={handleForceCloudPush}
      />
    </div>
  );
}
