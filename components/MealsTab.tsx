'use client';

import React from 'react';
import {
  Calendar,
  CheckCheck,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Unlock,
  Utensils,
} from 'lucide-react';
import { Language, MealRecord, Member } from '@/lib/types';
import { formatNumber } from '@/lib/i18n';
import { AppUser } from '@/lib/mongo-client';

interface MealsTabProps {
  lang: Language;
  monthKey: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isManager: boolean;
  currentUser?: AppUser | null;
  isSelectedDateLocked: boolean;
  onToggleDateLock: (date: string) => void;
  members: Member[];
  meals: MealRecord[];
  onUpsertMeal: (
    memberId: number,
    date: string,
    breakfast: number,
    lunch: number,
    dinner: number,
    guestMeal: number,
    notes: string
  ) => void;
  onQuickFillAllActive: (
    date: string,
    breakfastWeight: number,
    lunch: number,
    dinner: number
  ) => void;
}

export function MealsTab({
  lang,
  monthKey,
  selectedDate,
  onSelectDate,
  isManager,
  currentUser,
  isSelectedDateLocked,
  onToggleDateLock,
  members,
  meals,
  onUpsertMeal,
  onQuickFillAllActive,
}: MealsTabProps) {
  const activeMembers = members.filter((m) => m.isActive);
  const dateMeals = meals.filter((m) => m.date === selectedDate);

  const dayTotalBreakfast = dateMeals.reduce((s, m) => s + m.breakfast, 0);
  const dayTotalLunch = dateMeals.reduce((s, m) => s + m.lunch, 0);
  const dayTotalDinner = dateMeals.reduce((s, m) => s + m.dinner, 0);
  const dayGrandTotal = dayTotalLunch + dayTotalDinner;

  const canEdit = isManager && !isSelectedDateLocked;

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Date Picker, Date Lock, 1-Click Quick Fill */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#173125] flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#438A53]" />
              <span>
                {lang === 'bn'
                  ? 'প্রতিদিনের মিল শীট ও এন্ট্রি (Daily Meals)'
                  : 'Daily Meal Sheet & Counter'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'তারিখ নির্বাচন করে দুপুর ও রাত মিল প্লাস/মাইনাস বাটনে এন্ট্রি করুন'
                : 'Select date and adjust per-member lunch and dinner counts'}
            </p>
          </div>

          {/* Date Selector & Lock Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#F6F8F5] px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-[#438A53]" />
              <label htmlFor="meal-date-picker" className="text-xs font-semibold text-slate-600">
                {lang === 'bn' ? 'তারিখ:' : 'Date:'}
              </label>
              <input
                id="meal-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) =>
                  onSelectDate(e.target.value || `${monthKey}-21`)
                }
                className="text-xs py-1.25 font-numeric font-bold text-[#173125] bg-transparent focus:outline-none"
              />
            </div>

            {isManager && (
              <button
                type="button"
                onClick={() => onToggleDateLock(selectedDate)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isSelectedDateLocked
                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                    : 'bg-[#F6F8F5] text-[#173125] hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {isSelectedDateLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>{lang === 'bn' ? 'তারিখ লক করা (আনলক)' : 'Date Locked (Unlock)'}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-[#438A53]" />
                    <span>{lang === 'bn' ? 'তারিখ খোলা (লক করুন)' : 'Lock This Date'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Manager 1-Click Quick Fill & Reset */}
        {canEdit && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'এক ক্লিকে সকল সক্রিয় মেম্বারদের মিল এন্ট্রি করুন:'
                : 'Quick bulk actions for all active members:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onQuickFillAllActive(selectedDate, 0, 1, 1)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#173125] hover:bg-[#173125]/90 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                {/* <CheckCheck className="w-4 h-4 text-[#FED24F]" /> */}
                <span>
                  {lang === 'bn'
                    ? 'সবার ফুল মিল (১ দুপুর + ১ রাত)'
                    : 'Fill All (1 Lunch + 1 Dinner)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onQuickFillAllActive(selectedDate, 0, 0, 0)}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'রিসেট (সব ০)' : 'Reset Day (0)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected Date Summary Strip */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-[#F6F8F5]">
            <p className="text-xs text-slate-500 font-extrabold">
              {lang === 'bn' ? 'দুপুর (Lunch)' : 'Lunch Total'}
            </p>
            <p className="text-base font-bold font-numeric text-[#173125] mt-0.5">
              {formatNumber(dayTotalLunch, lang, 0)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#F6F8F5]">
            <p className="text-xs text-slate-500 font-extrabold">
              {lang === 'bn' ? 'রাত (Dinner)' : 'Dinner Total'}
            </p>
            <p className="text-base font-bold font-numeric text-[#173125] mt-0.5">
              {formatNumber(dayTotalDinner, lang, 0)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#173125] text-white">
            <p className="text-xs text-white/75 font-extrabold">
              {lang === 'bn' ? 'দিনের মোট মিল' : 'Day Total Meals'}
            </p>
            <p className="text-lg font-bold font-numeric text-[#FED24F] mt-0.5">
              {formatNumber(dayGrandTotal, lang, 0)}
            </p>
          </div>
        </div>

        {/* Locked Date Status Banner */}
        {isSelectedDateLocked && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                {lang === 'bn'
                  ? `সতর্কবার্তা: ${selectedDate} তারিখের মিল শীট বর্তমানে লক করা আছে। লক থাকা অবস্থায় মিল সংখ্যা পরিবর্তন করা যাবে না।`
                  : `Notice: Meal entries for ${selectedDate} are currently locked. Unlock the date to modify meal counts.`}
              </span>
            </div>
            {isManager && (
              <button
                type="button"
                onClick={() => onToggleDateLock(selectedDate)}
                className="px-3 py-1.5 rounded-lg bg-[#173125] text-[#FED24F] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap hover:bg-[#438A53] hover:text-white transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>
                  {lang === 'bn' ? 'এখনই আনলক করুন' : 'Unlock Date Now'}
                </span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Per-Member Meal Counter List */}
      <section className="space-y-3">
        {activeMembers.map((member) => {
          const rec = dateMeals.find((m) => m.memberId === member.id);
          const b = rec ? rec.breakfast : 0;
          const l = rec ? rec.lunch : 0;
          const d = rec ? rec.dinner : 0;
          const notes = rec ? rec.notes : '';
          const total = l + d;

          const adjust = (
            nextB: number,
            nextL: number,
            nextD: number,
            nextG = 0,
            nextNotes = notes
          ) => {
            if (!canEdit) return;
            onUpsertMeal(
              member.id,
              selectedDate,
              Math.max(0, Number(nextB.toFixed(1))),
              Math.max(0, Number(nextL.toFixed(1))),
              Math.max(0, Number(nextD.toFixed(1))),
              0,
              nextNotes
            );
          };

          return (
            <div
              key={member.id}
              className="rounded-2xl bg-white border border-[#173125]/10 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Member Info */}
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#173125]">
                    {member.name}
                  </h2>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-numeric text-slate-500">
                    {member.roomNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-numeric font-bold bg-[#438A53]/10 text-[#2C3E35] border border-[#438A53]/20">
                    <span>{lang === 'bn' ? 'আজকের মিল:' : 'Meals:'}</span>
                    <span className="text-sm text-[#438A53]">{formatNumber(total, lang, 0)}</span>
                  </span>
                  {rec?.recordedBy === 'SELF' && (
                    <span className="text-[11px] text-slate-500 font-normal">
                      · {lang === 'bn' ? 'সেলফ এন্ট্রি' : 'Self'}
                    </span>
                  )}
                </div>
              </div>

              {/* 2 Meal Counters: Lunch, Dinner */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                {/* Lunch Counter */}
                <div className="p-2.5 rounded-xl bg-[#F6F8F5] border border-slate-200/80 flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                    {lang === 'bn' ? 'দুপুর (Lunch)' : 'Lunch'}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => adjust(0, l - 1, d)}
                      aria-label={`Decrease lunch for ${member.name}`}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#173125] active:scale-95 hover:bg-slate-100 disabled:opacity-40 transition-transform touch-manipulation"
                    >
                      <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <span className="w-9 text-center font-numeric font-bold text-sm text-[#173125]">
                      {Math.round(l)}
                    </span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => adjust(0, l + 1, d)}
                      aria-label={`Increase lunch for ${member.name}`}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#173125] text-[#FED24F] flex items-center justify-center active:scale-95 hover:bg-[#438A53] disabled:opacity-40 transition-transform touch-manipulation"
                    >
                      <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dinner Counter */}
                <div className="p-2.5 rounded-xl bg-[#F6F8F5] border border-slate-200/80 flex flex-col items-center">
                  <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                    {lang === 'bn' ? 'রাত (Dinner)' : 'Dinner'}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => adjust(0, l, d - 1)}
                      aria-label={`Decrease dinner for ${member.name}`}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#173125] active:scale-95 hover:bg-slate-100 disabled:opacity-40 transition-transform touch-manipulation"
                    >
                      <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <span className="w-9 text-center font-numeric font-bold text-sm text-[#173125]">
                      {Math.round(d)}
                    </span>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => adjust(0, l, d + 1)}
                      aria-label={`Increase dinner for ${member.name}`}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#173125] text-[#FED24F] flex items-center justify-center active:scale-95 hover:bg-[#438A53] disabled:opacity-40 transition-transform touch-manipulation"
                    >
                      <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day Total Badge on the side */}
              <div className="flex lg:flex-col items-center justify-center px-4 py-2 rounded-xl bg-[#F6F8F5] border border-slate-200 min-w-[100px] text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {lang === 'bn' ? 'মোট মিল' : 'Day Total'}
                </span>
                <span className="text-xl font-bold font-numeric text-[#2C3E35] lg:mt-0.5 ml-2 lg:ml-0">
                  {formatNumber(total, lang, 0)}
                </span>
              </div>
          
            </div>
          );
        })}
      </section>
    </div>
  );
}
