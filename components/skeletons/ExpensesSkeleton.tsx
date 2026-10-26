import React from 'react';
import { Skeleton, SkeletonBadge } from './Skeleton';

interface ExpensesSkeletonProps {
  lang?: 'bn' | 'en';
}

export function ExpensesSkeleton({ lang = 'bn' }: ExpensesSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header & Summary Strip */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-64 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-80 rounded" />
          </div>

          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-[#F6F8F5] space-y-1.5">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
          </div>
          <div className="p-3.5 rounded-xl bg-[#F6F8F5] space-y-1.5">
            <Skeleton className="h-3 w-36 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
          </div>
          <div className="p-3.5 rounded-xl bg-[#173125] space-y-1.5">
            <Skeleton variant="dark" className="h-3 w-28 rounded" />
            <Skeleton variant="dark" className="h-7 w-24 rounded" />
          </div>
        </div>

        {/* Filter Bar & Search Input */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="inline-flex w-full md:w-fit rounded-xl bg-[#F6F8F5] p-1 border border-slate-200 gap-1.5">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>

          <Skeleton className="h-9 w-full md:w-64 rounded-xl" />
        </div>
      </section>

      {/* Expenses List Skeleton (5 rows) */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-16 rounded" />
                <SkeletonBadge className="w-20" />
                <SkeletonBadge className="w-16" />
              </div>

              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3 w-64 rounded" />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Skeleton className="h-6 w-16 rounded" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

