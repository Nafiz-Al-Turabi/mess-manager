import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonBadge } from './Skeleton';

interface HomeSkeletonProps {
  lang?: 'bn' | 'en';
}

export function HomeSkeleton({ lang = 'bn' }: HomeSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* 1. TOP HERO CARD & 6 FINANCIAL METRICS */}
      <section className="rounded-2xl bg-[#173125] text-white p-5 sm:p-6 shadow-lg shadow-emerald-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Mess badge */}
            <div className="flex items-center gap-2">
              <Skeleton variant="dark" className="h-6 w-28 rounded-full" />
              <Skeleton variant="dark" className="h-6 w-20 rounded-full" />
            </div>
            {/* Month title */}
            <Skeleton variant="dark" className="h-8 w-48 rounded-lg mt-1 sm:mt-0" />
          </div>

          {/* Action button */}
          <div className="flex justify-center md:justify-start w-full md:w-fit items-center gap-2">
            <Skeleton variant="dark" className="h-10 w-44 rounded-xl" />
          </div>
        </div>

        {/* 6 Financial Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2"
            >
              <Skeleton variant="dark" className="h-3 w-3/4 rounded" />
              <Skeleton variant="dark" className="h-7 w-20 rounded" />
              <Skeleton variant="dark" className="h-2.5 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* 2. NOTICE BOARD BANNER & 4 QUICK ACTION BUTTONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Notice Board Banner */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#173125]/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-64 rounded mt-2" />

            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-4/5 rounded" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>

        {/* 4 Quick Actions Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white border border-[#173125]/10 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <div className="mt-3 space-y-1.5">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-2.5 w-28 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TWO COLUMN LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tomorrow's Meal Planner + Duty Roster */}
        <div className="lg:col-span-6 space-y-6">
          {/* Tomorrow's Meal Card */}
          <div className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-40 rounded" />
              </div>
              <SkeletonBadge className="w-24" />
            </div>
            <Skeleton className="h-3 w-56 rounded" />

            {/* Meal counters placeholder */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#F6F8F5] flex flex-col items-center space-y-2"
                >
                  <Skeleton className="h-3 w-12 rounded" />
                  <Skeleton className="h-6 w-8 rounded" />
                </div>
              ))}
            </div>

            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Daily Duty Roster Card */}
          <div className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-36 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>

            <div className="space-y-3 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#F6F8F5] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <SkeletonAvatar size="sm" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-24 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                  </div>
                  <SkeletonBadge className="w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Member Balances & Activity Logs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Member Balance Due / Refund Overview */}
          <div className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-44 rounded" />
              </div>
              <Skeleton className="h-4 w-16 rounded" />
            </div>

            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <SkeletonAvatar size="sm" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-16 rounded ml-auto" />
                    <Skeleton className="h-2.5 w-12 rounded ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="rounded-2xl bg-white border border-[#173125]/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-32 rounded" />
              </div>
              <Skeleton className="h-4 w-14 rounded" />
            </div>

            <div className="space-y-3 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-2 w-2 rounded-full mt-2 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-48 rounded" />
                    <Skeleton className="h-2.5 w-24 rounded" />
                  </div>
                  <Skeleton className="h-2.5 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

