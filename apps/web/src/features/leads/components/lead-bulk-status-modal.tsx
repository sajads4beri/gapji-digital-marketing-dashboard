import * as React from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import type { LeadStatus } from '../types';
import { LEAD_STATUS_LABELS } from '../types';
import { LeadStatusBadge } from './lead-status-badge';

export interface LeadBulkStatusOption {
 key: string;
 label: string;
 color?: string;
 isActive?: boolean;
}

export interface LeadBulkStatusModalProps {
 isOpen: boolean;
 onClose: () => void;
 selectedCount: number;
 isLoading: boolean;
 onConfirm: (newStatus: LeadStatus) => void;
 availableStatuses?: LeadBulkStatusOption[];
}

const DEFAULT_FALLBACK_STATUSES: LeadBulkStatusOption[] = [
 { key: 'new', label: 'جدید', color: 'blue', isActive: true },
 { key: 'in_progress', label: 'تماس گرفته شد', color: 'indigo', isActive: true },
 { key: 'qualified', label: 'واجد شرایط', color: 'purple', isActive: true },
 { key: 'proposal', label: 'پیشنهاد', color: 'amber', isActive: true },
 { key: 'won', label: 'مشتری', color: 'emerald', isActive: true },
 { key: 'lost', label: 'ردشده', color: 'rose', isActive: true },
];

export function LeadBulkStatusModal({
 isOpen,
 onClose,
 selectedCount,
 isLoading,
 onConfirm,
 availableStatuses,
}: LeadBulkStatusModalProps) {
 const statusOptions = React.useMemo(() => {
  if (availableStatuses && availableStatuses.length > 0) {
   return availableStatuses.filter((s) => s.isActive !== false);
  }
  return DEFAULT_FALLBACK_STATUSES;
 }, [availableStatuses]);

 const [selectedStatus, setSelectedStatus] = React.useState<LeadStatus>(
  () => (statusOptions[0]?.key as LeadStatus) || 'in_progress'
 );

 React.useEffect(() => {
  if (statusOptions.length > 0 && !statusOptions.some((s) => s.key === selectedStatus)) {
   setSelectedStatus(statusOptions[0].key as LeadStatus);
  }
 }, [statusOptions, selectedStatus]);

 const handleConfirm = () => {
 onConfirm(selectedStatus);
 };

 return (
 <Modal
 isOpen={isOpen}
 onClose={isLoading ? () => {} : onClose}
 closeOnBackdropClick={!isLoading}
 closeOnEscape={!isLoading}
 showCloseButton={!isLoading}
 size="md"
 title={
 <div className="flex items-center gap-2.5">
 <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 ">
 <RefreshCw size={20} />
 </div>
 <div>
 <h3 className="text-base font-bold text-gray-900 ">
 تغییر وضعیت گروهی لیدها
 </h3>
 <p className="text-xs text-gray-500 ">
 {selectedCount.toLocaleString('fa-IR')} لید انتخاب شده است
 </p>
 </div>
 </div>
 }
 footer={
 <div className="flex items-center justify-end gap-2.5 w-full">
 <Button
 type="button"
 variant="outline"
 onClick={onClose}
 disabled={isLoading}
 >
 انصراف
 </Button>
 <Button
 type="button"
 variant="primary"
 onClick={handleConfirm}
 disabled={isLoading}
 >
 {isLoading ? 'در حال اعمال...' : 'تأیید و به‌روزرسانی'}
 </Button>
 </div>
 }
 >
 <div className="space-y-4 py-2" dir="rtl">
 <p className="text-xs text-gray-600 ">
 وضعیت جدید موردنظر برای انتقال تمام لیدهای انتخاب‌شده را برگزینید:
 </p>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {statusOptions.map((statusItem) => {
 const isSelected = statusItem.key === selectedStatus;
 return (
 <button
 key={statusItem.key}
 type="button"
 onClick={() => setSelectedStatus(statusItem.key as LeadStatus)}
 disabled={isLoading}
 className={`flex items-center justify-between p-3 rounded-xl border transition-all text-right ${
 isSelected
 ? 'border-indigo-500 bg-indigo-50/70 shadow-2xs '
 : 'border-gray-200 hover:bg-gray-50 '
 }`}
 >
 <LeadStatusBadge
  status={statusItem.key as LeadStatus}
  label={statusItem.label}
  color={statusItem.color}
 />

 <div
 className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
 isSelected
 ? 'border-indigo-600 bg-indigo-600 text-white'
 : 'border-gray-300 bg-white '
 }`}
 >
 {isSelected && <Check size={10} strokeWidth={3} />}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 </Modal>
 );
}
