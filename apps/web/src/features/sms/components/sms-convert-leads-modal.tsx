'use client';

import React, { useState, useEffect } from 'react';
import { smsApi } from '../sms.api';
import { ConvertRepliesPreviewResponse } from '../types';
import { X, UserPlus, AlertCircle, CheckCircle2, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SmsConvertLeadsModalProps {
  smsId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SmsConvertLeadsModal({
  smsId,
  isOpen,
  onClose,
  onSuccess,
}: SmsConvertLeadsModalProps) {
  const [step, setStep] = useState<'preview' | 'success'>('preview');
  const [preview, setPreview] = useState<ConvertRepliesPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('preview');
      setError(null);
      setIsLoading(true);

      smsApi
        .convertRepliesPreview(smsId)
        .then((res) => {
          setPreview(res);
        })
        .catch((err) => {
          setError(err?.response?.data?.message || 'خطا در بارگذاری پیش‌نمایش پاسخ‌دهندگان');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [smsId, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setError(null);
      const res = await smsApi.convertRepliesConfirm(smsId);
      setCreatedCount(res.createdCount);
      setStep('success');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در تبدیل پاسخ‌دهندگان به لید');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-xl shadow-2xl border border-[#1F2E45] flex flex-col max-h-[90vh] overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ساخت لید از پاسخ‌دهندگان پیامک</h2>
              <p className="text-xs text-slate-400">اکشن ۲ سند محصول ص ۱۷: پیش‌نمایش و تایید تراکنشی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 me-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'preview' && (
            <>
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#719BDF]"></div>
                  <p className="mt-2 text-xs text-slate-400">در حال بررسی پاسخ‌دهندگان و لیدهای تکراری...</p>
                </div>
              ) : preview?.totalRespondents === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                  <p className="text-sm font-medium text-white">هیچ پاسخ جدیدی ثبت نشده است</p>
                  <p className="text-xs text-slate-500 mt-1">
                    تنها شماره‌هایی که پاسخ پیامکی ارسال کرده و هنوز به لید تبدیل نشده‌اند قابل تبدیل هستند.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#18263A] p-3.5 rounded-xl border border-[#1F2E45] text-center">
                      <div className="text-xs text-slate-400">کل پاسخ‌دهندگان</div>
                      <div className="text-lg font-bold tabular-nums text-white mt-1">
                        {preview?.totalRespondents.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-center">
                      <div className="text-xs text-emerald-400 font-medium">واجد شرایط (لید جدید)</div>
                      <div className="text-lg font-bold tabular-nums text-emerald-400 mt-1">
                        {preview?.eligibleCount.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 text-center">
                      <div className="text-xs text-amber-300 font-medium">تکراری در سیستم</div>
                      <div className="text-lg font-bold tabular-nums text-amber-300 mt-1">
                        {preview?.duplicateCount.toLocaleString('fa-IR')}
                      </div>
                    </div>
                  </div>

                  {preview && preview.duplicateCount > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>توجه:</strong> شماره‌های تکراری که قبلاً در صندوق لیدها ثبت شده‌اند، مجدداً ایجاد نخواهند شد تا از افزونگی داده‌ها جلوگیری شود.
                      </div>
                    </div>
                  )}

                  {/* Respondents List Table */}
                  <div className="border border-[#1F2E45] rounded-xl overflow-hidden bg-[#0B1423]/50">
                    <div className="bg-[#18263A] px-4 py-2.5 border-b border-[#1F2E45] text-xs font-semibold text-slate-300">
                      فهرست پاسخ‌دهندگان
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-[#1F2E45]/40 text-xs">
                      {preview?.respondents.map((r) => (
                        <div key={r.id} className="p-3 flex items-center justify-between hover:bg-[#18263A]/40 transition-colors">
                          <div>
                            <div className="font-mono font-medium text-slate-200">{r.mobileMasked}</div>
                            {r.replyText && (
                              <div className="text-slate-400 text-[11px] mt-0.5 max-w-xs truncate">
                                «{r.replyText}»
                              </div>
                            )}
                          </div>
                          <div>
                            {r.isDuplicate ? (
                              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px]">
                                تکراری: {r.existingLeadName || 'لید موجود'}
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                آماده تبدیل
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1F2E45]">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isConfirming}
                      className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
                    >
                      انصراف
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={isConfirming || preview?.eligibleCount === 0}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
                    >
                      {isConfirming
                        ? 'در حال ساخت لیدها...'
                        : `تایید و ایجاد ${preview?.eligibleCount.toLocaleString('fa-IR')} لید جدید`}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {step === 'success' && (
            <div className="p-4 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">لیدها با موفقیت ایجاد شدند</h3>
                <p className="text-xs text-slate-300 mt-1">
                  تعداد <strong className="tabular-nums text-emerald-400">{createdCount.toLocaleString('fa-IR')}</strong> لید جدید با مبدأ پیامک و انتساب به کمپین ساخته شد و در صندوق لیدها قابل پیگیری است.
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Button onClick={onClose} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs">
                  بستن پنجره
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
