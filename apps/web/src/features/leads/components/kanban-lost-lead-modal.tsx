import * as React from 'react';
import { XCircle } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { organizationService } from '@/features/organization';
import type { LeadDetail } from '../types';

export interface KanbanLostLeadModalProps {
 isOpen: boolean;
 lead: LeadDetail | null;
 isLoading?: boolean;
 onConfirm: (lostReason: string) => void;
 onClose: () => void;
}

const PRESET_REASONS = [
 'محدودیت بودجه در این فصل مالی',
 'خرید یا انتخاب راهکار رقیب',
 'عدم پاسخگویی پس از تماس‌ها و پیگیری‌های متوالی',
 'عدم انطباق امکانات محصول با نیازمندی‌های مشتری',
 'عدم تناسب زمان اجرای پروژه',
];

export function KanbanLostLeadModal({
 isOpen,
 lead,
 isLoading = false,
 onConfirm,
 onClose,
}: KanbanLostLeadModalProps) {
 const [reason, setReason] = React.useState<string>('');
 const [reasonsList, setReasonsList] = React.useState<string[]>(PRESET_REASONS);
 const [error, setError] = React.useState<string | null>(null);

 React.useEffect(() => {
 setReason('');
 setError(null);
 if (isOpen) {
   organizationService
     .getListItems('lost_reasons')
     .then((items) => {
       const activeReasons = items.filter((i) => i.isActive).map((i) => i.label);
       if (activeReasons.length > 0) {
         setReasonsList(activeReasons);
       }
     })
     .catch(() => {});
 }
 }, [lead, isOpen]);

 const handleSubmit = (e?: React.FormEvent) => {
 e?.preventDefault();
 const trimmed = reason.trim();
 if (!trimmed) {
 setError('ثبت علت رد شدن یا انصراف لید الزامی است.');
 return;
 }

 onConfirm(trimmed);
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
 <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 ">
 <XCircle size={20} />
 </div>
 <div>
 <h3 className="text-base font-bold text-gray-900 ">
 ثبت انصراف و رد لید (معامله ناموفق)
 </h3>
 <p className="text-xs text-gray-500 ">
 لید: {lead?.fullName || '—'}
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
 onClick={() => handleSubmit()}
 disabled={isLoading || !reason.trim()}
 className="bg-rose-600 hover:bg-rose-700 text-white"
 >
 {isLoading ? 'در حال ثبت...' : 'تأیید و ثبت رد پیشنهاد'}
 </Button>
 </div>
 }
 >
 <form onSubmit={handleSubmit} className="space-y-4 py-2" dir="rtl">
 <p className="text-xs text-gray-600 leading-relaxed ">
 لطفاً علت اصلی رد شدن پیشنهاد یا انصراف این لید را جهت ثبت در پرونده و گزارش‌گیری تحلیل قیف فروش مشخص فرمایید:
 </p>

 {/* دکمه‌های علل متداول */}
 <div>
 <label className="block text-[11px] font-bold text-gray-500 mb-2">
 انتخاب سریع از دلایل متداول:
 </label>
 <div className="flex flex-wrap gap-1.5">
 {reasonsList.map((preset) => (
 <button
 key={preset}
 type="button"
 onClick={() => {
 setReason(preset);
 setError(null);
 }}
 disabled={isLoading}
 className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-right ${
 reason === preset
 ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold '
 : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 '
 }`}
 >
 {preset}
 </button>
 ))}
 </div>
 </div>

 {/* ورودی متن یا توضیحات تکمیلی */}
 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1.5">
 شرح علت انصراف <span className="text-rose-500">*</span>
 </label>
 <textarea
 rows={3}
 value={reason}
 onChange={(e) => {
 setReason(e.target.value);
 if (e.target.value.trim()) {
 setError(null);
 }
 }}
 placeholder="دلیل یا توضیحات مذاکره را یادداشت نمایید..."
 disabled={isLoading}
 className={`w-full bg-gray-50 border rounded-xl p-3 text-xs leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
 error
 ? 'border-rose-400 focus:ring-rose-500'
 : 'border-gray-300 focus:ring-rose-500'
 }`}
 />
 {error && (
 <p className="mt-1 text-xs text-rose-600 font-medium">
 {error}
 </p>
 )}
 </div>
 </form>
 </Modal>
 );
}
