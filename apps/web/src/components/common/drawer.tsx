'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface DrawerProps {
 open?: boolean;
 isOpen?: boolean;
 onClose: () => void;
 title?: React.ReactNode;
 description?: React.ReactNode;
 children: React.ReactNode;
 footer?: React.ReactNode;
 size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
 placement?: 'right' | 'left';
 showCloseButton?: boolean;
 closeOnBackdropClick?: boolean;
 closeOnEscape?: boolean;
 className?: string;
}

const sizeClasses: Record<NonNullable<DrawerProps['size']>, string> = {
 sm: 'sm:max-w-xs',
 md: 'sm:max-w-md',
 lg: 'sm:max-w-lg',
 xl: 'sm:max-w-2xl',
 full: 'sm:max-w-full',
};

const FOCUSABLE_ELEMENTS_SELECTOR =
 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
 open,
 isOpen: legacyIsOpen,
 onClose,
 title,
 description,
 children,
 footer,
 size = 'md',
 placement = 'right',
 showCloseButton = true,
 closeOnBackdropClick = true,
 closeOnEscape = true,
 className = '',
}: DrawerProps) {
 const isActualOpen = open ?? legacyIsOpen ?? false;

 const [mounted, setMounted] = React.useState(false);
 const [isRendered, setIsRendered] = React.useState(isActualOpen);
 const [isVisible, setIsVisible] = React.useState(false);

 const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
 const drawerRef = React.useRef<HTMLDivElement | null>(null);

 const titleId = React.useId();
 const descId = React.useId();

 React.useEffect(() => {
 setMounted(true);
 }, []);

 // مدیریت انیمیشن باز و بسته شدن روان
 React.useEffect(() => {
 if (isActualOpen) {
 setIsRendered(true);
 const timer = setTimeout(() => {
 setIsVisible(true);
 }, 10);
 return () => clearTimeout(timer);
 } else {
 setIsVisible(false);
 const timer = setTimeout(() => {
 setIsRendered(false);
 }, 250);
 return () => clearTimeout(timer);
 }
 }, [isActualOpen]);

 // مدیریت فوکوس، قفل اسکرول بدنه و کلید Escape
 React.useEffect(() => {
 if (!isActualOpen) return;

 // ۱. ذخیره المنتی که قبل از باز شدن Drawer فوکوس داشته
 previousActiveElementRef.current = document.activeElement as HTMLElement | null;

 // ۲. جلوگیری از اسکرول صفحه اصلی
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';

 // ۳. فوکوس به اولین عنصر قابل تعامل داخل Drawer
 const focusTimer = setTimeout(() => {
 if (drawerRef.current) {
 const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
 FOCUSABLE_ELEMENTS_SELECTOR
 );
 if (focusableElements.length > 0) {
 focusableElements[0].focus();
 } else {
 drawerRef.current.focus();
 }
 }
 }, 60);

 // ۴. مدیریت کلیدهای کیبورد (Escape و Tab Focus Trap)
 const handleKeyDown = (event: KeyboardEvent) => {
 if (event.key === 'Escape' && closeOnEscape) {
 event.preventDefault();
 onClose();
 return;
 }

 if (event.key === 'Tab') {
 if (!drawerRef.current) return;

 const focusableElements = Array.from(
 drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
 ).filter((el) => el.offsetParent !== null);

 if (focusableElements.length === 0) {
 event.preventDefault();
 return;
 }

 const firstElement = focusableElements[0];
 const lastElement = focusableElements[focusableElements.length - 1];

 if (event.shiftKey) {
 if (document.activeElement === firstElement) {
 event.preventDefault();
 lastElement.focus();
 }
 } else {
 if (document.activeElement === lastElement) {
 event.preventDefault();
 firstElement.focus();
 }
 }
 }
 };

 window.addEventListener('keydown', handleKeyDown);

 return () => {
 window.removeEventListener('keydown', handleKeyDown);
 clearTimeout(focusTimer);
 document.body.style.overflow = originalOverflow;

 // بازگرداندن فوکوس به المنت قبلی
 if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
 previousActiveElementRef.current.focus();
 }
 };
 }, [isActualOpen, closeOnEscape, onClose]);

 if (!mounted || !isRendered) return null;

 const isRight = placement === 'right';

 const drawerContent = (
 <div
 className="fixed inset-0 z-50 overflow-hidden"
 dir="rtl"
 >
 {/* Overlay پس‌زمینه */}
 <div
 className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-250 ease-out ${
 isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
 }`}
 aria-hidden="true"
 onClick={closeOnBackdropClick ? onClose : undefined}
 />

 {/* کانتینر پنل Drawer */}
 <div
 className={`fixed inset-y-0 flex max-w-full ${
 isRight ? 'right-0' : 'left-0'
 }`}
 >
 <div
 ref={drawerRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby={title ? titleId : undefined}
 aria-describedby={description ? descId : undefined}
 tabIndex={-1}
 onClick={(e) => e.stopPropagation()} // جلوگیری از بسته شدن با کلیک داخل پنل
 className={`relative flex flex-col w-screen max-w-full ${
 sizeClasses[size]
 } bg-white text-gray-900 shadow-2xl border-gray-200 ${
 isRight ? 'border-r' : 'border-l'
 } transform transition-transform duration-250 ease-out focus:outline-none ${
 isRight
 ? isVisible
 ? 'translate-x-0'
 : 'translate-x-full'
 : isVisible
 ? 'translate-x-0'
 : '-translate-x-full'
 } ${className}`}
 >
 {/* هدر کشو */}
 {(title || description || showCloseButton) && (
 <div className="flex items-start justify-between p-4 sm:p-5 border-b border-gray-200 shrink-0">
 <div className="space-y-1 pr-1 pl-3">
 {title && (
 <h2
 id={titleId}
 className="text-lg font-bold text-gray-900 "
 >
 {title}
 </h2>
 )}
 {description && (
 <p
 id={descId}
 className="text-xs text-gray-500 leading-relaxed"
 >
 {description}
 </p>
 )}
 </div>

 {showCloseButton && (
 <button
 type="button"
 onClick={onClose}
 aria-label="بستن"
 className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
 >
 <X className="w-5 h-5" />
 </button>
 )}
 </div>
 )}

 {/* محتوای بدنه (اسکرول‌پذیر عمودی) */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
 {children}
 </div>

 {/* فوتر اختیاری کشو */}
 {footer && (
 <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 shrink-0 flex items-center justify-end gap-2">
 {footer}
 </div>
 )}
 </div>
 </div>
 </div>
 );

 return createPortal(drawerContent, document.body);
}
