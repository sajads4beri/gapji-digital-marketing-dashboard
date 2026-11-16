'use client';

import * as React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from './modal';
import { Button } from '@/components/ui/button';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'تأیید',
  cancelText = 'انصراف',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const icon =
    variant === 'danger' ? (
      <AlertTriangle size={20} />
    ) : variant === 'warning' ? (
      <AlertCircle size={20} />
    ) : (
      <Info size={20} />
    );

  const iconBg =
    variant === 'danger'
      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
      : variant === 'warning'
      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      : 'bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">{title}</h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              عملیات نیازمند تأیید شماست
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-300 hover:text-white hover:bg-[#18263A]"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant === 'warning' ? 'primary' : variant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className={
              variant === 'danger'
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:brightness-110 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : variant === 'warning'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-gradient-to-r from-[#719BDF] to-[#3B82F6] text-white hover:brightness-110 shadow-[0_0_15px_rgba(113,155,223,0.25)]'
            }
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-xs text-slate-300 leading-relaxed bg-[#18263A]/70 p-4 rounded-xl border border-[#1F2E45]">
        {message}
      </p>
    </Modal>
  );
}
