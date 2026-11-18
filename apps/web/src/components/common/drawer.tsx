'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockScroll, unlockScroll } from '@/lib/utils';

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

  React.useEffect(() => {
    if (isActualOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isActualOpen]);

  React.useEffect(() => {
    if (!isActualOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement;
    lockScroll();

    const focusTimer = setTimeout(() => {
      if (drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_ELEMENTS_SELECTOR,
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          drawerRef.current.focus();
        }
      }
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            FOCUSABLE_ELEMENTS_SELECTOR,
          ),
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      unlockScroll();

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
        className={`fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-250 ease-out ${
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
          onClick={(e) => e.stopPropagation()}
          className={`relative flex flex-col w-screen max-w-full ${
            sizeClasses[size]
          } bg-[#111D2E] text-slate-100 shadow-2xl border-[#1F2E45] ${
            isRight ? 'border-l' : 'border-r'
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
            <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[#1F2E45] bg-[#0E1726]/70 shrink-0">
              <div className="space-y-1 ps-1 pe-3">
                {title && (
                  <h2
                    id={titleId}
                    className="text-base sm:text-lg font-bold text-slate-100 font-display"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descId}
                    className="text-xs text-slate-400 leading-relaxed"
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
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-[#18263A] transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}

          {/* بدنه محتوا */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {children}
          </div>

          {/* فوتر کشو */}
          {footer && (
            <div className="p-4 sm:p-5 border-t border-[#1F2E45] bg-[#0B1423]/80 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
