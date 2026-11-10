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
 ? 'bg-red-50 text-red-600 border border-red-100 '
 : variant === 'warning'
 ? 'bg-amber-50 text-amber-600 border border-amber-100 '
 : 'bg-blue-50 text-blue-600 border border-blue-100 ';

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
 <h3 className="text-sm font-bold text-gray-900 ">{title}</h3>
 <p className="text-xs text-gray-500 font-normal mt-0.5">
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
 variant === 'warning'
 ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
 : undefined
 }
 >
 {confirmText}
 </Button>
 </div>
 }
 >
 <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100 ">
 {message}
 </p>
 </Modal>
 );
}
