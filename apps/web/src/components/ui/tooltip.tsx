'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  tooltipId: string;
  delayDuration: number;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(
  undefined,
);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip compound components must be used within Tooltip');
  }
  return context;
}

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Tooltip({
  children,
  delayDuration = 150,
  open: controlledOpen,
  onOpenChange,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const tooltipId = React.useId();

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

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  return (
    <TooltipContext.Provider value={{ open, setOpen, tooltipId, delayDuration }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }, ref) => {
  const { open, setOpen, tooltipId, delayDuration } = useTooltip();
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    onMouseEnter?.(e);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    onMouseLeave?.(e);
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    onFocus?.(e);
    setOpen(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    onBlur?.(e);
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerProps = {
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      ...triggerProps,
      ...props,
    });
  }

  return (
    <button
      type="button"
      ref={ref as any}
      {...triggerProps}
      {...props}
    >
      {children}
    </button>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 4, children, ...props }, ref) => {
    const { open, tooltipId } = useTooltip();

    if (!open) return null;

    return (
      <div
        ref={ref}
        id={tooltipId}
        role="tooltip"
        className={cn(
          'absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 overflow-hidden rounded-lg border border-[#1F2E45] bg-[#0B1423] px-2.5 py-1 text-xs text-slate-200 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap pointer-events-none',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TooltipContent.displayName = 'TooltipContent';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
