'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CampaignFormData, AudienceSegment } from '../../../types';
import {
  Users,
  Search,
  Plus,
  Check,
  MapPin,
  Tag,
  X,
  Sparkles,
  Share2,
  Loader2,
} from 'lucide-react';
import { audiencesApi, Audience } from '@/features/audiences';

// داده‌های پیش‌فرض پشتیبان در صورت خالی بودن دیتابیس
const DEFAULT_AUDIENCE_SEGMENTS: AudienceSegment[] = [
  {
    id: 'aud_ecommerce_heavy',
    name: 'خریداران اینترنتی پرمصرف',
    description: 'کاربرانی که در ۳۰ روز گذشته حداقل ۲ خرید آنلاین بالای ۱ میلیون تومان ثبت کرده‌اند.',
    ageRange: '۲۵ الی ۴۰ سال',
    gender: 'all',
    locations: ['تهران', 'اصفهان', 'مشهد', 'شیراز', 'کرج'],
    interests: ['خرید آنلاین', 'تخفیف‌ها', 'محصولات دیجیتال'],
    estimatedSize: 680_000,
    channel: 'اینستاگرام و گوگل ادز',
  },
  {
    id: 'aud_b2b_executives',
    name: 'مدیران ارشد و صاحبان کسب‌وکار',
    description: 'کارآفرینان، بنیان‌گذاران استارتاپ‌ها، مدیران بازاریابی و فروش در سراسر ایران.',
    ageRange: '۳۰ الی ۵۵ سال',
    gender: 'all',
    locations: ['کلانشهرها و مراکز استان'],
    interests: ['کسب‌وکار', 'سرمایه‌گذاری', 'نرم‌افزار سازمانی'],
    estimatedSize: 195_000,
    channel: 'لینکدین و ایمیل',
  },
  {
    id: 'aud_tech_enthusiasts',
    name: 'فعالان فناوری و هوش مصنوعی',
    description: 'برنامه‌نویسان، طراحان محصول و علاقه‌مندان به ابزارهای مدرن هوش مصنوعی و نرم‌افزار.',
    ageRange: '۲۰ الی ۳۵ سال',
    gender: 'all',
    locations: ['تهران', 'اصفهان', 'تبریز', 'شیراز'],
    interests: ['فناوری', 'هوش مصنوعی', 'برنامه‌نویسی', 'گجت‌ها'],
    estimatedSize: 340_000,
    channel: 'گوگل ادز و وبسایت',
  },
  {
    id: 'aud_young_fashion',
    name: 'نسل جوان و علاقه‌مندان به مد و سبک زندگی',
    description: 'دنبال‌کنندگان ترندهای روز پوشاک، زیبایی و اکسسوری در اینستاگرام و شبکه‌های اجتماعی.',
    ageRange: '۱۸ الی ۲۸ سال',
    gender: 'female',
    locations: ['سراسر کشور'],
    interests: ['مد و پوشاک', 'زیبایی', 'سبک زندگی', 'اینستاگرام'],
    estimatedSize: 1_250_000,
    channel: 'اینستاگرام',
  },
];

function mapBackendAudienceToSegment(aud: Audience): AudienceSegment {
  const ageRange =
    aud.ageMin && aud.ageMax
      ? `${aud.ageMin} الی ${aud.ageMax} سال`
      : aud.ageMin
        ? `از ${aud.ageMin} سال`
        : aud.ageMax
          ? `تا ${aud.ageMax} سال`
          : 'نامحدود';

  const locations = aud.location
    ? aud.location.split(/[،,]/).map((l) => l.trim()).filter(Boolean)
    : ['سراسر کشور'];

  const interests = aud.interests
    ? aud.interests.split(/[،,]/).map((i) => i.trim()).filter(Boolean)
    : ['عمومی'];

  return {
    id: aud.id,
    name: aud.name,
    description: aud.description || 'گروه مخاطب هدف سامانه',
    ageRange,
    gender: aud.gender || 'all',
    locations,
    interests,
    channel: aud.channel,
    estimatedSize: 250_000,
    isCustom: true,
  };
}

