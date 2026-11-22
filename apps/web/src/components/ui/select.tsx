'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// 1. Types & Context for shadcn Compound API
// ==========================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  selectedLabel: string;
  setSelectedLabel: (label: string) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
  undefined,
);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select compound components must be used within a Select provider');
  }
  return context;
}

// ==========================================
// 2. Select Root Component
// ==========================================

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  // Legacy / Form Compatibility Props
  id?: string;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options?: SelectOption[];
  containerClassName?: string;
  className?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
}

export function Select({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  children,
  // Form compatibility props
  id: customId,
  label,
  error,
  helperText,
  placeholder,
  options,
  containerClassName,
  className,
  required = false,
  onChange,
  name,
  ...restProps
}: SelectProps) {
  // If `options` is supplied or an explicit native onChange handler is provided,
  // render the Form Select wrapper for backward compatibility with existing form code.
  const isFormMode = options !== undefined || (onChange !== undefined && !onValueChange);

  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const isControlledValue = controlledValue !== undefined;
  const value = isControlledValue ? controlledValue : uncontrolledValue;

  const isControlledOpen = controlledOpen !== undefined;
  const open = isControlledOpen ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlledOpen) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlledOpen, onOpenChange],
  );

  const handleValueChange = React.useCallback(
    (nextVal: string) => {
      if (!isControlledValue) {
        setUncontrolledValue(nextVal);
      }
      onValueChange?.(nextVal);
    },
    [isControlledValue, onValueChange],
  );

  const generatedId = React.useId();
  const selectId = customId || generatedId;

  if (isFormMode) {
    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-300 text-start select-none"
          >
            {label}
            {required && <span className="text-[#D66B73] ms-1">*</span>}
          </label>
        )}

        <div className="relative w-full">
          <select
            id={selectId}
            name={name}
            required={required}
            disabled={disabled}
            value={value}
            onChange={onChange}
            className={cn(
              'w-full text-start bg-[#111D2E] border rounded-xl text-xs text-slate-100 transition-colors appearance-none focus:outline-none focus:ring-1 disabled:bg-[#0B1423] disabled:text-slate-600 disabled:cursor-not-allowed ps-3.5 pe-9 py-2.5',
              error
                ? 'border-[#D66B73] focus:border-[#D66B73] focus:ring-[#D66B73]/20'
                : 'border-[#1F2E45] focus:border-[#719BDF] focus:ring-[#719BDF]/20',
              className,
            )}
            {...(restProps as any)}
          >
            {placeholder && (
              <option value="" disabled className="bg-[#111D2E] text-slate-500">
                {placeholder}
              </option>
            )}

            {options?.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#111D2E] text-slate-100"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-slate-400 shrink-0">
            <ChevronDown size={15} />
          </div>
        </div>

        {error ? (
          <p className="text-xs text-[#D66B73] text-start leading-relaxed animate-in fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-400 text-start leading-relaxed">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        triggerRef,
        selectedLabel,
        setSelectedLabel,
        disabled,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

// ==========================================
// 3. SelectTrigger
// ==========================================

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, children, ...props }, ref) => {
  const { open, setOpen, triggerRef, disabled } = useSelectContext();

  const handleRef = (node: HTMLButtonElement | null) => {
    (triggerRef as any).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as any).current = node;
  };

  return (
    <button
      type="button"
      ref={handleRef}
      disabled={disabled}
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => !disabled && setOpen(!open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-xl border border-[#1F2E45] bg-[#111D2E] px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#719BDF]/30 focus:border-[#719BDF] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        size={15}
        className={cn(
          'text-slate-400 shrink-0 transition-transform duration-200 ms-2',
          open && 'rotate-180 text-[#719BDF]',
        )}
      />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

// ==========================================
// 4. SelectValue
// ==========================================

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function SelectValue({ placeholder = 'انتخاب کنید...', className }: SelectValueProps) {
  const { selectedLabel, value } = useSelectContext();
  const display = selectedLabel || value;

  return (
    <span
      className={cn(
        'block truncate text-right',
        !display && 'text-slate-500',
        className,
      )}
    >
      {display || placeholder}
    </span>
  );
}

// ==========================================
// 5. SelectContent
// ==========================================

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'popper' | 'item-aligned';
}

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps
>(({ className, children, position = 'popper', ...props }, ref) => {
  const { open, setOpen, triggerRef } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const contentHeight = contentRef.current?.offsetHeight || 220;

    let top = rect.bottom + 6;
    if (spaceBelow < contentHeight && spaceAbove > spaceBelow) {
      top = Math.max(10, rect.top - contentHeight - 6);
    }

    setCoords({
      top: Math.round(top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
    });
  }, [triggerRef]);

  React.useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, [open, updatePosition]);

  // Click outside and Escape key dismissal
  React.useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        contentRef.current &&
        !contentRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={(node) => {
        contentRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as any).current = node;
      }}
      role="listbox"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
      }}
      className={cn(
        'z-50 max-h-64 overflow-y-auto rounded-2xl border border-[#1F2E45] bg-[#111D2E] p-1.5 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none scrollbar-thin text-right',
        className,
      )}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
});
SelectContent.displayName = 'SelectContent';

// ==========================================
// 6. SelectItem
// ==========================================

export interface SelectItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value: itemValue, disabled = false, ...props }, ref) => {
    const { value, onValueChange, setOpen, setSelectedLabel } = useSelectContext();
    const isSelected = value === itemValue;

    // Register label if currently selected
    React.useEffect(() => {
      if (isSelected && typeof children === 'string') {
        setSelectedLabel(children);
      }
    }, [isSelected, children, setSelectedLabel]);

    const handleSelect = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onValueChange?.(itemValue);
      if (typeof children === 'string') {
        setSelectedLabel(children);
      }
      setOpen(false);
      props.onClick?.(e);
    };

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        onClick={handleSelect}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl py-2 px-3 text-xs outline-none transition-colors text-right font-medium',
          isSelected
            ? 'bg-[#18263A] text-[#719BDF] font-bold'
            : 'text-slate-200 hover:bg-[#18263A]/80 hover:text-slate-100',
          disabled && 'pointer-events-none opacity-40',
          className,
        )}
        {...props}
      >
        <span className="truncate">{children}</span>
        {isSelected && (
          <Check size={14} className="text-[#719BDF] shrink-0 ms-2" />
        )}
      </div>
    );
  },
);
SelectItem.displayName = 'SelectItem';

// ==========================================
// 7. SelectGroup, SelectLabel, SelectSeparator
// ==========================================

export function SelectGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-1', className)} {...props}>
      {children}
    </div>
  );
}

export function SelectLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[11px] font-bold text-slate-400 select-none text-right',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('my-1 h-px bg-[#1F2E45]/80 -mx-1', className)}
      {...props}
    />
  );
}
