'use client';

import * as React from 'react';
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/common/toast-provider';
import { useAuth } from '@/features/auth';
import { canPerformAction } from '@/lib/permissions';
import {
  ImportDataType,
  ImportStep,
  InspectImportResult,
  ValidateImportResult,
  ExecuteImportResult,
} from '../types';
import { importsApi } from '../imports.api';
import { ClientCsvParser } from '../utils/csv-parser';
import { Step1Upload } from './steps/step-1-upload';
import { Step2Mapping } from './steps/step-2-mapping';
import { Step3Preview } from './steps/step-3-preview';
import { Step4Results } from './steps/step-4-results';

interface ImportWizardProps {
  initialDataType?: ImportDataType;
  onComplete?: (result: ExecuteImportResult) => void;
  className?: string;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ImportWizard({
  initialDataType = 'leads',
  onComplete,
  className = '',
}: ImportWizardProps) {
  const { toast } = useToast();
  const { activeRole } = useAuth();

  // ارزیابی دسترسی‌ها بر مبنای DEC-AUTH-11
  const canAccessLeads =
    canPerformAction('leads.import', activeRole) ||
    activeRole === 'admin' ||
    activeRole === 'marketing_manager' ||
    activeRole === 'sales_agent';

  const canAccessCosts =
    canPerformAction('costs.import', activeRole) ||
    activeRole === 'admin' ||
    activeRole === 'marketing_manager' ||
    activeRole === 'campaign_manager';

  // تعیین نوع داده اولیه بر اساس مجوزها
  const getInitialDataType = (): ImportDataType => {
    if (initialDataType === 'leads' && canAccessLeads) return 'leads';
    if (initialDataType === 'costs' && canAccessCosts) return 'costs';
    if (canAccessLeads) return 'leads';
    if (canAccessCosts) return 'costs';
    return 'leads';
  };

  const [dataType, setDataType] = React.useState<ImportDataType>(getInitialDataType);

  // هماهنگ‌سازی با تغییر Query Param
  React.useEffect(() => {
    if (initialDataType === 'leads' && canAccessLeads) {
      setDataType('leads');
    } else if (initialDataType === 'costs' && canAccessCosts) {
      setDataType('costs');
    }
  }, [initialDataType, canAccessLeads, canAccessCosts]);

  const [currentStep, setCurrentStep] = React.useState<ImportStep>(1);

  // وضعیت فایل انتخابی
  const [fileInfo, setFileInfo] = React.useState<{
    name: string;
    sizeKb: number;
    text: string;
    rowCount: number;
  } | null>(null);

  // وضعیت خروجی بازرسی و هدرها
  const [inspectResult, setInspectResult] = React.useState<InspectImportResult | null>(null);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});

  // وضعیت اعتبارسنجی سطرها
  const [validationResult, setValidationResult] = React.useState<ValidateImportResult | null>(null);

  // وضعیت خروجی اجرای ایمپورت
  const [executionResult, setExecutionResult] = React.useState<ExecuteImportResult | null>(null);

  // وضعیت‌های بارگذاری
  const [isInspecting, setIsInspecting] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);

  // تطبیق مجدد نوع داده با تغییر نقش یا ورود کاربر
  React.useEffect(() => {
    if (!canAccessLeads && canAccessCosts && dataType === 'leads') {
      setDataType('costs');
    } else if (!canAccessCosts && canAccessLeads && dataType === 'costs') {
      setDataType('leads');
    }
  }, [canAccessLeads, canAccessCosts, dataType]);

  // بررسی عدم دسترسی کامل (مثلاً نقش کلاینت)
  if (!canAccessLeads && !canAccessCosts) {
    return (
      <div className="p-8 text-center rounded-2xl border border-rose-500/30 bg-rose-500/10 max-w-xl mx-auto my-12 shadow-xl">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">عدم دسترسی به مرکز ورود اطلاعات</h3>
        <p className="text-xs text-rose-300 mt-1.5 leading-relaxed">
          نقش کاربری فعلی شما دسترسی لازم برای ایمپورت داده‌های لید یا هزینه به این سازمان را ندارد.
        </p>
      </div>
    );
  }

  // تغییر نوع داده
  const handleDataTypeChange = (newType: ImportDataType) => {
    if (newType === dataType) return;
    setDataType(newType);
    setFileInfo(null);
    setInspectResult(null);
    setMapping({});
    setValidationResult(null);
    setExecutionResult(null);
    setCurrentStep(1);
  };

  // بارگذاری فایل
  const handleFileLoaded = (name: string, sizeKb: number, text: string, rowCount: number) => {
    setFileInfo({ name, sizeKb, text, rowCount });
    setInspectResult(null);
    setMapping({});
    setValidationResult(null);
  };

  const handleClearFile = () => {
    setFileInfo(null);
    setInspectResult(null);
    setMapping({});
    setValidationResult(null);
  };

  // گام ۱ -> گام ۲: بازرسی فایل و دریافت نگاشت پیشنهادی
  const handleProceedToMapping = async () => {
    if (!fileInfo) {
      toast.error('لطفاً ابتدا یک فایل CSV معتبر بارگذاری کنید');
      return;
    }

    setIsInspecting(true);
    try {
      const inspectData = await importsApi.inspectFile(dataType, fileInfo.text);
      setInspectResult(inspectData);
      setMapping(inspectData.suggestedMappings || {});
      setCurrentStep(2);
      toast.success(`فایل با موفقیت بازرسی شد (${inspectData.rowCount.toLocaleString('fa-IR')} سطر شناسایی گردید)`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطا در بازرسی فایل CSV';
      toast.error(msg);
    } finally {
      setIsInspecting(false);
    }
  };

  // تغییر نگاشت یک فیلد
  const handleMappingChange = (header: string, targetKey: string) => {
    setMapping((prev) => ({
      ...prev,
      [header]: targetKey,
    }));
  };

  // بازیابی نگاشت خودکار
  const handleAutoMatch = () => {
    if (inspectResult?.suggestedMappings) {
      setMapping(inspectResult.suggestedMappings);
      toast.success('نگاشت ستون‌ها بر اساس نام‌ها و مترادف‌ها مجدداً بازنشانی شد');
    }
  };

  // گام ۲ -> گام ۳: اعتبارسنجی سرور
  const handleProceedToValidation = async () => {
    if (!inspectResult || !fileInfo) return;

    // بررسی فیلدهای اجباری
    const requiredFields = inspectResult.targetFields.filter((f) => f.required);
    const mappedTargetKeys = new Set(
      Object.values(mapping).filter((k) => k && k !== '__ignore__'),
    );
    const missingRequired = requiredFields.filter((f) => !mappedTargetKeys.has(f.key));

    if (missingRequired.length > 0) {
      const missingNames = missingRequired.map((f) => f.labelFa).join('، ');
      toast.error(`فیلدهای اجباری زیر نگاشت نشده‌اند: ${missingNames}`);
      return;
    }

    setIsValidating(true);
    try {
      // پارس کردن کلاینتی برای ارسال سطرها
      const parsed = ClientCsvParser.parse(fileInfo.text);
      if (parsed.rowCount === 0 || parsed.rows.length === 0) {
        toast.error('هیچ سطری در فایل انتخابی شناسایی نشد');
        return;
      }

      const valRes = await importsApi.validateRows(dataType, mapping, parsed.rows);
      setValidationResult(valRes);
      setCurrentStep(3);

      if (valRes.validRowsCount === 0) {
        toast.warning('هیچ سطر معتبری برای ایمپورت شناسایی نشد. لطفاً خطاها را بررسی کنید.');
      } else {
        toast.success(`اعتبارسنجی انجام شد: ${valRes.validRowsCount.toLocaleString('fa-IR')} سطر آماده ذخیره‌سازی`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطا در اعتبارسنجی داده‌ها';
      toast.error(msg);
    } finally {
      setIsValidating(false);
    }
  };

  // گام ۳ -> گام ۴: اجرای نهایی ایمپورت
  const handleExecuteImport = async () => {
    if (!validationResult || !fileInfo) return;

    const validRowsToPersist = validationResult.rows
      .filter((r) => r.status === 'valid')
      .map((r) => r.normalizedData);

    if (validRowsToPersist.length === 0) {
      toast.error('هیچ سطر معتبری برای ذخیره‌سازی در پایگاه داده وجود ندارد');
      return;
    }

    setIsExecuting(true);
    try {
      const idempotencyKey = generateUUID();
      const res = await importsApi.executeImport({
        dataType,
        fileName: fileInfo.name,
        validRows: validRowsToPersist,
        idempotencyKey,
        duplicateHandling: 'skip',
        mapping,
      });

      setExecutionResult(res);
      setCurrentStep(4);
      if (onComplete) {
        onComplete(res);
      }
      toast.success(`ایمپورت پایان یافت: ${res.importedCount.toLocaleString('fa-IR')} رکورد با موفقیت ثبت شد`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'خطا در ذخیره‌سازی داده‌ها';
      toast.error(msg);
    } finally {
      setIsExecuting(false);
    }
  };

  // بازنشانی کامل ویزارد
  const handleReset = () => {
    setCurrentStep(1);
    setFileInfo(null);
    setInspectResult(null);
    setMapping({});
    setValidationResult(null);
    setExecutionResult(null);
  };

  // تعریف عناوین مراحل ۴ گانه
  const stepsDef: Array<{ step: ImportStep; title: string; subtitle: string }> = [
    { step: 1, title: 'بارگذاری فایل', subtitle: 'انتخاب نوع و فایل CSV' },
    { step: 2, title: 'نگاشت ستون‌ها', subtitle: 'تطبیق فیلدها با سامانه' },
    { step: 3, title: 'پیش‌نمایش و اعتبارسنجی', subtitle: 'بررسی تکراری‌ها و قوانین' },
    { step: 4, title: 'نتایج نهایی', subtitle: 'گزارش ثبت و رهگیری' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* نوار هدایت مراحل (Stepper Progress Bar) هماهنگ با طراحی Gapji */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md border border-[#1F2E45] rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {stepsDef.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;

            return (
              <div
                key={s.step}
                className={`relative flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-[#719BDF]/15 text-white border border-[#719BDF]/40 ring-1 ring-[#719BDF]/30 shadow-md shadow-[#719BDF]/10'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#0B1423]/60 text-slate-500 border border-[#1F2E45]/80'
                }`}
              >
                {/* دایره شماره مرحله */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-[#719BDF] text-white shadow-md shadow-[#719BDF]/25'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-[#18263A] text-slate-400 border border-[#1F2E45]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.step}
                </div>

                {/* متون مرحله */}
                <div className="min-w-0">
                  <div
                    className={`text-xs sm:text-sm font-bold truncate ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate hidden sm:block">
                    {s.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* کارت محتوای مرحله فعال */}
      <div className="bg-[#111D2E]/80 backdrop-blur-md border border-[#1F2E45] rounded-2xl p-5 sm:p-7 shadow-xl min-h-[440px] flex flex-col justify-between">
        <div className="space-y-6">
          {currentStep === 1 && (
            <Step1Upload
              dataType={dataType}
              onDataTypeChange={handleDataTypeChange}
              fileName={fileInfo?.name || null}
              fileSizeKb={fileInfo?.sizeKb || 0}
              rawCsvText={fileInfo?.text || ''}
              rowCount={fileInfo?.rowCount || 0}
              onFileLoaded={handleFileLoaded}
              onClearFile={handleClearFile}
              isInspecting={isInspecting}
              canAccessLeads={canAccessLeads}
              canAccessCosts={canAccessCosts}
            />
          )}

          {currentStep === 2 && inspectResult && (
            <Step2Mapping
              dataType={dataType}
              headers={inspectResult.headers}
              previewRows={inspectResult.previewRows}
              targetFields={inspectResult.targetFields}
              mapping={mapping}
              onMappingChange={handleMappingChange}
              onAutoMatch={handleAutoMatch}
            />
          )}

          {currentStep === 3 && (
            <Step3Preview
              dataType={dataType}
              validationResult={validationResult}
              isValidating={isValidating}
            />
          )}

          {currentStep === 4 && executionResult && (
            <Step4Results
              dataType={dataType}
              result={executionResult}
              validationResult={validationResult}
              onReset={handleReset}
            />
          )}
        </div>

        {/* دکمه‌های کنترل و ناوبری پایین صفحه هماهنگ با سبک دکمه‌های Gapji */}
        {currentStep < 4 && (
          <div className="pt-6 mt-6 border-t border-[#1F2E45] flex items-center justify-between gap-4">
            {/* دکمه بازگشت */}
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentStep((prev) => (prev - 1) as ImportStep)}
                disabled={isInspecting || isValidating || isExecuting}
                className="border-[#1F2E45] bg-[#0B1423] text-slate-300 hover:bg-[#18263A] hover:text-white rounded-xl"
              >
                <ArrowRight className="w-4 h-4 me-1.5" />
                مرحله قبلی
              </Button>
            ) : (
              <div />
            )}

            {/* دکمه پیشروی */}
            <div>
              {currentStep === 1 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleProceedToMapping}
                  disabled={!fileInfo || isInspecting}
                  className="min-w-[150px] bg-[#719BDF] hover:bg-[#5A85C9] text-white rounded-xl shadow-lg shadow-[#719BDF]/20 font-medium"
                >
                  {isInspecting ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      در حال بازرسی فایل...
                    </>
                  ) : (
                    <>
                      ادامه به نگاشت ستون‌ها
                      <ArrowLeft className="w-4 h-4 ms-2" />
                    </>
                  )}
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleProceedToValidation}
                  disabled={isValidating}
                  className="min-w-[150px] bg-[#719BDF] hover:bg-[#5A85C9] text-white rounded-xl shadow-lg shadow-[#719BDF]/20 font-medium"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      در حال اعتبارسنجی سرور...
                    </>
                  ) : (
                    <>
                      ادامه به پیش‌نمایش و اعتبارسنجی
                      <ArrowLeft className="w-4 h-4 ms-2" />
                    </>
                  )}
                </Button>
              )}

              {currentStep === 3 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExecuteImport}
                  disabled={isExecuting || !validationResult || validationResult.validRowsCount === 0}
                  className="min-w-[170px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 font-medium"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      در حال ذخیره‌سازی در دیتابیس...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 me-2" />
                      تأیید و اجرای نهایی ({validationResult?.validRowsCount?.toLocaleString('fa-IR') || 0} سطر)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
