'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: React.ReactNode;
 description?: React.ReactNode;
 children: React.ReactNode;
 footer?: React.ReactNode;
 size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
 showCloseButton?: boolean;
 closeOnBackdropClick?: boolean;
 closeOnEscape?: boolean;
 className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
 sm: 'max-w-sm',
 md: 'max-w-md',
 lg: 'max-w-lg',
 xl: 'max-w-xl',
 full: 'max-w-4xl',
};

const FOCUSABLE_ELEMENTS_SELECTOR =
 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
 isOpen,
 onClose,
 title,
 description,
 children,
 footer,
 size = 'md',
 showCloseButton = true,
 closeOnBackdropClick = true,
 closeOnEscape = true,
 className = '',
}: ModalProps) {
 const [mounted, setMounted] = React.useState(false);
 const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
 const modalRef = React.useRef<HTMLDivElement | null>(null);

 const titleId = React.useId();
 const descId = React.useId();

 React.useEffect(() => {
 setMounted(true);
 }, []);

 // مدیریت فوکوس، قفل اسکرول و کلید Escape
 React.useEffect(() => {
 if (!isOpen) return;

 // ۱. ذخیره عنصر دارای فوکوس قبل از باز شدن مدال
 previousActiveElementRef.current = document.activeElement as HTMLElement | null;

 // ۲. جلوگیری از اسکرول صفحه زمینه
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';

 // ۳. انتقال فوکوس به اولین عنصر قابل فوکوس در داخل مدال
 const focusTimer = setTimeout(() => {
 if (modalRef.current) {
 const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
 FOCUSABLE_ELEMENTS_SELECTOR,
 );
 if (focusableElements.length > 0) {
 focusableElements[0].focus();
 } else {
 modalRef.current.focus();
 }
 }
 }, 50);

 // ۴. مدیریت کلیدهای کیبورد (Escape و Tab Focus Trap)
 const handleKeyDown = (event: KeyboardEvent) => {
 if (event.key === 'Escape' && closeOnEscape) {
 event.preventDefault();
 onClose();
 return;
 }

 if (event.key === 'Tab') {
 if (!modalRef.current) return;

 const focusableElements = Array.from(
 modalRef.current.querySelectorAll<HTMLElement>(
 FOCUSABLE_ELEMENTS_SELECTOR,
 ),
 ).filter((el) => el.offsetParent !== null); // فقط عناصر مرئی

 if (focusableElements.length === 0) {
 event.preventDefault();
 return;
 }

 const firstElement = focusableElements[0];
 const lastElement = focusableElements[focusableElements.length - 1];

 if (event.shiftKey) {
 // حرکت به عقب با Shift + Tab
 if (document.activeElement === firstElement) {
 event.preventDefault();
 lastElement.focus();
 }
 } else {
 // حرکت به جلو با Tab
 if (document.activeElement === lastElement) {
 event.preventDefault();
 firstElement.focus();
 }
 }
 }
 };

 document.addEventListener('keydown', handleKeyDown);

 return () => {
 clearTimeout(focusTimer);
 document.removeEventListener('keydown', handleKeyDown);
 document.body.style.overflow = originalOverflow;

 // بازگرداندن فوکوس به عنصر فعال قبلی پس از بسته‌شدن
 if (
 previousActiveElementRef.current &&
 typeof previousActiveElementRef.current.focus === 'function'
 ) {
 try {
 previousActiveElementRef.current.focus();
 } catch {
 // در صورت بروز خطا در المان حذف‌شده نادیده گرفته شود
 }
 }
 };
 }, [isOpen, closeOnEscape, onClose]);

 if (!mounted || !isOpen) return null;

 const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
 if (e.target === e.currentTarget && closeOnBackdropClick) {
 onClose();
 }
 };

 const modalContent = (
 <div
 role="presentation"
 onClick={handleBackdropClick}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
 >
 <div
 ref={modalRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby={title ? titleId : undefined}
 aria-describedby={description ? descId : undefined}
 tabIndex={-1}
 className={`bg-white rounded-2xl border border-gray-200 shadow-2xl w-full my-auto text-right flex flex-col max-h-[90vh] overflow-hidden focus:outline-none animate-in zoom-in-95 duration-200 text-gray-900 ${
 sizeClasses[size]
 } ${className}`}
 >
 {/* هدر مدال */}
 {(title || showCloseButton) && (
 <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-gray-100 ">
 <div className="flex-1">
 {title && (
 <div id={titleId} className="text-sm sm:text-base font-bold text-gray-900 ">
 {title}
 </div>
 )}
 {description && (
 <div id={descId} className="text-xs text-gray-500 mt-1 leading-relaxed">
 {description}
 </div>
 )}
 </div>

 {showCloseButton && (
 <button
 type="button"
 onClick={onClose}
 aria-label="بستن"
 className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
 >
 <X size={18} />
 </button>
 )}
 </div>
 )}

 {/* محتوای بدنه مدال */}
 <div className="p-5 sm:p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed">
 {children}
 </div>

 {/* فوتر مدال */}
 {footer && (
 <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-2.5">
 {footer}
 </div>
 )}
 </div>
 </div>
 );

 return createPortal(modalContent, document.body);
}
