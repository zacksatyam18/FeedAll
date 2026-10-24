import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  const { message, type = 'info' } = notification;

  const bgClass =
    type === 'success' ? 'bg-forest-900 border-forest-700' :
    type === 'error'   ? 'bg-rose-900 border-rose-700'   :
                         'bg-slate-900 border-slate-700';

  const icon =
    type === 'success' ? (
      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
    ) : type === 'error' ? (
      <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
    ) : (
      <div className="p-1.5 rounded-lg bg-brand-orange/20 text-brand-orange shrink-0">
        <Info className="w-5 h-5" />
      </div>
    );

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[60] max-w-sm w-full animate-slideUp"
    >
      <div className={`p-4 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 text-white ${bgClass}`}>
        <div className="flex items-start gap-3 min-w-0">
          {icon}
          <p className="text-xs font-semibold leading-relaxed break-words">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
