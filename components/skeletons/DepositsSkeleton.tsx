import React from 'react';
import { Skeleton, SkeletonBadge } from './Skeleton';

interface DepositsSkeletonProps {
  lang?: 'bn' | 'en';
}

export function DepositsSkeleton({ lang = 'bn' }: DepositsSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header & Filter Strip */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-64 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-80 rounded" />
          </div>

          <div className="flex justify-between w-full md:w-auto items-center gap-4">
            <div className="text-right space-y-1">
              <Skeleton className="h-3 w-24 rounded ml-auto" />
              <Skeleton className="h-6 w-16 rounded ml-auto" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Member Filter Pills Row */}
        <div className="pt-4 border-t border-slate-100 flex overflow-x-auto items-center gap-2 pb-1">
          <Skeleton className="h-9 w-28 rounded-lg shrink-0" />
          <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
          <Skeleton className="h-9 w-24 rounded-lg shrink-0" />
          <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
          <Skeleton className="h-9 w-22 rounded-lg shrink-0" />
        </div>
      </section>

      {/* Deposits List Skeleton (5 rows) */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-16 rounded" />
                <SkeletonBadge className="w-16" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>

              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
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

