'use client';

import * as React from 'react';
import { Toast, ToastItem, ToastOptions, ToastType } from './toast';

export interface ToastContextValue {
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    dismiss: (id?: string) => void;
  };
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 4;
const DEFAULT_AUTO_DISMISS_DURATION = 5000;

export interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timersRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  const toastsRef = React.useRef<ToastItem[]>([]);
  toastsRef.current = toasts;

  // پاکسازی یک تایمر مشخص
  const clearTimer = React.useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  // بستن و حذف یک یا همه اعلان‌ها
  const dismiss = React.useCallback(
    (id?: string) => {
      if (id) {
        clearTimer(id);
        const itemToDismiss = toastsRef.current.find((t) => t.id === id);
        if (itemToDismiss?.onDismiss) {
          try {
            itemToDismiss.onDismiss();
          } catch {
            // نادیده گرفتن خطای callback بستن
          }
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
      } else {
        // حذف سراسری تمام اعلان‌ها
        timersRef.current.forEach((timer) => clearTimeout(timer));
        timersRef.current.clear();
        setToasts([]);
      }
    },
    [clearTimer],
  );

  // پاکسازی کلیه تایمرها هنگام Unmount شدن Provider جهت جلوگیری از Memory Leak
  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  // متد پایه افزودن اعلان جدید
  const addToast = React.useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const trimmedMessage = message?.trim() || '';
      const currentList = toastsRef.current;

      // جلوگیری از ایجاد پیام‌های تکراری یکسان از نوع یکسان پشت سر هم (Debounce duplicate spam)
      const lastToast = currentList[currentList.length - 1];
      if (
        lastToast &&
        lastToast.type === type &&
        lastToast.message === trimmedMessage &&
        Date.now() - lastToast.createdAt < 1500
      ) {
        return lastToast.id;
      }

      const id =
        options?.id ||
        `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newItem: ToastItem = {
        ...options,
        id,
        type,
        message: trimmedMessage,
        createdAt: Date.now(),
      };

      // تعیین مدت زمان خودبسته‌شونده:
      // پیام‌های error به صورت پیش‌فرض خودبسته نمی‌شوند مگر اینکه مدت دستی تعریف شده باشد.
      // پیام‌های success, warning, info به صورت پیش‌فرض بعد از ۵۰۰۰ میلی‌ثانیه بسته می‌شوند.
      let effectiveDuration: number;
      if (options?.duration !== undefined) {
        effectiveDuration = options.duration;
      } else if (type === 'error') {
        effectiveDuration = 0; // بدون بسته‌شدن خودکار
      } else {
        effectiveDuration = DEFAULT_AUTO_DISMISS_DURATION;
      }

      // تنظیم تایمر مستقل در صورت مثبت بودن مدت
      if (effectiveDuration > 0 && effectiveDuration !== Infinity) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, effectiveDuration);
        timersRef.current.set(id, timer);
      }

      // اعمال محدودیت حداکثر ۴ اعلان همزمان (FIFO)
      setToasts((prev) => {
        let updated = [...prev, newItem];
        if (updated.length > MAX_TOASTS) {
          const removed = updated.shift();
          if (removed) {
            clearTimer(removed.id);
          }
        }
        return updated;
      });

      return id;
    },
    [clearTimer, dismiss],
  );

  const toastMethods = React.useMemo(
    () => ({
      success: (message: string, options?: ToastOptions) =>
        addToast('success', message, options),
      error: (message: string, options?: ToastOptions) =>
        addToast('error', message, options),
      warning: (message: string, options?: ToastOptions) =>
        addToast('warning', message, options),
      info: (message: string, options?: ToastOptions) =>
        addToast('info', message, options),
      dismiss,
    }),
    [addToast, dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* کانتینر اعلان‌ها: ثابت در پایین سمت چپ رابط کاربری (RTL) */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div
        className="fixed bottom-5 end-5 z-[9999] pointer-events-none flex flex-col gap-2.5 max-w-full sm:max-w-md w-full px-4 sm:px-0"
        aria-label="اعلان‌های سیستم"
      >
        {toasts.map((item) => (
          <Toast key={item.id} toast={item} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  );
};
