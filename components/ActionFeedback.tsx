'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  Trash2,
  X,
} from 'lucide-react';
import { Language } from '@/lib/types';

export type ToastTone = 'success' | 'warning' | 'danger' | 'info';

export interface ToastMessage {
  id: number;
  title: string;
  subtitle?: string;
  tone: ToastTone;
}

export interface PendingConfirmAction {
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'warning';
  onConfirm: () => void;
}

interface ActionToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ActionToast({ toast, onDismiss }: ActionToastProps) {
  if (!toast) return null;

  const toneStyles: Record<
    ToastTone,
    { bg: string; border: string; iconColor: string; Icon: React.ElementType }
  > = {
    success: {
      bg: 'bg-[#173125] text-white',
      border: 'border-[#7EC151]',
      iconColor: 'text-[#7EC151]',
      Icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-[#173125] text-white',
      border: 'border-[#FED24F]',
      iconColor: 'text-[#FED24F]',
      Icon: Lock,
    },
    danger: {
      bg: 'bg-rose-950 text-white',
      border: 'border-rose-400',
      iconColor: 'text-rose-300',
      Icon: Trash2,
    },
    info: {
      bg: 'bg-[#173125] text-white',
      border: 'border-[#B2D959]',
      iconColor: 'text-[#B2D959]',
      Icon: Info,
    },
  };

  const style = toneStyles[toast.tone] || toneStyles.success;
  const IconComp = style.Icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 no-print animate-in fade-in slide-in-from-bottom-3 duration-150"
    >
      <div
        className={`rounded-2xl ${style.bg} border ${style.border} p-4 shadow-xl flex items-start justify-between gap-3`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">
            <IconComp className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold leading-snug">
              {toast.title}
            </p>
            {toast.subtitle && (
              <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
                {toast.subtitle}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 shrink-0 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface ConfirmActionModalProps {
  lang: Language;
  pending: PendingConfirmAction | null;
  onCancel: () => void;
}

export function ConfirmActionModal({
  lang,
  pending,
  onCancel,
}: ConfirmActionModalProps) {
  if (!pending) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 no-print"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#173125]">
              {pending.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {pending.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[38px] px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            {lang === 'bn' ? 'না, বাতিল করুন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              pending.onConfirm();
              onCancel();
            }}
            className="min-h-[38px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {pending.confirmLabel ||
                (lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
