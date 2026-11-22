'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn, lockScroll, unlockScroll } from '@/lib/utils';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(
  undefined,
);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet compound components must be used within a Sheet');
  }
  return context;
}

interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Sheet({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

const SheetTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, onClick, ...props }, ref) => {
  const { setOpen } = useSheet();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    onClick?.(e);
    setOpen(true);
  };

  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
      ...props,
    });
  }

  return (
    <button type="button" ref={ref as any} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
SheetTrigger.displayName = 'SheetTrigger';

const SheetPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
};

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  showCloseButton?: boolean;
}

const FOCUSABLE_ELEMENTS_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  (
    {
      side = 'right',
      className,
      children,
      showCloseButton = true,
      ...props
    },
    ref,
  ) => {
    const { open, setOpen } = useSheet();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
      if (!open) return;

      previousActiveElementRef.current = document.activeElement as HTMLElement;
      lockScroll();

      const focusTimer = setTimeout(() => {
        if (contentRef.current) {
          const focusables = contentRef.current.querySelectorAll<HTMLElement>(
            FOCUSABLE_ELEMENTS_SELECTOR,
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          } else {
            contentRef.current.focus();
          }
        }
      }, 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
          return;
        }

        if (e.key === 'Tab' && contentRef.current) {
          const focusables = Array.from(
            contentRef.current.querySelectorAll<HTMLElement>(
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

        if (
          previousActiveElementRef.current &&
          typeof previousActiveElementRef.current.focus === 'function'
        ) {
          try {
            previousActiveElementRef.current.focus();
          } catch {}
        }
      };
    }, [open, setOpen]);

    if (!open) return null;

    const sideStyles: Record<string, string> = {
      right:
        'inset-y-0 right-0 w-full sm:max-w-md border-l border-[#1F2E45] animate-in slide-in-from-right duration-250',
      left:
        'inset-y-0 left-0 w-full sm:max-w-md border-r border-[#1F2E45] animate-in slide-in-from-left duration-250',
      top:
        'inset-x-0 top-0 border-b border-[#1F2E45] animate-in slide-in-from-top duration-250',
      bottom:
        'inset-x-0 bottom-0 border-t border-[#1F2E45] animate-in slide-in-from-bottom duration-250',
    };

    return (
      <SheetPortal>
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-250 ease-out animate-in fade-in"
            onClick={() => setOpen(false)}
          />
          <div
            ref={(node) => {
              contentRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              'fixed z-50 flex flex-col bg-[#111D2E] text-slate-100 shadow-2xl transition ease-in-out outline-none focus:outline-none',
              sideStyles[side],
              className,
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {children}
            {showCloseButton && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute end-4 top-4 rounded-xl p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#18263A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#719BDF]"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 p-4 sm:p-5 border-b border-[#1F2E45] bg-[#0E1726]/70 shrink-0 text-right',
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-[#1F2E45] bg-[#0B1423]/80 shrink-0',
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'text-base sm:text-lg font-bold leading-tight tracking-tight text-slate-100 font-display',
      className,
    )}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-slate-400 leading-relaxed', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { setOpen } = useSheet();
  return (
    <button
      type="button"
      ref={ref}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    />
  );
});
SheetClose.displayName = 'SheetClose';

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
};
