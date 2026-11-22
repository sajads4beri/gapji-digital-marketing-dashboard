'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined,
);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs');
  }
  return context;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)} {...props} />
    </TabsContext.Provider>
  );
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onKeyDown, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);

    const container = listRef.current;
    if (!container) return;

    const tabs = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    if (tabs.length === 0) return;

    const activeIdx = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const isRtl =
      document.documentElement.dir === 'rtl' ||
      document.body.dir === 'rtl' ||
      getComputedStyle(container).direction === 'rtl';

    if (e.key === 'Home') {
      e.preventDefault();
      tabs[0]?.click();
      tabs[0]?.focus();
      return;
    }

    if (e.key === 'End') {
      e.preventDefault();
      tabs[tabs.length - 1]?.click();
      tabs[tabs.length - 1]?.focus();
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      let nextIdx = activeIdx;
      if (e.key === 'ArrowLeft') {
        nextIdx = isRtl
          ? activeIdx + 1 >= tabs.length ? 0 : activeIdx + 1
          : activeIdx - 1 < 0 ? tabs.length - 1 : activeIdx - 1;
      } else if (e.key === 'ArrowRight') {
        nextIdx = isRtl
          ? activeIdx - 1 < 0 ? tabs.length - 1 : activeIdx - 1
          : activeIdx + 1 >= tabs.length ? 0 : activeIdx + 1;
      }

      if (tabs[nextIdx]) {
        e.preventDefault();
        tabs[nextIdx].click();
        tabs[nextIdx].focus();
      }
    }
  };

  return (
    <div
      ref={(node) => {
        listRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-[#0B1423] p-1 border border-[#1F2E45] text-slate-400 gap-1',
        className,
      )}
      role="tablist"
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});
TabsList.displayName = 'TabsList';

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const { value: activeValue, onValueChange } = useTabs();
    const isActive = activeValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        onClick={() => onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-150 outline-none',
          'focus-visible:ring-2 focus-visible:ring-[#719BDF]/40',
          'disabled:pointer-events-none disabled:opacity-50',
          isActive
            ? 'bg-[#18263A] text-slate-100 shadow-sm border border-[#1F2E45]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-[#111D2E]/60',
          className,
        )}
        {...props}
      />
    );
  },
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: activeValue } = useTabs();
    const isActive = activeValue === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          'mt-3 focus-visible:outline-none animate-in fade-in duration-150',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
