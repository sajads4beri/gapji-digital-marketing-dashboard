'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

// داده‌های پیش‌فرض واقع‌گرایانه سگمنت‌های مخاطب در ایران
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
  },
  {
    id: 'aud_students_upskill',
    name: 'دانشجویان و مهارت‌آموزان تخصصی',
    description: 'متقاضیان یادگیری دوره‌های آنلاین، ارتقای شغلی و زبان‌های خارجی.',
    ageRange: '۱۹ الی ۲۹ سال',
    gender: 'all',
    locations: ['سراسر کشور'],
    interests: ['آموزش آنلاین', 'توسعه فردی', 'زبان انگلیسی'],
    estimatedSize: 520_000,
  },
];

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
  const [availableSegments, setAvailableSegments] = useState<AudienceSegment[]>(() => {
    // ترکیب سگمنت‌های پیش‌فرض با سگمنت‌های سفارشی ذخیره‌شده قبلی
    const custom = formData.targetAudience.customSegments || [];
    return [...DEFAULT_AUDIENCE_SEGMENTS, ...custom];
  });

  // لیست شناسه‌های مخاطبان انتخاب‌شده
  const selectedIds = formData.targetAudience.selectedAudienceIds || [
    'aud_ecommerce_heavy',
  ];

  // فیلتر جستجو
  const filteredSegments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return availableSegments;
    return availableSegments.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
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
  const [newSegmentAge, setNewSegmentAge] = useState('۲۲ الی ۳۵ سال');
  const [newSegmentGender, setNewSegmentGender] = useState<'all' | 'male' | 'female'>('all');
  const [newSegmentLocations, setNewSegmentLocations] = useState('تهران، اصفهان، مشهد');
  const [newSegmentInterests, setNewSegmentInterests] = useState('دیجیتال مارکتینگ، کسب‌وکار');
  const [newSegmentSize, setNewSegmentSize] = useState('۲۵۰۰۰۰');
  const [modalError, setModalError] = useState<string | null>(null);

  const handleCreateSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName.trim()) {
      setModalError('لطفاً نام دسته مخاطب را وارد فرمایید.');
      return;
    }

    const created: AudienceSegment = {
      id: `custom_aud_${Date.now()}`,
      name: newSegmentName.trim(),
      description: newSegmentDesc.trim() || 'دسته مخاطب اختصاصی کمپین',
      ageRange: newSegmentAge,
      gender: newSegmentGender,
      locations: newSegmentLocations
        .split('،')
        .map((s) => s.trim())
        .filter(Boolean),
      interests: newSegmentInterests
        .split('،')
        .map((s) => s.trim())
        .filter(Boolean),
      estimatedSize: Number(newSegmentSize) || 150_000,
      isCustom: true,
    };

    const updatedList = [created, ...availableSegments];
    const updatedCustom = [created, ...(formData.targetAudience.customSegments || [])];
    const updatedSelected = [...selectedIds, created.id];

    setAvailableSegments(updatedList);
    onUpdateFormData({
      targetAudience: {
        ...formData.targetAudience,
        customSegments: updatedCustom,
        selectedAudienceIds: updatedSelected,
      },
    });

    // بازنشانی و بستن مدال
    setNewSegmentName('');
    setNewSegmentDesc('');
    setModalError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm space-y-6">
      {/* هدر مرحله */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Users size={20} />
            <h3 className="text-base font-bold text-gray-900">
              انتخاب مخاطبان هدف
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            مخاطبان هدف کمپین را از دسته‌های آماده انتخاب کنید یا سگمنت جدید بسازید.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-blue-200 transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>ساخت سگمنت جدید</span>
        </button>
      </div>

      {/* نوار خلاصه جمعیت انتخاب‌شده و جستجو */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">مجموع دسترسی تخمینی:</span>
          <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-sm">
            {totalEstimatedReach.toLocaleString('fa-IR')} کاربر
          </span>
          <span className="text-gray-400">({selectedIds.length} دسته انتخاب‌شده)</span>
        </div>

        <div className="relative flex items-center">
          <Search size={14} className="absolute right-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نام یا ویژگی مخاطب..."
            className="w-full md:w-64 bg-white border border-gray-200 rounded-lg pr-8 pl-3 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {errors.targetAudience && (
        <p className="text-xs text-red-600 font-medium">
          {errors.targetAudience}
        </p>
      )}

      {/* فهرست کارت‌های سگمنت مخاطب */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredSegments.length === 0 ? (
          <div className="col-span-2 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-xs">
            مخاطبی با عبارت «{searchTerm}» یافت نشد. می‌توانید با دکمه بالا سگمنت جدید بسازید.
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
                    ? 'bg-blue-50/50 border-blue-400 shadow-sm ring-1 ring-blue-300'
                    : 'bg-white hover:bg-gray-50/80 border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-gray-900">
                      {segment.name}
                    </h4>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed mb-3 line-clamp-2">
                    {segment.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-gray-400" />
                      <span>موقعیت:</span>
                    </span>
                    <span className="font-medium text-gray-700 truncate max-w-[150px]">
                      {segment.locations.join('، ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag size={11} className="text-gray-400" />
                      <span>علایق:</span>
                    </span>
                    <span className="font-medium text-gray-700 truncate max-w-[150px]">
                      {segment.interests.join('، ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-semibold text-gray-800">
                    <span>اندازه تخمینی مخاطب:</span>
                    <span className="text-blue-700">
                      {segment.estimatedSize.toLocaleString('fa-IR')} نفر
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Sparkles size={18} className="text-blue-600" />
                <span>تعریف سگمنت مخاطب جدید</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSegment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  نام سگمنت <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSegmentName}
                  onChange={(e) => setNewSegmentName(e.target.value)}
                  placeholder="مثال: خریداران تلفن همراه و لوازم جانبی"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  توضیحات مشخصات مخاطب
                </label>
                <textarea
                  rows={2}
                  value={newSegmentDesc}
                  onChange={(e) => setNewSegmentDesc(e.target.value)}
                  placeholder="رفتار خرید، ویژگی‌های کلیدی یا کانال‌های مرجع..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    رده سنی مخاطبان
                  </label>
                  <input
                    type="text"
                    value={newSegmentAge}
                    onChange={(e) => setNewSegmentAge(e.target.value)}
                    placeholder="مثال: ۲۰ الی ۳۵ سال"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">جنسیت</label>
                  <select
                    value={newSegmentGender}
                    onChange={(e) => setNewSegmentGender(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">همه (زن و مرد)</option>
                    <option value="female">فقط خانم‌ها</option>
                    <option value="male">فقط آقایان</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  استان‌ها و شهرها (با ویرگول فارسی جدا کنید)
                </label>
                <input
                  type="text"
                  value={newSegmentLocations}
                  onChange={(e) => setNewSegmentLocations(e.target.value)}
                  placeholder="تهران، اصفهان، شیراز"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    علایق کلیدی
                  </label>
                  <input
                    type="text"
                    value={newSegmentInterests}
                    onChange={(e) => setNewSegmentInterests(e.target.value)}
                    placeholder="فناوری، خرید، موبایل"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    اندازه تخمینی کاربر
                  </label>
                  <input
                    type="number"
                    value={newSegmentSize}
                    onChange={(e) => setNewSegmentSize(e.target.value)}
                    placeholder="۲۵۰۰۰۰"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors"
                >
                  افزودن و انتخاب سگمنت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
