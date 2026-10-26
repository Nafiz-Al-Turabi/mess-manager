import React from 'react';
import { Skeleton, SkeletonAvatar, SkeletonBadge } from './Skeleton';

interface UsersSkeletonProps {
  count?: number;
}

export function UsersSkeleton({ count = 4 }: UsersSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <SkeletonAvatar size="sm" variant="dark" />
            <div className="space-y-1.5">
              <Skeleton variant="dark" className="h-4 w-32 rounded" />
              <Skeleton variant="dark" className="h-3 w-40 rounded" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SkeletonBadge variant="dark" className="w-20" />
            <SkeletonBadge variant="dark" className="w-16" />
            <div className="flex items-center gap-1.5">
              <Skeleton variant="dark" className="h-8 w-8 rounded-lg" />
              <Skeleton variant="dark" className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

