import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonBadge } from './Skeleton';

interface MealsSkeletonProps {
  lang?: 'bn' | 'en';
}

export function MealsSkeleton({ lang = 'bn' }: MealsSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Top Toolbar: Date Picker, Lock, Summary Metrics */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-64 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-72 rounded" />
          </div>

          {/* Date picker & Lock Button Placeholder */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#F6F8F5] px-3 py-2 rounded-xl border border-slate-200">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3.5 w-12 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* 1-Click Quick Fill Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-60 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* 3 Metrics Strip: Lunch, Dinner, Day Total */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-[#F6F8F5] space-y-1.5">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
          </div>
          <div className="p-3 rounded-xl bg-[#F6F8F5] space-y-1.5">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
          </div>
          <div className="p-3 rounded-xl bg-[#173125] space-y-1.5">
            <Skeleton variant="dark" className="h-3 w-24 rounded" />
            <Skeleton variant="dark" className="h-6 w-14 rounded" />
          </div>
        </div>
      </section>

      {/* Per-Member Meal Counter List Skeleton (5 rows) */}
      <section className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-[#173125]/10 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            {/* Member Info */}
            <div className="min-w-[200px] space-y-2">
              <div className="flex items-center gap-2">
                <SkeletonAvatar size="sm" />
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
              <SkeletonBadge className="w-20" />
            </div>

            {/* 2 Meal Counters: Lunch & Dinner */}
            <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
              {/* Lunch Counter */}
              <div className="p-2.5 rounded-xl bg-[#F6F8F5] border border-slate-200/80 flex flex-col items-center space-y-2">
                <Skeleton className="h-3 w-16 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-6 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>

              {/* Dinner Counter */}
              <div className="p-2.5 rounded-xl bg-[#F6F8F5] border border-slate-200/80 flex flex-col items-center space-y-2">
                <Skeleton className="h-3 w-16 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-6 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

