'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  WebinarDetail,
  WebinarAttendeeItem,
  ImportAttendeesResponse,
  ConvertAttendeesPreviewResponse,
} from '../types';
import { webinarsApi } from '../webinars.api';
import { WebinarFunnelCard } from './webinar-funnel-card';
import {
  Upload,
  UserPlus,
  CheckCircle2,
  Users,
  AlertCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WebinarAttendeesTabProps {
  webinar: WebinarDetail;
  onRefresh: () => void;
}

export function WebinarAttendeesTab({ webinar, onRefresh }: WebinarAttendeesTabProps) {
  const [attendees, setAttendees] = useState<WebinarAttendeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [conversionFilter, setConversionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Fetch attendees list
  const fetchAttendees = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await webinarsApi.getAttendees(webinar.id, {
        attendanceStatus: attendanceFilter,
        conversionStatus: conversionFilter,
        search: searchTerm || undefined,
        page,
        limit: 15,
      });
      setAttendees(res.items);
      setTotalPages(res.totalPages);
    } catch (err) {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  }, [webinar.id, attendanceFilter, conversionFilter, searchTerm, page]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  return (
    <div className="space-y-6">
      {/* Funnel Card (ص ۱۸) */}
      <WebinarFunnelCard funnel={webinar.funnel} />

      {/* Toolbar & Action Buttons */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md p-4 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={attendanceFilter}
            onChange={(e) => {
              setAttendanceFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white focus:outline-none focus:border-[#719BDF]"
          >
            <option value="all">همه وضعیت‌های حضور</option>
            <option value="attended">فقط حاضران</option>
            <option value="absent">غایبان</option>
          </select>

          <select
            value={conversionFilter}
            onChange={(e) => {
              setConversionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white focus:outline-none focus:border-[#719BDF]"
          >
            <option value="all">همه وضعیت‌های لید</option>
            <option value="converted">تبدیل‌شده به لید</option>
            <option value="not_converted">تبدیل‌نشده</option>
          </select>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="جستجوی نام یا شماره..."
            className="h-9 px-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#719BDF] w-48"
          />
        </div>

        {/* Action Buttons: Import & Convert to Leads */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
          >
            <Upload className="w-4 h-4 me-1.5 text-[#719BDF]" />
            Import ثبت‌نام/حضور
          </Button>

          <Button
            size="sm"
            onClick={() => setIsConvertModalOpen(true)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30 font-medium"
          >
            <UserPlus className="w-4 h-4 me-1.5" />
            تبدیل حاضران به لید
          </Button>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#719BDF]"></div>
            <p className="mt-2 text-xs text-slate-400">در حال بارگذاری شرکت‌کنندگان...</p>
          </div>
        ) : attendees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            هیچ شرکت‌کننده‌ای با فیلترهای انتخابی یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0B1423]/60 border-b border-[#1F2E45] text-slate-400 font-medium">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">نام و نام خانوادگی</th>
                  <th className="py-3.5 px-4 font-semibold">شماره تلفن (ماسک‌شده)</th>
                  <th className="py-3.5 px-4 font-semibold">ایمیل</th>
                  <th className="py-3.5 px-4 text-center font-semibold">وضعیت حضور</th>
                  <th className="py-3.5 px-4 font-semibold">زمان ورود</th>
                  <th className="py-3.5 px-4 text-center font-semibold">وضعیت لید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2E45]/40 text-slate-300">
                {attendees.map((a) => {
                  const joinDate = a.joinedAt
                    ? new Date(a.joinedAt).toLocaleString('fa-IR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '-';

                  return (
                    <tr key={a.id} className="hover:bg-[#18263A]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">{a.fullName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-200 whitespace-nowrap">
                        {a.mobileMasked}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">{a.email || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        {a.attended ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 me-1" />
                            حاضر
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-[#18263A] text-slate-400 border-[#1F2E45]">
                            غایب
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap tabular-nums">
                        {joinDate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {a.isConvertedToLead ? (
                          <Badge className="bg-[#719BDF]/15 text-[#719BDF] border-[#719BDF]/30">
                            لید ثبت‌شده
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#1F2E45] flex items-center justify-between text-xs text-slate-400">
            <div className="tabular-nums">
              صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 border border-[#1F2E45] bg-[#18263A] rounded-lg hover:bg-[#1F2E45] hover:text-white disabled:opacity-40 transition-colors"
              >
                قبلی
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1 border border-[#1F2E45] bg-[#18263A] rounded-lg hover:bg-[#1F2E45] hover:text-white disabled:opacity-40 transition-colors"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <WebinarImportModal
          webinarId={webinar.id}
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            fetchAttendees();
            onRefresh();
          }}
        />
      )}

      {/* Convert Leads Modal */}
      {isConvertModalOpen && (
        <WebinarConvertLeadsModal
          webinarId={webinar.id}
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onSuccess={() => {
            fetchAttendees();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Subcomponent: Webinar Import Modal
function WebinarImportModal({
  webinarId,
  isOpen,
  onClose,
  onSuccess,
}: {
  webinarId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [csvContent, setCsvContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportAttendeesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleCsv = `نام و نام خانوادگی,شماره تلفن,ایمیل,وضعیت حضور
سارا حسینی,09121112233,sara@test.com,حاضر
علی راد,09122223344,ali@test.com,غایب
مهسا کریمی,09123334455,mahsa@test.com,حاضر`;

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('لطفاً محتوای فایل یا ردیف‌ها را وارد فرمایید.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const res = await webinarsApi.importAttendees(webinarId, { csvContent: csvContent.trim() });
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در ایمپورت شرکت‌کنندگان');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-lg shadow-2xl border border-[#1F2E45] flex flex-col max-h-[90vh] overflow-hidden text-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div>
            <h2 className="text-base font-bold text-white">ایمپورت ثبت‌نام و حضور وبینار</h2>
            <p className="text-xs text-slate-400">اکشن ۱ ص ۱۸: بروزرسانی خودکار وضعیت حضور و ثبت‌نام</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center">
              <AlertCircle className="w-4 h-4 me-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                <div className="font-bold text-emerald-400 text-sm mb-2 flex items-center">
                  <CheckCircle2 className="w-5 h-5 me-2 text-emerald-400" />
                  ایمپورت و بروزرسانی با موفقیت انجام شد
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 tabular-nums">
                  <div>کل ردیف‌ها: {result.totalRows.toLocaleString('fa-IR')}</div>
                  <div>ثبت‌نام جدید: {result.successfullyImported.toLocaleString('fa-IR')}</div>
                  <div>بروزرسانی وضعیت حضور: {result.attendanceUpdatedCount.toLocaleString('fa-IR')}</div>
                  <div>تکراری یا بدون تغییر: {result.duplicates.toLocaleString('fa-IR')}</div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={onClose} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs">
                  بستن
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">محتوای CSV شرکت‌کنندگان:</label>
                  <button
                    type="button"
                    onClick={() => setCsvContent(sampleCsv)}
                    className="text-[11px] text-[#719BDF] hover:underline"
                  >
                    درج داده نمونه
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="نام و نام خانوادگی,شماره تلفن,ایمیل,وضعیت حضور..."
                  className="w-full p-3 bg-[#0B1423] border border-[#1F2E45] rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#719BDF] dir-ltr text-left"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#1F2E45]">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isUploading}
                  className="text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
                >
                  انصراف
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isUploading}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs shadow-md shadow-blue-900/30"
                >
                  {isUploading ? 'در حال ایمپورت...' : 'شروع ایمپورت'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Webinar Convert Leads Modal
function WebinarConvertLeadsModal({
  webinarId,
  isOpen,
  onClose,
  onSuccess,
}: {
  webinarId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'preview' | 'success'>('preview');
  const [preview, setPreview] = useState<ConvertAttendeesPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('preview');
      setIsLoading(true);
      setError(null);

      webinarsApi
        .convertAttendeesPreview(webinarId)
        .then((res) => setPreview(res))
        .catch((err) => setError(err?.response?.data?.message || 'خطا در پیش‌نمایش حاضران'))
        .finally(() => setIsLoading(false));
    }
  }, [webinarId, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setError(null);
      const res = await webinarsApi.convertAttendeesConfirm(webinarId);
      setCreatedCount(res.createdCount);
      setStep('success');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'خطا در ساخت لید');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111D2E] rounded-2xl w-full max-w-xl shadow-2xl border border-[#1F2E45] flex flex-col max-h-[90vh] overflow-hidden text-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2E45] bg-[#0B1423]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#18263A] border border-[#1F2E45] text-[#719BDF] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">تبدیل حاضران وبینار به لید</h2>
              <p className="text-xs text-slate-400">اکشن ۲ ص ۱۸: پیش‌نمایش و تایید تراکنشی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-[#18263A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                  <p className="mt-2 text-xs text-slate-400">در حال بررسی حاضران و اعتبارسنجی تکراری‌ها...</p>
                </div>
              ) : preview?.totalEligibleAttendees === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                  <p className="text-sm font-medium text-white">هیچ حاضر جدیدی برای تبدیل یافت نشد</p>
                  <p className="text-xs text-slate-500 mt-1">
                    تنها افرادی که وضعیت حضور آنها ثبت شده و قبلاً تبدیل به لید نشده‌اند لیست می‌شوند.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#18263A] p-3.5 rounded-xl border border-[#1F2E45] text-center">
                      <div className="text-xs text-slate-400">کل حاضران</div>
                      <div className="text-lg font-bold tabular-nums text-white mt-1">
                        {preview?.totalEligibleAttendees.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 text-center">
                      <div className="text-xs text-emerald-400 font-medium">لید جدید واجد شرایط</div>
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

                  <div className="border border-[#1F2E45] rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-[#1F2E45]/40 text-xs bg-[#0B1423]/50">
                    {preview?.attendees.map((a) => (
                      <div key={a.id} className="p-3 flex items-center justify-between hover:bg-[#18263A]/40 transition-colors">
                        <div>
                          <div className="font-semibold text-white">{a.fullName}</div>
                          <div className="font-mono text-slate-400 text-[11px]">{a.mobileMasked}</div>
                        </div>
                        <div>
                          {a.isDuplicate ? (
                            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px]">
                              تکراری: {a.existingLeadName || 'موجود'}
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

                  <div className="pt-2 flex justify-end gap-2 border-t border-[#1F2E45]">
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
              <h3 className="text-base font-bold text-white">تبدیل به لید با موفقیت انجام شد</h3>
              <p className="text-xs text-slate-300">
                تعداد <strong className="tabular-nums text-emerald-400">{createdCount.toLocaleString('fa-IR')}</strong> لید جدید از حاضران وبینار
                ایجاد و به کمپین متصل گردید.
              </p>
              <Button onClick={onClose} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs">
                بستن
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
