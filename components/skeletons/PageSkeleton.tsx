import React from 'react';
import { Skeleton, SkeletonAvatar } from './Skeleton';
import { HomeSkeleton } from './HomeSkeleton';
import { MealsSkeleton } from './MealsSkeleton';
import { ExpensesSkeleton } from './ExpensesSkeleton';
import { DepositsSkeleton } from './DepositsSkeleton';
import { ReportsSkeleton } from './ReportsSkeleton';

interface PageSkeletonProps {
  lang?: 'bn' | 'en';
  tab?: 'home' | 'meals' | 'expenses' | 'deposits' | 'reports';
  showHeader?: boolean;
}

export function PageSkeleton({
  lang = 'bn',
  tab = 'home',
  showHeader = true,
}: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-[#F6F8F5] text-slate-800 flex flex-col font-sans">
      {showHeader && (
        <header className="sticky top-0 z-30 bg-[#173125] text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Logo & App title */}
            <div className="flex items-center gap-3">
              <Skeleton variant="dark" className="w-10 h-10 rounded-2xl" />
              <div className="space-y-1">
                <Skeleton variant="dark" className="h-4 w-28 rounded" />
                <Skeleton variant="dark" className="h-2.5 w-16 rounded" />
              </div>
            </div>

            {/* Center Desktop Navigation Tabs Placeholder */}
            <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              <Skeleton variant="dark" className="h-9 w-20 rounded-xl" />
              <Skeleton variant="dark" className="h-9 w-20 rounded-xl" />
              <Skeleton variant="dark" className="h-9 w-20 rounded-xl" />
              <Skeleton variant="dark" className="h-9 w-20 rounded-xl" />
              <Skeleton variant="dark" className="h-9 w-20 rounded-xl" />
            </div>

            {/* Right toolbar */}
            <div className="flex items-center gap-2">
              <Skeleton variant="dark" className="h-9 w-28 rounded-xl hidden sm:block" />
              <SkeletonAvatar variant="dark" size="sm" />
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-4 sm:pt-6 pb-24 lg:pb-12 flex-1">
        {tab === 'home' && <HomeSkeleton lang={lang} />}
        {tab === 'meals' && <MealsSkeleton lang={lang} />}
        {tab === 'expenses' && <ExpensesSkeleton lang={lang} />}
        {tab === 'deposits' && <DepositsSkeleton lang={lang} />}
        {tab === 'reports' && <ReportsSkeleton lang={lang} />}
      </main>

      {/* Mobile Fixed Bottom Navigation Skeleton */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#173125]/95 backdrop-blur-lg border-t border-[#438A53]/30 grid grid-cols-5 items-center h-16 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pb-safe">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center justify-center py-1 space-y-1">
            <Skeleton variant="dark" className="w-5 h-5 rounded-md" />
            <Skeleton variant="dark" className="w-8 h-2 rounded" />
          </div>
        ))}
      </nav>
    </div>
  );
}

