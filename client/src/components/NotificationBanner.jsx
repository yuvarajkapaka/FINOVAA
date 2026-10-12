import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function NotificationBanner({ notification, onDismiss }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl border shadow-xl flex items-start space-x-3 bg-canvas-white ${
        isSuccess 
          ? 'border-pos/40 text-ink' 
          : 'border-neg/40 text-ink'
      }`}>
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-pos flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-neg flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 pr-2">
          <div className="text-xs font-bold text-ink mb-0.5 font-serif">
            {isSuccess ? 'Transaction Completed' : 'Transaction Notice'}
          </div>
          <div className="text-xs text-ink-muted leading-relaxed">
            {notification.message}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-ink-muted hover:text-ink p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