interface Step2AudienceProps {
  formData: CampaignFormData;
  onUpdateFormData: (partial: Partial<CampaignFormData>) => void;
  errors?: Record<string, string>;
}

export function Step2Audience({
  formData,
  onUpdateFormData,
  errors = {},
}: Step2AudienceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  const [availableSegments, setAvailableSegments] = useState<AudienceSegment[]>(() => {
    const custom = formData.targetAudience.customSegments || [];
    return [...DEFAULT_AUDIENCE_SEGMENTS, ...custom];
  });

  // واکشی مخاطبان زنده از سرور بک‌اند
  useEffect(() => {
    let isMounted = true;
    async function loadBackendAudiences() {
      setIsLoadingBackend(true);
      try {
        const res = await audiencesApi.getAll({ limit: 50 });
        if (!isMounted) return;

        if (res.items && res.items.length > 0) {
          const liveSegments = res.items.map(mapBackendAudienceToSegment);
          setAvailableSegments((prev) => {
            const liveIds = new Set(liveSegments.map((s) => s.id));
            const retainedFallback = prev.filter((s) => !liveIds.has(s.id));
            return [...liveSegments, ...retainedFallback];
          });
        }
      } catch (err) {
        console.warn('Failed to load audiences from backend API, continuing with local segments', err);
      } finally {
        if (isMounted) setIsLoadingBackend(false);
      }
    }

    loadBackendAudiences();
    return () => {
      isMounted = false;
    };
  }, []);

  // لیست شناسه‌های مخاطبان انتخاب‌شده
  const selectedIds = formData.targetAudience.selectedAudienceIds || [];

  // فیلتر جستجو
  const filteredSegments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return availableSegments;
    return availableSegments.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.channel && s.channel.toLowerCase().includes(q)) ||
        s.locations.some((loc) => loc.toLowerCase().includes(q)) ||
        s.interests.some((int) => int.toLowerCase().includes(q)),
    );
  }, [availableSegments, searchTerm]);

  // مجموع جمعیت مخاطبان انتخاب‌شده
  const totalEstimatedReach = useMemo(() => {
    return availableSegments
      .filter((s) => selectedIds.includes(s.id))
      .reduce((sum, s) => sum + s.estimatedSize, 0);
  }, [availableSegments, selectedIds]);

  // تغییر وضعیت انتخاب یک سگمنت
  const handleToggleSelect = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];

    onUpdateFormData({
      targetAudience: {
        ...formData.targetAudience,
        selectedAudienceIds: newSelected,
        estimatedReach: totalEstimatedReach,
      },
    });
  };

  // فرم ساخت سگمنت جدید در مدال
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDesc, setNewSegmentDesc] = useState('');
  const [newSegmentChannel, setNewSegmentChannel] = useState('اینستاگرام');
  const [newSegmentMinAge, setNewSegmentMinAge] = useState('20');
  const [newSegmentMaxAge, setNewSegmentMaxAge] = useState('45');
  const [newSegmentGender, setNewSegmentGender] = useState<'all' | 'male' | 'female'>('all');
  const [newSegmentLocations, setNewSegmentLocations] = useState('تهران، اصفهان، مشهد');
  const [newSegmentInterests, setNewSegmentInterests] = useState('دیجیتال مارکتینگ، کسب‌وکار');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName.trim()) {
      setModalError('لطفاً نام دسته مخاطب را وارد فرمایید.');
      return;
    }

    setIsCreating(true);
    setModalError(null);

    try {
      const minAge = newSegmentMinAge.trim() ? parseInt(newSegmentMinAge, 10) : undefined;
      const maxAge = newSegmentMaxAge.trim() ? parseInt(newSegmentMaxAge, 10) : undefined;

      // ذخیره‌سازی مستقیم در دیتابیس بک‌اند
      const createdAud = await audiencesApi.create({
        name: newSegmentName.trim(),
        description: newSegmentDesc.trim() || undefined,
        channel: newSegmentChannel.trim() || undefined,
        gender: newSegmentGender,
        ageMin: minAge,
        ageMax: maxAge,
        location: newSegmentLocations.trim() || undefined,
        interests: newSegmentInterests.trim() || undefined,
      });

      const mapped = mapBackendAudienceToSegment(createdAud);
      const updatedList = [mapped, ...availableSegments];
      const updatedSelected = [...selectedIds, mapped.id];

      setAvailableSegments(updatedList);
      onUpdateFormData({
        targetAudience: {
          ...formData.targetAudience,
          selectedAudienceIds: updatedSelected,
        },
      });

      // بازنشانی و بستن مدال
      setNewSegmentName('');
      setNewSegmentDesc('');
      setModalError(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create audience in wizard:', err);
      setModalError(err.response?.data?.message || 'خطا در ثبت مخاطب در سرور رخ داد.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-[#111D2E]/80 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-6 sm:p-7 shadow-xl space-y-6">
      {/* هدر مرحله */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F2E45]">
        <div>
          <div className="flex items-center gap-2 text-[#719BDF] mb-1">
            <Users size={20} />
            <h3 className="text-base font-bold text-slate-100 font-display">
              انتخاب مخاطبان هدف (Target Audiences)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            مخاطبان هدف کمپین را از پرسوناهای تعریف‌شده سازمان انتخاب کنید یا مخاطب جدید ثبت فرمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#18263A] hover:bg-[#1F2E45] text-[#719BDF] hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-[#1F2E45] transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus size={16} />
          <span>تعریف مخاطب جدید</span>
        </button>
      </div>

      {/* نوار خلاصه جمعیت انتخاب‌شده و جستجو */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0B1423]/60 p-3.5 rounded-xl border border-[#1F2E45]">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">مجموع دسترسی تخمینی:</span>
          <span className="font-bold text-slate-100 bg-[#18263A] px-2.5 py-1 rounded-lg border border-[#1F2E45] text-xs font-display">
            {totalEstimatedReach.toLocaleString('fa-IR')} کاربر
          </span>
          <span className="text-slate-500">({selectedIds.length} دسته انتخاب‌شده)</span>
        </div>

        <div className="relative flex items-center">
          <Search size={16} className="absolute right-3 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی سگمنت، شهر یا علایق..."
            className="w-full md:w-64 bg-[#111D2E] border border-[#1F2E45] rounded-lg ps-9 pe-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:ring-1 focus:ring-[#719BDF]/20 focus:outline-none"
          />
        </div>
      </div>

      {errors.targetAudience && (
        <p className="text-xs text-[#D66B73] font-medium">
          {errors.targetAudience}
        </p>
      )}

      {/* فهرست کارت‌های سگمنت مخاطب */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {isLoadingBackend && availableSegments.length === 0 ? (
          <div className="col-span-2 text-center py-10 text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#719BDF]" />
            در حال بارگذاری مخاطبان...
          </div>
        ) : filteredSegments.length === 0 ? (
          <div className="col-span-2 text-center py-10 bg-[#0B1423]/40 rounded-xl border border-dashed border-[#1F2E45] text-slate-400 text-xs">
            مخاطبی با عبارت «{searchTerm}» یافت نشد. می‌توانید با دکمه بالا مخاطب جدید بسازید.
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const isSelected = selectedIds.includes(segment.id);
            return (
              <div
                key={segment.id}
                onClick={() => handleToggleSelect(segment.id)}
                className={`relative flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#18263A] border-[#719BDF] shadow-lg shadow-[#719BDF]/5 ring-1 ring-[#719BDF]/30'
                    : 'bg-[#111D2E]/60 hover:bg-[#18263A]/50 border-[#1F2E45]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-100 font-display">
                        {segment.name}
                      </h4>
                      {segment.channel && (
                        <span className="text-[10px] font-medium bg-[#0B1423] text-slate-400 border border-[#1F2E45] px-1.5 py-0.5 rounded">
                          {segment.channel}
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-[#719BDF] border-transparent text-white'
                          : 'border-[#1F2E45] bg-[#0B1423]'
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">
                    {segment.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#1F2E45] text-[10px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users size={11} className="text-slate-500" />
                      <span>رده سنی و جنسیت:</span>
                    </span>
                    <span className="font-medium text-slate-300">
                      {segment.ageRange} ({segment.gender === 'female' ? 'خانم‌ها' : segment.gender === 'male' ? 'آقایان' : 'همه'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-500" />
                      <span>موقعیت:</span>
                    </span>
                    <span className="font-medium text-slate-300 truncate max-w-[150px]">
                      {segment.locations.join('، ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag size={11} className="text-slate-500" />
                      <span>علایق:</span>
                    </span>
                    <span className="font-medium text-slate-300 truncate max-w-[150px]">
                      {segment.interests.join('، ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* مدال ساخت مخاطب جدید */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#111D2E] rounded-2xl border border-[#1F2E45] shadow-2xl w-full max-w-lg p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2E45]">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100 font-display">
                <Sparkles size={18} className="text-[#719BDF]" />
                <span>تعریف مخاطب هدف جدید در سامانه</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#18263A]"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="bg-[#D66B73]/10 border border-[#D66B73]/30 text-[#D66B73] text-xs p-2.5 rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSegment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  نام مخاطب <span className="text-[#D66B73]">*</span>
                </label>
                <input
                  type="text"
                  value={newSegmentName}
                  onChange={(e) => setNewSegmentName(e.target.value)}
                  placeholder="مثال: خریداران تلفن همراه و لوازم جانبی"
                  className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:outline-none"
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  توضیحات مشخصات مخاطب
                </label>
                <textarea
                  rows={2}
                  value={newSegmentDesc}
                  onChange={(e) => setNewSegmentDesc(e.target.value)}
                  placeholder="رفتار خرید، ویژگی‌های کلیدی یا الگوهای رفتاری..."
                  className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:outline-none resize-none"
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  کانال مناسب بازاریابی
                </label>
                <input
                  type="text"
                  value={newSegmentChannel}
                  onChange={(e) => setNewSegmentChannel(e.target.value)}
                  placeholder="مثال: اینستاگرام، گوگل ادز، لینکدین..."
                  className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:outline-none"
                  disabled={isCreating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    بازه سنی (حداقل و حداکثر)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={newSegmentMinAge}
                      onChange={(e) => setNewSegmentMinAge(e.target.value)}
                      placeholder="حداقل"
                      className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-2 py-2 text-xs text-center text-slate-100 focus:border-[#719BDF] focus:outline-none"
                      disabled={isCreating}
                    />
                    <span className="text-slate-500 text-xs">تا</span>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={newSegmentMaxAge}
                      onChange={(e) => setNewSegmentMaxAge(e.target.value)}
                      placeholder="حداکثر"
                      className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-2 py-2 text-xs text-center text-slate-100 focus:border-[#719BDF] focus:outline-none"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">جنسیت</label>
                  <select
                    value={newSegmentGender}
                    onChange={(e) => setNewSegmentGender(e.target.value as any)}
                    className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:border-[#719BDF] focus:outline-none"
                    disabled={isCreating}
                  >
                    <option value="all">همه (زن و مرد)</option>
                    <option value="female">فقط خانم‌ها</option>
                    <option value="male">فقط آقایان</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  استان‌ها و شهرها (با ویرگول جدا کنید)
                </label>
                <input
                  type="text"
                  value={newSegmentLocations}
                  onChange={(e) => setNewSegmentLocations(e.target.value)}
                  placeholder="تهران، اصفهان، شیراز"
                  className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:outline-none"
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  علایق کلیدی
                </label>
                <input
                  type="text"
                  value={newSegmentInterests}
                  onChange={(e) => setNewSegmentInterests(e.target.value)}
                  placeholder="فناوری، خرید، موبایل"
                  className="w-full bg-[#0B1423] border border-[#1F2E45] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#719BDF] focus:outline-none"
                  disabled={isCreating}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1F2E45]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#18263A] rounded-xl transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-[#719BDF] hover:from-blue-500 hover:to-[#719BDF]/90 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    'افزودن و انتخاب مخاطب'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
