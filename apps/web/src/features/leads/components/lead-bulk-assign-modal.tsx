import * as React from 'react';
import { UserCheck, Users, Check } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import type { LeadActor } from '../types';

export interface LeadBulkAssignModalProps {
 isOpen: boolean;
 onClose: () => void;
 selectedCount: number;
 isLoading: boolean;
 onConfirm: (assignedTo: LeadActor) => void;
}

const AVAILABLE_REPRESENTATIVES: LeadActor[] = [
 {
 id: 'user-1',
 name: 'سارا احمدی',
 role: 'کارشناس ارشد فروش',
 },
 {
 id: 'user-2',
 name: 'علی محمدی',
 role: 'کارشناس فروش',
 },
 {
 id: 'user-3',
 name: 'مریم کاظمی',
 role: 'مدیر توسعه فروش',
 },
];

export function LeadBulkAssignModal({
 isOpen,
 onClose,
 selectedCount,
 isLoading,
 onConfirm,
}: LeadBulkAssignModalProps) {
 const [selectedRepId, setSelectedRepId] = React.useState<string>(
 AVAILABLE_REPRESENTATIVES[0].id!
 );

 const handleConfirm = () => {
 const rep = AVAILABLE_REPRESENTATIVES.find((r) => r.id === selectedRepId);
 if (rep) {
 onConfirm(rep);
 }
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
 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ">
 <UserCheck size={20} />
 </div>
 <div>
 <h3 className="text-base font-bold text-gray-900 ">
 تخصیص گروهی کارشناس پیگیری
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
 disabled={isLoading || !selectedRepId}
 >
 {isLoading ? 'در حال تخصیص...' : 'تأیید و تخصیص'}
 </Button>
 </div>
 }
 >
 <div className="space-y-4 py-2" dir="rtl">
 <p className="text-xs text-gray-600 ">
 لطفاً کارشناس پیگیری موردنظر خود را جهت واگذاری مسئولیت لیدهای انتخاب‌شده مشخص نمایید:
 </p>

 <div className="space-y-2">
 {AVAILABLE_REPRESENTATIVES.map((rep) => {
 const isSelected = rep.id === selectedRepId;
 return (
 <button
 key={rep.id}
 type="button"
 onClick={() => setSelectedRepId(rep.id!)}
 disabled={isLoading}
 className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-right ${
 isSelected
 ? 'border-blue-500 bg-blue-50/70 text-blue-950 shadow-2xs '
 : 'border-gray-200 hover:bg-gray-50 text-gray-800 '
 }`}
 >
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ">
 {rep.name?.slice(0, 2) || 'کا'}
 </div>
 <div>
 <h4 className="text-xs sm:text-sm font-bold text-gray-900 ">
 {rep.name}
 </h4>
 <p className="text-[11px] text-gray-500 ">
 {rep.role}
 </p>
 </div>
 </div>

 <div
 className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
 isSelected
 ? 'border-blue-600 bg-blue-600 text-white'
 : 'border-gray-300 bg-white '
 }`}
 >
 {isSelected && <Check size={12} strokeWidth={3} />}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 </Modal>
 );
}
