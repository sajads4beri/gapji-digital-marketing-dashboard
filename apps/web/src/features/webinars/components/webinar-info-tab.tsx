'use client';

import React, { useState } from 'react';
import { WebinarDetail, WebinarStatus } from '../types';
import { webinarsApi } from '../webinars.api';
import {
  Calendar,
  Clock,
  User,
  Video,
  ExternalLink,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WebinarInfoTabProps {
  webinar: WebinarDetail;
  onRefresh: () => void;
}

export function WebinarInfoTab({ webinar, onRefresh }: WebinarInfoTabProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const copyUrl = () => {
    if (!webinar.registrationUrl) return;
    navigator.clipboard.writeText(webinar.registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: WebinarStatus) => {
    try {
      setIsUpdatingStatus(true);
      await webinarsApi.updateStatus(webinar.id, newStatus);
      onRefresh();
    } catch (err) {
      // Handled by refresh
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formattedDate = new Date(webinar.webinarDate).toLocaleString('fa-IR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: برگزاری و مدرس */}
        <div className="bg-[#111D2E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-[#1F2E45] pb-3">
            مشخصات برگزاری رویداد
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                زمان برگزاری:
              </span>
              <span className="font-semibold text-white tabular-nums">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                مدت زمان:
              </span>
              <span className="font-semibold text-white tabular-nums">{webinar.durationMinutes} دقیقه</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                مدرس و ارائه‌دهنده:
              </span>
              <span className="font-semibold text-white">{webinar.presenterName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-slate-500" />
                پلتفرم وبینار:
              </span>
              <Badge className="bg-[#719BDF]/15 text-[#719BDF] border-[#719BDF]/30">{webinar.platform}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-500" />
                کمپین بازاریابی:
              </span>
              <span className="font-semibold text-slate-200">
                {webinar.campaignName || 'بدون اتصال به کمپین'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: مدیریت انتشار و وضعیت */}
        <div className="bg-[#111D2E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-[#1F2E45] pb-3">
            وضعیت انتشار و دسترسی به جلسه
          </h3>

          {/* Meeting Link Box */}
          <div className="p-3.5 bg-[#0B1423] rounded-xl border border-[#1F2E45]">
            <div className="text-xs font-medium text-slate-300 mb-1.5">نشانی جلسه یا ثبت‌نام:</div>
            {webinar.registrationUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webinar.registrationUrl}
                  className="w-full bg-[#18263A] px-2.5 py-1.5 rounded-lg border border-[#1F2E45] text-xs font-mono text-[#719BDF] dir-ltr text-left"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUrl}
                  className="px-2.5 text-xs bg-[#18263A] border-[#1F2E45] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
                  title="کپی لینک"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a
                  href={webinar.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg border border-[#1F2E45] bg-[#18263A] text-slate-300 hover:text-white hover:bg-[#1F2E45]"
                  title="باز کردن در پنجره جدید"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <span className="text-xs text-slate-500">لینکی ثبت نشده است.</span>
            )}
          </div>

          {/* Status Transitions */}
          <div>
            <div className="text-xs font-medium text-slate-300 mb-2">تغییر وضعیت چرخه حیات وبینار:</div>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={isUpdatingStatus || webinar.status === 'draft'}
                onClick={() => handleStatusChange('draft')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  webinar.status === 'draft'
                    ? 'bg-[#18263A] text-white border-[#719BDF] font-bold shadow-sm'
                    : 'bg-[#18263A] text-slate-400 border-[#1F2E45] hover:bg-[#1F2E45] hover:text-white'
                }`}
              >
                پیش‌نویس
              </button>

              <button
                disabled={isUpdatingStatus || webinar.status === 'scheduled'}
                onClick={() => handleStatusChange('scheduled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  webinar.status === 'scheduled'
                    ? 'bg-[#719BDF]/20 text-white border-[#719BDF] font-bold shadow-sm'
                    : 'bg-[#18263A] text-slate-400 border-[#1F2E45] hover:bg-[#1F2E45] hover:text-white'
                }`}
              >
                برنامه‌ریزی‌شده (انتشار)
              </button>

              <button
                disabled={isUpdatingStatus || webinar.status === 'live'}
                onClick={() => handleStatusChange('live')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  webinar.status === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold shadow-sm animate-pulse'
                    : 'bg-[#18263A] text-slate-400 border-[#1F2E45] hover:bg-[#1F2E45] hover:text-white'
                }`}
              >
                در حال برگزاری (Live)
              </button>

              <button
                disabled={isUpdatingStatus || webinar.status === 'completed'}
                onClick={() => handleStatusChange('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  webinar.status === 'completed'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500 font-bold shadow-sm'
                    : 'bg-[#18263A] text-slate-400 border-[#1F2E45] hover:bg-[#1F2E45] hover:text-white'
                }`}
              >
                پایان‌یافته
              </button>

              <button
                disabled={isUpdatingStatus || webinar.status === 'cancelled'}
                onClick={() => handleStatusChange('cancelled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  webinar.status === 'cancelled'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold shadow-sm'
                    : 'bg-[#18263A] text-slate-400 border-[#1F2E45] hover:bg-[#1F2E45] hover:text-white'
                }`}
              >
                لغوشده
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      {webinar.description && (
        <div className="bg-[#111D2E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#1F2E45] shadow-xl shadow-black/20">
          <h3 className="text-sm font-bold text-white mb-2">توضیحات و سرفصل‌های جلسه</h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {webinar.description}
          </p>
        </div>
      )}
    </div>
  );
}
