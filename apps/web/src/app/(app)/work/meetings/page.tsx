'use client';

import * as React from 'react';
import { useToast } from '@/components/common/toast-provider';
import {
  meetingsApi,
  MeetingItem,
  MeetingActionItem,
  EmailPreviewResponse,
} from '@/features/meetings';
import {
  FileText,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  ArrowRight,
  ExternalLink,
  ListTodo,
  Check,
  X,
  Mail,
  Eye,
  Sparkles,
} from 'lucide-react';

export default function MeetingsPage() {
  const { toast } = useToast();

  const [meetings, setMeetings] = React.useState<MeetingItem[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = React.useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = React.useState<MeetingItem | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDetailLoading, setIsDetailLoading] = React.useState(false);

  // مودال‌ها
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = React.useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [emailPreview, setEmailPreview] = React.useState<EmailPreviewResponse | null>(null);

  // فرم صورتجلسه
  const [formTitle, setFormTitle] = React.useState('');
  const [formDate, setFormDate] = React.useState('');
  const [formLocation, setFormLocation] = React.useState('');
  const [formAttendees, setFormAttendees] = React.useState('');
  const [formSummary, setFormSummary] = React.useState('');
  const [formNotes, setFormNotes] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = React.useState(false);

  // فرم اقدام
  const [actionDesc, setActionDesc] = React.useState('');
  const [actionDueDate, setActionDueDate] = React.useState('');
  const [isSubmittingAction, setIsSubmittingAction] = React.useState(false);

  // بارگذاری لیست صورتجلسات
  const loadMeetings = React.useCallback(async (selectId?: string) => {
    setIsLoading(true);
    try {
      const data = await meetingsApi.getMeetings({ search: searchQuery });
      setMeetings(data);
      if (data.length > 0) {
        const idToSelect = selectId || selectedMeetingId || data[0].id;
        setSelectedMeetingId(idToSelect);
      } else {
        setSelectedMeetingId(null);
        setSelectedMeeting(null);
      }
    } catch (err) {
      toast.error('خطا در بارگذاری فهرست صورتجلسات');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedMeetingId, toast]);

  // بارگذاری جزئیات صورتجلسه انتخاب‌شده
  const loadMeetingDetails = React.useCallback(async (id: string) => {
    setIsDetailLoading(true);
    try {
      const data = await meetingsApi.getMeeting(id);
      setSelectedMeeting(data);
    } catch (err) {
      toast.error('خطا در بارگذاری جزئیات صورتجلسه');
    } finally {
      setIsDetailLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  React.useEffect(() => {
    if (selectedMeetingId) {
      loadMeetingDetails(selectedMeetingId);
    }
  }, [selectedMeetingId, loadMeetingDetails]);

  // فرمت تاریخ شمسی
  const formatPersianDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  // تغییر وضعیت مصوبه (انجام‌شده / نشده)
  const handleToggleAction = async (actionItemId: string, currentStatus: boolean) => {
    try {
      await meetingsApi.toggleActionItem(actionItemId, !currentStatus);
      if (selectedMeetingId) {
        loadMeetingDetails(selectedMeetingId);
      }
    } catch (err) {
      toast.error('خطا در تغییر وضعیت اقدام');
    }
  };

  // تبدیل مستقیم مصوبه به تسک عملیاتی (Pipeline)
  const handleConvertToTask = async (actionItemId: string) => {
    try {
      const result = await meetingsApi.convertActionItemToTask(actionItemId);
      toast.success(result.message);
      if (selectedMeetingId) {
        loadMeetingDetails(selectedMeetingId);
      }
    } catch (err) {
      toast.error('خطا در تبدیل مصوبه به وظیفه');
    }
  };

  // ارسال ایمیل
  const handleOpenEmailPreview = async () => {
    if (!selectedMeetingId) return;
    try {
      const preview = await meetingsApi.previewEmail(selectedMeetingId);
      setEmailPreview(preview);
      setIsEmailModalOpen(true);
    } catch (err) {
      toast.error('خطا در دریافت پیش‌نمایش ایمیل');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedMeetingId) return;
    try {
      const res = await meetingsApi.sendEmail(selectedMeetingId);
      toast.success(res.message);
      setIsEmailModalOpen(false);
    } catch (err) {
      toast.error('خطا در ارسال ایمیل صورتجلسه');
    }
  };

  // ثبت یا ویرایش صورتجلسه
  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) {
      toast.error('عنوان و تاریخ جلسه الزامی است');
      return;
    }

    setIsSubmittingForm(true);
    try {
      if (isEditing && selectedMeetingId) {
        await meetingsApi.updateMeeting(selectedMeetingId, {
          title: formTitle.trim(),
          meetingDate: new Date(formDate).toISOString(),
          location: formLocation.trim() || undefined,
          attendeesSummary: formAttendees.trim() || undefined,
          summary: formSummary.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
        toast.success('صورتجلسه ویرایش شد (نسخه جدید ثبت گردید).');
        loadMeetingDetails(selectedMeetingId);
      } else {
        const created = await meetingsApi.createMeeting({
          title: formTitle.trim(),
          meetingDate: new Date(formDate).toISOString(),
          location: formLocation.trim() || undefined,
          attendeesSummary: formAttendees.trim() || undefined,
          summary: formSummary.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
        toast.success('صورتجلسه جدید با موفقیت ثبت شد.');
        loadMeetings(created.id);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      toast.error('خطا در ذخیره صورتجلسه');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // افزودن مصوبه جدید
  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId || !actionDesc.trim()) {
      toast.error('شرح مصوبه الزامی است');
      return;
    }

    setIsSubmittingAction(true);
    try {
      await meetingsApi.addActionItem(selectedMeetingId, {
        description: actionDesc.trim(),
        dueDate: actionDueDate || undefined,
      });
      toast.success('مصوبه جدید با موفقیت به صورتجلسه افزوده شد.');
      setIsActionModalOpen(false);
      setActionDesc('');
      setActionDueDate('');
      loadMeetingDetails(selectedMeetingId);
    } catch (err) {
      toast.error('خطا در ثبت اقدام');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // حذف صورتجلسه
  const handleDeleteMeeting = async () => {
    if (!selectedMeetingId) return;
    if (!confirm('آیا از حذف این صورتجلسه اطمینان دارید؟')) return;

    try {
      await meetingsApi.deleteMeeting(selectedMeetingId);
      toast.success('صورتجلسه با موفقیت حذف گردید.');
      loadMeetings();
    } catch (err) {
      toast.error('خطا در حذف صورتجلسه');
    }
  };

  // باز کردن فرم ویرایش
  const handleOpenEdit = () => {
    if (!selectedMeeting) return;
    setFormTitle(selectedMeeting.title);
    setFormDate(selectedMeeting.meetingDate ? selectedMeeting.meetingDate.split('T')[0] : '');
    setFormLocation(selectedMeeting.location || '');
    setFormAttendees(selectedMeeting.attendeesSummary || '');
    setFormSummary(selectedMeeting.summary || '');
    setFormNotes(selectedMeeting.notes || '');
    setIsEditing(true);
    setIsCreateModalOpen(true);
  };

  // باز کردن فرم ایجاد جدید
  const handleOpenCreate = () => {
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLocation('اتاق جلسات / آنلاین');
    setFormAttendees('');
    setFormSummary('');
    setFormNotes('');
    setIsEditing(false);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* سربرگ صفحه */}
      <div className="bg-[#111D2E] p-5 rounded-2xl border border-[#1F2E45] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-100 font-display">
                صورتجلسات و مصوبات تیمی
              </h1>
              <p className="text-xs text-slate-400">
                مستندسازی جلسات، پیگیری مصوبات، تبدیل مستقیم به تسک و ارسال ایمیل
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#719BDF] text-white hover:bg-[#5A85C9] transition-all shadow-md shadow-[#719BDF]/20"
        >
          <Plus size={16} />
          <span>ثبت صورتجلسه جدید</span>
        </button>
      </div>

      {/* چیدمان دوتکه (Master-Detail) با عرض بهینه خوانایی ۸۰۰ پیکسل */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ستون راست: فهرست صورتجلسات (۴ ستون) */}
        <div className="lg:col-span-4 bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-3.5 space-y-3 shadow-lg">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی عنوان یا حاضرین..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl ps-9 pe-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="divide-y divide-[#1F2E45]/60 max-h-[650px] overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-[#18263A] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : meetings.length > 0 ? (
              meetings.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMeetingId(m.id)}
                  className={`w-full text-right p-3 rounded-xl transition-all block ${
                    selectedMeetingId === m.id
                      ? 'bg-[#18263A] border border-[#719BDF]/40 shadow-sm'
                      : 'hover:bg-[#18263A]/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{m.title}</h4>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#111D2E] text-slate-400 border border-[#1F2E45]">
                      v{m.versionNumber}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar size={12} className="text-[#719BDF]" />
                    <span>{formatPersianDate(m.meetingDate)}</span>
                  </div>

                  {m.attendeesSummary && (
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                      حاضرین: {m.attendeesSummary}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-[#1F2E45]/60">
                    <span>{m.actionItems?.length || 0} مصوبه توافق‌شده</span>
                    <span className="text-[#719BDF] font-semibold">مشاهده متن ›</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                صورتجلسه‌ای یافت نشد.
              </div>
            )}
          </div>
        </div>

        {/* ستون چپ: نمای مطالعه بهینه (۸۰۰ پیکسل خوانایی منطبق بر REQ-011 و REQ-073) */}
        <div className="lg:col-span-8 flex justify-center">
          <div className="w-full max-w-[800px] bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-6 shadow-xl space-y-6">
            {isDetailLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-[#18263A] rounded-xl w-3/4" />
                <div className="h-24 bg-[#18263A] rounded-xl" />
                <div className="h-40 bg-[#18263A] rounded-xl" />
              </div>
            ) : selectedMeeting ? (
              <div className="space-y-6">
                {/* سربرگ صورتجلسه */}
                <div className="border-b border-[#1F2E45] pb-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-black text-slate-100 font-display">
                          {selectedMeeting.title}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30">
                          نسخه {selectedMeeting.versionNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-[#719BDF]">
                          <Calendar size={13} />
                          <span>{formatPersianDate(selectedMeeting.meetingDate)}</span>
                        </span>
                        {selectedMeeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} />
                            <span>{selectedMeeting.location}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={13} />
                          <span>ثبت‌کننده: {selectedMeeting.createdBy?.fullName || 'کاربر سیستم'}</span>
                        </span>
                      </div>
                    </div>

                    {/* دکمه‌های عملیاتی سربرگ */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenEmailPreview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#719BDF]/15 text-[#719BDF] border border-[#719BDF]/30 hover:bg-[#719BDF]/25 transition-colors"
                      >
                        <Mail size={14} />
                        <span>ارسال ایمیل به همه</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="p-2 rounded-xl text-slate-300 hover:text-white bg-[#18263A] hover:bg-[#1F2E45] border border-[#1F2E45] transition-colors"
                        title="ویرایش صورتجلسه"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteMeeting}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-[#18263A] hover:bg-rose-500/10 border border-[#1F2E45] transition-colors"
                        title="حذف صورتجلسه"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {selectedMeeting.attendeesSummary && (
                    <div className="bg-[#18263A]/70 px-3.5 py-2 rounded-xl text-xs text-slate-300 flex items-center gap-2 border border-[#1F2E45]/60">
                      <Users size={14} className="text-[#719BDF] shrink-0" />
                      <span><strong>حاضرین در جلسه:</strong> {selectedMeeting.attendeesSummary}</span>
                    </div>
                  )}
                </div>

                {/* خلاصه مباحث کلیدی */}
                {selectedMeeting.summary && (
                  <div className="bg-[#18263A]/50 p-4 rounded-2xl border-r-4 border-r-[#719BDF] border-y border-l border-[#1F2E45] space-y-1.5">
                    <h3 className="text-xs font-bold text-[#719BDF]">خلاصه تصمیمات و نکات کلیدی:</h3>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                      {selectedMeeting.summary}
                    </p>
                  </div>
                )}

                {/* مشروح مذاکرات */}
                {selectedMeeting.notes && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-300">مشروح مذاکرات و شرح جلسه:</h3>
                    <div className="bg-[#18263A]/30 p-4 rounded-xl border border-[#1F2E45] text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {selectedMeeting.notes}
                    </div>
                  </div>
                )}

                {/* بخش مصوبات و تبدیل مستقیم به وظایف (Action Items Pipeline) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListTodo size={17} className="text-[#719BDF]" />
                      <h3 className="text-sm font-bold text-slate-100">
                        مصوبات و اقدامات توافق‌شده ({selectedMeeting.actionItems.length})
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsActionModalOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#719BDF] bg-[#719BDF]/10 hover:bg-[#719BDF]/20 transition-colors"
                    >
                      <Plus size={14} />
                      <span>افزودن مصوبه</span>
                    </button>
                  </div>

                  <div className="border border-[#1F2E45] rounded-2xl overflow-hidden divide-y divide-[#1F2E45]/60">
                    {selectedMeeting.actionItems.length > 0 ? (
                      selectedMeeting.actionItems.map((action, idx) => (
                        <div
                          key={action.id}
                          className="p-3.5 bg-[#18263A]/20 hover:bg-[#18263A]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleAction(action.id, action.isCompleted)}
                              className="mt-0.5 text-slate-400 hover:text-emerald-400"
                              title={action.isCompleted ? 'علامت‌گذاری به عنوان انجام‌نشده' : 'علامت‌گذاری به عنوان انجام‌شده'}
                            >
                              {action.isCompleted ? (
                                <CheckCircle2 size={18} className="text-emerald-400" />
                              ) : (
                                <Circle size={18} />
                              )}
                            </button>

                            <div className="space-y-1">
                              <p
                                className={`text-xs leading-snug ${
                                  action.isCompleted
                                    ? 'line-through text-slate-500'
                                    : 'font-semibold text-slate-100'
                                }`}
                              >
                                {action.description}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                {action.assignee && (
                                  <span>مسئول: {action.assignee.fullName}</span>
                                )}
                                {action.dueDate && (
                                  <span>مهلت: {new Date(action.dueDate).toLocaleDateString('fa-IR')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {action.taskId ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <Check size={12} />
                                <span>تسک عملیاتی متصل</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleConvertToTask(action.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#719BDF] text-white hover:bg-[#5A85C9] transition-all shadow-xs"
                                title="ایجاد تسک خودکار در ماژول وظایف برای اقدام‌کننده"
                              >
                                <ArrowRight size={13} />
                                <span>تبدیل به وظیفه</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        هیچ مصوبه‌ای برای این جلسه ثبت نشده است.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <FileText size={36} className="mx-auto text-slate-500" />
                <h3 className="text-sm font-bold text-slate-300">صورتجلسه‌ای انتخاب نشده است</h3>
                <p className="text-xs text-slate-400">
                  جهت مشاهده متن و مصوبات، یک مورد را از ستون راست انتخاب کنید یا صورتجلسه جدید بسازید.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مودال ۱: ثبت یا ویرایش صورتجلسه */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText size={16} className="text-[#719BDF]" />
                <span>{isEditing ? 'ویرایش صورتجلسه' : 'ثبت صورتجلسه جدید'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان صورتجلسه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جلسه هماهنگی کمپین‌های بازاریابی نوروز"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاریخ برگزاری جلسه *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">محل جلسه یا لینک</label>
                  <input
                    type="text"
                    placeholder="مثال: اتاق کنفرانس / آنلاین"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسامی حاضرین در جلسه</label>
                <input
                  type="text"
                  placeholder="مثال: علی رضایی، سارا راد، مدیر کمپین"
                  value={formAttendees}
                  onChange={(e) => setFormAttendees(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">خلاصه مباحث و تصمیمات</label>
                <textarea
                  rows={2}
                  placeholder="خلاصه توافقات در چند جمله..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">مشروح مذاکرات و یادداشت‌ها</label>
                <textarea
                  rows={4}
                  placeholder="متن کامل صورتجلسه..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#18263A]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-4 py-2 rounded-xl bg-[#719BDF] text-white font-bold hover:bg-[#5A85C9] transition-colors"
                >
                  {isSubmittingForm ? 'در حال ذخیره...' : isEditing ? 'ثبت ویرایش جدید' : 'ایجاد صورتجلسه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ۲: افزودن مصوبه جدید */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ListTodo size={16} className="text-[#719BDF]" />
                <span>افزودن مصوبه به صورتجلسه</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">شرح مصوبه یا اقدام توافق‌شده *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="مثال: طراحی بنرهای همسان یکتانت برای بودجه نوروزی"
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">مهلت انجام (اختیاری)</label>
                <input
                  type="date"
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="w-full bg-[#18263A] border border-[#1F2E45] rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#18263A]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-4 py-2 rounded-xl bg-[#719BDF] text-white font-bold hover:bg-[#5A85C9] transition-colors"
                >
                  {isSubmittingAction ? 'در حال ثبت...' : 'افزودن مصوبه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ۳: پیش‌نمایش و ارسال ایمیل صورتجلسه */}
      {isEmailModalOpen && emailPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] p-5 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F2E45] pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Mail size={16} className="text-[#719BDF]" />
                  <span>پیش‌نمایش ایمیل صورتجلسه جهت ارسال</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  گیرندگان: {emailPreview.attendees || 'کلیه حاضرین در جلسه'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-[#18263A] px-3.5 py-2 rounded-xl text-xs text-slate-200 border border-[#1F2E45]">
                <strong>موضوع ایمیل:</strong> {emailPreview.subject}
              </div>

              {/* کادر رندر HTML پیش‌نمایش ایمیل */}
              <div className="bg-white rounded-xl p-4 overflow-hidden max-h-96 overflow-y-auto text-black">
                <div dangerouslySetInnerHTML={{ __html: emailPreview.htmlContent }} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#1F2E45]">
              <span className="text-[11px] text-slate-400">
                شامل {emailPreview.actionItemsCount} مصوبه و خلاصه تصمیمات
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#18263A]"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20"
                >
                  <Send size={14} />
                  <span>تایید و ارسال ایمیل</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
