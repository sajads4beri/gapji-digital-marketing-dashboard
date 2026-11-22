'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(
  undefined,
);

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover compound components must be used within Popover');
  }
  return context;
}

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Popover({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement>(null);

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
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

const PopoverTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, onClick, ...props }, ref) => {
  const { open, setOpen, triggerRef } = usePopover();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    onClick?.(e);
    setOpen(!open);
  };

  const combinedRef = (node: HTMLElement | null) => {
    (triggerRef as any).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as any).current = node;
  };

  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: combinedRef,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
      ...props,
    });
  }

  return (
    <button
      type="button"
      ref={combinedRef as any}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = 'PopoverTrigger';

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 4, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = usePopover();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(
      null,
    );

    const updatePosition = React.useCallback(() => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentEl = contentRef.current;
      const popoverWidth = contentEl ? contentEl.offsetWidth : 180;
      const popoverHeight = contentEl ? contentEl.offsetHeight : 120;

      const isRtl =
        document.documentElement.dir === 'rtl' ||
        document.body.dir === 'rtl' ||
        getComputedStyle(document.body).direction === 'rtl';

      // 1. Calculate Vertical Position with Collision Flipping
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const fitsBelow = spaceBelow >= popoverHeight + sideOffset;
      const fitsAbove = spaceAbove >= popoverHeight + sideOffset;

      let top: number;
      if (!fitsBelow && fitsAbove) {
        // Flip to top if it doesn't fit below but fits above
        top = triggerRect.top + window.scrollY - popoverHeight - sideOffset;
      } else {
        // Default to below
        top = triggerRect.bottom + window.scrollY + sideOffset;
      }

      // 2. Calculate Horizontal Position according to RTL and Alignment
      let left: number;
      if (align === 'center') {
        left = triggerRect.left + window.scrollX + (triggerRect.width - popoverWidth) / 2;
      } else if (align === 'start') {
        // In RTL: start aligns right edge of popover with right edge of trigger
        // In LTR: start aligns left edge of popover with left edge of trigger
        left = isRtl
          ? triggerRect.right + window.scrollX - popoverWidth
          : triggerRect.left + window.scrollX;
      } else {
        // 'end':
        // In RTL: end aligns left edge of popover with left edge of trigger
        // In LTR: end aligns right edge of popover with right edge of trigger
        left = isRtl
          ? triggerRect.left + window.scrollX
          : triggerRect.right + window.scrollX - popoverWidth;
      }

      // 3. Viewport Boundary Clamping (prevent overflow outside screen)
      const minLeft = window.scrollX + 8;
      const maxLeft = window.scrollX + window.innerWidth - popoverWidth - 8;
      left = Math.max(minLeft, Math.min(left, maxLeft));

      setCoords({ top, left });
    }, [triggerRef, align, sideOffset]);

    React.useEffect(() => {
      if (!open) return;

      // Initial layout measurement
      updatePosition();

      // Recalculate after DOM paint for accurate offsetWidth/offsetHeight
      const rafId = requestAnimationFrame(updatePosition);

      // Event listeners for scroll and resize (including inside scrollable containers)
      const handleScrollOrResize = () => {
        updatePosition();
      };

      const handleClickOutside = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };

      window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
      window.addEventListener('resize', handleScrollOrResize, { passive: true });
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
        window.removeEventListener('resize', handleScrollOrResize);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, setOpen, updatePosition, triggerRef]);

    if (!open) return null;

    return createPortal(
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        style={
          coords
            ? {
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
              }
            : {
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
              }
        }
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-[#1F2E45] bg-[#111D2E] p-4 text-slate-100 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150',
          className,
        )}
        {...props}
      >
        {children}
      </div>,
      document.body,
    );
  },
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
