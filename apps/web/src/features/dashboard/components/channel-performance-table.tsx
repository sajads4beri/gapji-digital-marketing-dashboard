'use client';

import * as React from 'react';
import { Layers, Globe, Instagram, MessageSquare, Video, Mail } from 'lucide-react';
import type { ChannelPerformanceMetric } from '../types';

export interface ChannelPerformanceTableProps {
 channels: ChannelPerformanceMetric[];
}

export function ChannelPerformanceTable({ channels }: ChannelPerformanceTableProps) {
 const getChannelIcon = (type: ChannelPerformanceMetric['channelType']) => {
 switch (type) {
 case 'google_ads':
 return <Globe className="w-4 h-4 text-blue-600 " />;
 case 'instagram':
 return <Instagram className="w-4 h-4 text-pink-600 " />;
 case 'sms':
 return <MessageSquare className="w-4 h-4 text-emerald-600 " />;
 case 'webinar':
 return <Video className="w-4 h-4 text-purple-600 " />;
 case 'email':
 return <Mail className="w-4 h-4 text-amber-600 " />;
 default:
 return <Layers className="w-4 h-4 text-slate-500 " />;
 }
 };

 const totalSpend = channels.reduce((acc, c) => acc + (c.spend || 0), 0);
 const totalLeads = channels.reduce((acc, c) => acc + (c.leads ?? c.leadsCount ?? 0), 0);
 const totalCustomers = channels.reduce((acc, c) => acc + (c.customers || 0), 0);
 const totalRevenue = channels.reduce((acc, c) => acc + (c.revenue || 0), 0);

 return (
 <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-colors" dir="rtl">
 {/* هدر جدول */}
 <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
 <div className="space-y-0.5">
 <h3 className="text-sm font-bold text-slate-900 ">عملکرد کانال‌های بازاریابی</h3>
 <p className="text-[11px] text-slate-400 ">
 توزیع منابع مالی، نرخ جذب سرنخ و بازگشت سرمایه به تفکیک رسانه‌ها
 </p>
 </div>
 <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
 {channels.length} کانال فعال
 </span>
 </div>

 {/* محتوای جدول */}
 <div className="overflow-x-auto">
 <table className="w-full text-right text-xs">
 <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80 ">
 <tr>
 <th className="py-3 px-4">کانال تبلیغاتی</th>
 <th className="py-3 px-3 text-center">سهم بودجه</th>
 <th className="py-3 px-3">هزینه (تومان)</th>
 <th className="py-3 px-3">تعداد لید</th>
 <th className="py-3 px-3">تعداد خریدار</th>
 <th className="py-3 px-3">درآمد حاصل (تومان)</th>
 <th className="py-3 px-3">CPL</th>
 <th className="py-3 px-4 text-center">ROAS</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {channels.map((ch) => (
 <tr key={ch.id} className="hover:bg-slate-50/60 transition-colors">
 <td className="py-3.5 px-4 font-semibold text-slate-900 ">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
 {getChannelIcon(ch.channelType)}
 </div>
 <span>{ch.name}</span>
 </div>
 </td>
 <td className="py-3.5 px-3 text-center">
 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 ">
 {ch.sharePercentage}٪
 </span>
 </td>
 <td className="py-3.5 px-3 text-slate-700 font-medium font-mono text-[11px]">
 {ch.spend.toLocaleString('fa-IR')}
 </td>
 <td className="py-3.5 px-3 text-blue-700 font-bold">
 {(ch.leads ?? ch.leadsCount ?? 0).toLocaleString('fa-IR')}
 </td>
 <td className="py-3.5 px-3 text-emerald-700 font-bold">
 {(ch.customers || 0).toLocaleString('fa-IR')}
 </td>
 <td className="py-3.5 px-3 text-slate-900 font-bold font-mono text-[11px]">
 {(ch.revenue || 0).toLocaleString('fa-IR')}
 </td>
 <td className="py-3.5 px-3 text-slate-600 text-[11px]">
 {ch.cpl ? `${ch.cpl.toLocaleString('fa-IR')} ت` : '—'}
 </td>
 <td className="py-3.5 px-4 text-center">
 {ch.roas ? (
 <span
 className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
 ch.roas >= 3
 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 '
 : 'bg-amber-50 text-amber-700 border border-amber-200 '
 }`}
 >
 {ch.roas.toLocaleString('fa-IR')}x
 </span>
 ) : (
 <span className="text-slate-400 ">—</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 ">
 <tr>
 <td className="py-3 px-4">مجموع عملکرد کانال‌ها</td>
 <td className="py-3 px-3 text-center">۱۰۰٪</td>
 <td className="py-3 px-3 font-mono text-[11px]">
 {totalSpend.toLocaleString('fa-IR')}
 </td>
 <td className="py-3 px-3 text-blue-800 ">
 {totalLeads.toLocaleString('fa-IR')}
 </td>
 <td className="py-3 px-3 text-emerald-800 ">
 {totalCustomers.toLocaleString('fa-IR')}
 </td>
 <td className="py-3 px-3 font-mono text-[11px]">
 {totalRevenue.toLocaleString('fa-IR')}
 </td>
 <td className="py-3 px-3 text-[11px] text-gray-700 ">
 {totalLeads > 0
 ? `${Math.round(totalSpend / totalLeads).toLocaleString('fa-IR')} ت`
 : '—'}
 </td>
 <td className="py-3 px-4 text-center">
 {totalSpend > 0 ? (
 <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">
 {(Math.round((totalRevenue / totalSpend) * 100) / 100).toLocaleString('fa-IR')}x
 </span>
 ) : '—'}
 </td>
 </tr>
 </tfoot>
 </table>
 </div>
 </div>
 );
}
