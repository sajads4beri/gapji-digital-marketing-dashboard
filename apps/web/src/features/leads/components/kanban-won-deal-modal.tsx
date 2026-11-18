import * as React from 'react';
import { Trophy, DollarSign } from 'lucide-react';
import { Modal } from '@/components/common/modal';
import { Button } from '@/components/ui/button';
import { normalizeToEnglishDigits, formatMoneyDisplay } from '@/components/ui/money-input';
import { toPersianDigits } from '@/components/common/timeline';
import type { LeadDetail } from '../types';

export interface KanbanWonDealModalProps {
 isOpen: boolean;
 lead: LeadDetail | null;
 isLoading?: boolean;
 onConfirm: (dealValue: number) => void;
 onClose: () => void;
}

export function KanbanWonDealModal({
 isOpen,
 lead,
 isLoading = false,
 onConfirm,
 onClose,
}: KanbanWonDealModalProps) {
 const [inputValue, setInputValue] = React.useState<string>('');
 const [error, setError] = React.useState<string | null>(null);

 // پیش‌مقداردهی با ارزش تخمینی قبلی لید در صورت وجود
 React.useEffect(() => {
 if (lead?.estimatedValue) {
 setInputValue(lead.estimatedValue.toString());
 } else {
 setInputValue('');
 }
 setError(null);
 }, [lead, isOpen]);

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const raw = e.target.value;
 const clean = normalizeToEnglishDigits(raw);
 setInputValue(clean);
 if (clean) {
 setError(null);
 }
 };

 const handleSubmit = (e?: React.FormEvent) => {
 e?.preventDefault();
 if (!inputValue || inputValue.trim() === '') {
 setError('ورود مبلغ نهایی معامله الزامی است.');
 return;
 }

 const num = parseInt(inputValue, 10);
 if (Number.isNaN(num) || num < 0) {
 setError('مبلغ معامله باید یک عدد صحیح نامنفی معتبر باشد.');
 return;
 }

 onConfirm(num);
 };

 const numValue = inputValue ? parseInt(inputValue, 10) : 0;
 const displayFormatted = inputValue ? formatMoneyDisplay(inputValue) : '';

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
 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 ">
 <Trophy size={20} />
 </div>
 <div>
 <h3 className="text-base font-bold text-gray-900 ">
 ثبت معامله موفق (تبدیل به مشتری)
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
 disabled={isLoading || !inputValue}
 >
 {isLoading ? 'در حال ثبت...' : 'تأیید و ثبت معامله'}
 </Button>
 </div>
 }
 >
 <form onSubmit={handleSubmit} className="space-y-4 py-2" dir="rtl">
 <p className="text-xs text-gray-600 leading-relaxed ">
 برای انتقال این لید به مرحله نهایی <strong>مشتری (خرید موفق)</strong>،
 لطفاً ارزش نهایی قرارداد یا معامله بسته شده را به تومان وارد نمایید:
 </p>

 <div>
 <label className="block text-xs font-bold text-gray-700 mb-1.5">
 ارزش نهایی معامله (تومان) <span className="text-rose-500">*</span>
 </label>
 <div className="relative">
 <input
 type="text"
 inputMode="numeric"
 value={displayFormatted}
 onChange={handleInputChange}
 placeholder="مثال: ۴۵٬۰۰۰٬۰۰۰"
 disabled={isLoading}
 dir="ltr"
 autoFocus
 className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
 error
 ? 'border-rose-400 focus:ring-rose-500'
 : 'border-gray-300 focus:ring-emerald-500'
 }`}
 />
 </div>

 {displayFormatted && !error && (
 <p className="mt-1.5 text-xs text-emerald-600 font-medium">
 معادل: {displayFormatted} تومان
 </p>
 )}

 {error && (
 <p className="mt-1.5 text-xs text-rose-600 font-medium">
 {error}
 </p>
 )}
 </div>
 </form>
 </Modal>
 );
}
