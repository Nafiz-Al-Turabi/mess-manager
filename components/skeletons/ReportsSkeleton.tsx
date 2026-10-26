import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonBadge } from './Skeleton';

interface ReportsSkeletonProps {
  lang?: 'bn' | 'en';
}

export function ReportsSkeleton({ lang = 'bn' }: ReportsSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* 1. FULL MONTHLY ACCOUNTING REPORT TABLE SKELETON */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-64 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-96 rounded" />
          </div>

          <div className="grid grid-cols-2 md:flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* High-Density Accounting Table */}
        <div className="mt-5 overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="border-y border-slate-200 bg-[#F6F8F5] text-[11px] font-bold text-slate-600">
                <th className="py-3 px-3"><Skeleton className="h-3 w-24 rounded" /></th>
                <th className="py-3 px-2.5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
                <th className="py-3 px-2.5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
                <th className="py-3 px-2.5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
                <th className="py-3 px-2.5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
                <th className="py-3 px-2.5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
                <th className="py-3 px-2.5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
                <th className="py-3 px-2.5 text-right"><Skeleton className="h-3 w-16 rounded ml-auto" /></th>
                <th className="py-3 px-3 text-right"><Skeleton className="h-3 w-18 rounded ml-auto" /></th>
                <th className="py-3 px-2 text-center"><Skeleton className="h-3 w-14 rounded mx-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </td>
                  <td className="py-3.5 px-2.5 text-right"><Skeleton className="h-4 w-10 rounded ml-auto" /></td>
                  <td className="py-3.5 px-2.5 text-right"><Skeleton className="h-4 w-14 rounded ml-auto" /></td>
                  <td className="py-3.5 px-2.5 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></td>
                  <td className="py-3.5 px-2.5 text-right"><Skeleton className="h-4 w-14 rounded ml-auto" /></td>
                  <td className="py-3.5 px-2.5 text-right"><Skeleton className="h-4 w-14 rounded ml-auto" /></td>
                  <td className="py-3.5 px-2.5 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></td>
                  <td className="py-3.5 px-2.5 text-right"><Skeleton className="h-4 w-14 rounded ml-auto" /></td>
                  <td className="py-3.5 px-3 text-right"><Skeleton className="h-4 w-16 rounded ml-auto" /></td>
                  <td className="py-3.5 px-2 text-center"><Skeleton className="h-7 w-16 rounded-lg mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. MEMBER DIRECTORY & PROFILE MANAGEMENT SKELETON */}
      <section className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-52 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-64 rounded" />
          </div>

          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="divide-y divide-slate-100 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="py-3.5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <SkeletonAvatar size="sm" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <SkeletonBadge className="w-14" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

