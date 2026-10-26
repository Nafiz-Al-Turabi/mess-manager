import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'light' | 'dark';
}

export function Skeleton({
  className = '',
  variant = 'light',
  ...props
}: SkeletonProps) {
  const baseBg = variant === 'dark' ? 'bg-white/10' : 'bg-slate-200/80';
  return (
    <div
      className={`animate-pulse rounded-md ${baseBg} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = '',
  variant = 'light',
}: {
  lines?: number;
  className?: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className={`h-3.5 rounded ${
            i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonBadge({
  className = '',
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <Skeleton
      variant={variant}
      className={`h-5 w-16 rounded-full ${className}`}
    />
  );
}

export function SkeletonAvatar({
  size = 'md',
  className = '',
  variant = 'light',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  return (
    <Skeleton
      variant={variant}
      className={`rounded-full shrink-0 ${sizeClasses} ${className}`}
    />
  );
}

export function SkeletonButton({
  className = '',
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  return (
    <Skeleton
      variant={variant}
      className={`h-10 rounded-xl ${className}`}
    />
  );
}

