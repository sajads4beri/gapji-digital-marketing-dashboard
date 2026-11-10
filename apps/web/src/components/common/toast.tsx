import * as React from 'react';
import {
 CheckCircle2,
 AlertCircle,
 AlertTriangle,
 Info,
 X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
 label: string;
 onClick: () => void;
}

export interface ToastOptions {
 id?: string;
 title?: string;
 description?: string;
 duration?: number; // In ms. 0 or Infinity = persistent (no auto-dismiss)
 action?: ToastAction;
 onDismiss?: () => void;
}

export interface ToastItem extends ToastOptions {
 id: string;
 type: ToastType;
 message: string;
 createdAt: number;
}

export interface ToastProps {
 toast: ToastItem;
 onDismiss: (id: string) => void;
}

const typeConfig: Record<
 ToastType,
 {
 containerClasses: string;
 icon: React.ReactNode;
 titleColor: string;
 textColor: string;
 }
> = {
 success: {
 containerClasses: 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-emerald-900/5',
 icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />,
 titleColor: 'text-emerald-900 ',
 textColor: 'text-emerald-800 ',
 },
 error: {
 containerClasses: 'bg-red-50/95 border-red-200 text-red-950 shadow-red-900/5',
 icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />,
 titleColor: 'text-red-900 ',
 textColor: 'text-red-800 ',
 },
 warning: {
 containerClasses: 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-amber-900/5',
 icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />,
 titleColor: 'text-amber-900 ',
 textColor: 'text-amber-800 ',
 },
 info: {
 containerClasses: 'bg-blue-50/95 border-blue-200 text-blue-950 shadow-blue-900/5',
 icon: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />,
 titleColor: 'text-blue-900 ',
 textColor: 'text-blue-800 ',
 },
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
 const config = typeConfig[toast.type];
 const isError = toast.type === 'error';

 return (
 <div
 role={isError ? 'alert' : 'status'}
 aria-live={isError ? 'assertive' : 'polite'}
 className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-lg backdrop-blur-xs transition-all duration-200 text-right w-full sm:w-[380px] max-w-full ${config.containerClasses}`}
 style={{
 animation: 'toast-enter 200ms cubic-bezier(0.16, 1, 0.3, 1)',
 }}
 >
 {/* آیکون وضعیت */}
 {config.icon}

 {/* متن پیام، عنوان، توضیحات و اکشن */}
 <div className="flex-1 min-w-0">
 {toast.title && (
 <h4 className={`text-xs sm:text-sm font-bold leading-tight ${config.titleColor}`}>
 {toast.title}
 </h4>
 )}
 <p
 className={`text-xs leading-relaxed ${
 toast.title ? `mt-1 ${config.textColor}` : `font-bold ${config.titleColor}`
 }`}
 >
 {toast.message}
 </p>

 {toast.description && (
 <p className="text-[11px] text-gray-600 mt-1 leading-normal">
 {toast.description}
 </p>
 )}

 {toast.action && (
 <div className="mt-2.5">
 <button
 type="button"
 onClick={() => {
 toast.action?.onClick();
 onDismiss(toast.id);
 }}
 className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-lg bg-white/80 hover:bg-white text-gray-800 border border-gray-200 shadow-2xs transition-colors"
 >
 {toast.action.label}
 </button>
 </div>
 )}
 </div>

 {/* دکمه بستن دستی */}
 <button
 type="button"
 onClick={() => onDismiss(toast.id)}
 aria-label="بستن اعلان"
 className="shrink-0 p-1 -mt-0.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
 >
 <X size={15} />
 </button>
 </div>
 );
};
