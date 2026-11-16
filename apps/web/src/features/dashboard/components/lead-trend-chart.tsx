'use client';

import * as React from 'react';
import { Users, Info, Calendar } from 'lucide-react';
import type { LeadTrendPoint } from '../types';

export interface LeadTrendChartProps {
  trends?: LeadTrendPoint[];
}

export function LeadTrendChart({ trends = [] }: LeadTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // حذف کامل داده‌های هاردکدشده موک (D-04) - استفاده منحصربه‌فرد از آرایه واقعی trends
  const dataPoints: LeadTrendPoint[] = trends || [];
  const hasData = dataPoints.length > 0 && dataPoints.some((p) => p.leadsCount > 0);

  const totalLeads = React.useMemo(
    () => dataPoints.reduce((sum, t) => sum + (t.leadsCount || 0), 0),
    [dataPoints],
  );

  const maxVal = React.useMemo(() => {
    if (dataPoints.length === 0) return 10;
    const rawMax = Math.max(...dataPoints.map((p) => p.leadsCount || 0), 5);
    return Math.ceil(rawMax * 1.15);
  }, [dataPoints]);

  const width = 600;
  const height = 180;
  const paddingX = 24;
  const paddingY = 20;

  const mappedPoints = React.useMemo(() => {
    if (dataPoints.length === 0) return [];
    const stepX = (width - paddingX * 2) / Math.max(1, dataPoints.length - 1);
    const usableHeight = height - paddingY * 2;

    return dataPoints.map((point, index) => {
      const x = paddingX + index * stepX;
      const count = point.leadsCount || 0;
      const y = height - paddingY - (count / maxVal) * usableHeight;
      return { x, y, data: point, index };
    });
  }, [dataPoints, maxVal, width, height]);

  const { linePath, areaPath } = React.useMemo(() => {
    if (mappedPoints.length === 0) return { linePath: '', areaPath: '' };
    if (mappedPoints.length === 1) {
      return {
        linePath: `M ${mappedPoints[0].x} ${mappedPoints[0].y}`,
        areaPath: '',
      };
    }

    let d = `M ${mappedPoints[0].x} ${mappedPoints[0].y}`;
    for (let i = 0; i < mappedPoints.length - 1; i++) {
      const p0 = mappedPoints[i];
      const p1 = mappedPoints[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const lastX = mappedPoints[mappedPoints.length - 1].x;
    const firstX = mappedPoints[0].x;
    const bottomY = height - 5;
    const area = `${d} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { linePath: d, areaPath: area };
  }, [mappedPoints, height]);

  const activePointIndex = hoveredIndex !== null
    ? hoveredIndex
    : (mappedPoints.length > 0 ? mappedPoints.length - 1 : null);
  const activePoint = activePointIndex !== null ? mappedPoints[activePointIndex] : null;

  return (
    <div
      className="bg-[#111D2E]/85 backdrop-blur-md rounded-2xl border border-[#1F2E45] p-5 shadow-xl space-y-4 transition-all relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#719BDF]/30 to-transparent" />

      {/* هدر نمودار */}
      <div className="flex items-center justify-between border-b border-[#1F2E45]/80 pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#719BDF] shadow-[0_0_8px_#719BDF]" />
            <h3 className="text-sm font-bold text-slate-100 font-display">
              روند جذب لید (Leads)
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            توزیع زمانی ورود سرنخ‌های جدید در بازه منتخب
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-left bg-[#18263A] border border-[#1F2E45] px-3 py-1 rounded-xl">
            <span className="text-xs font-black text-[#719BDF] font-display me-1">
              {totalLeads.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-slate-400">لید کل</span>
          </div>
        </div>
      </div>

      {/* حالت تهی (Empty State) در صورت عدم وجود داده واقعی (D-04) */}
      {!hasData ? (
        <div className="py-12 px-4 text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#18263A] border border-[#1F2E45] text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-slate-500" />
          </div>
          <h4 className="text-xs font-bold text-slate-300">
            در این بازه زمانی هیچ سرنخی ثبت نشده است
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
            با ایجاد سرنخ‌های جدید از طریق کمپین‌ها یا فرم ورود اطلاعات، روند روزانه جذب به صورت خودکار مصورسازی خواهد شد.
          </p>
        </div>
      ) : (
        /* ناحیه رندر چارت با داده‌های واقعی */
        <div className="relative w-full pt-1">
          {activePoint && (
            <div
              className="absolute z-10 pointer-events-none transition-all duration-150 -translate-x-1/2 -top-2 flex flex-col items-center"
              style={{
                left: `${(activePoint.x / width) * 100}%`,
              }}
            >
              <div className="bg-[#18263A] border border-[#719BDF]/40 text-slate-100 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-400 font-normal">
                  {activePoint.data.label}:
                </span>
                <span className="text-[#719BDF] font-black">
                  {(activePoint.data.leadsCount || 0).toLocaleString('fa-IR')} لید
                </span>
              </div>
              <div className="w-1.5 h-1.5 bg-[#18263A] border-b border-r border-[#719BDF]/40 rotate-45 -mt-1" />
            </div>
          )}

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#719BDF" stopOpacity="0.32" />
                <stop offset="60%" stopColor="#719BDF" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#719BDF" stopOpacity="0.00" />
              </linearGradient>

              <filter id="icyGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#719BDF" floodOpacity="0.5" />
              </filter>
            </defs>

            <line
              x1="0"
              y1={paddingY}
              x2={width}
              y2={paddingY}
              stroke="#1F2E45"
              strokeDasharray="4 4"
              strokeOpacity="0.6"
            />
            <line
              x1="0"
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="#1F2E45"
              strokeDasharray="4 4"
              strokeOpacity="0.6"
            />
            <line
              x1="0"
              y1={height - paddingY}
              x2={width}
              y2={height - paddingY}
              stroke="#1F2E45"
              strokeOpacity="0.8"
            />

            {areaPath && (
              <path
                d={areaPath}
                fill="url(#leadAreaGradient)"
                className="transition-all duration-300"
              />
            )}

            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#719BDF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#icyGlow)"
                className="transition-all duration-300"
              />
            )}

            {activePoint && (
              <g>
                <line
                  x1={activePoint.x}
                  y1={paddingY}
                  x2={activePoint.x}
                  y2={height - paddingY}
                  stroke="#719BDF"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  strokeOpacity="0.6"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="7"
                  fill="#719BDF"
                  fillOpacity="0.25"
                  className="animate-ping"
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="4.5"
                  fill="#719BDF"
                  stroke="#080F1C"
                  strokeWidth="2"
                />
              </g>
            )}

            {mappedPoints.map((pt, idx) => (
              <rect
                key={idx}
                x={pt.x - (width / Math.max(1, mappedPoints.length)) / 2}
                y="0"
                width={width / Math.max(1, mappedPoints.length)}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-slate-400 select-none">
            {dataPoints
              .filter((_, idx) => idx % Math.max(1, Math.ceil(dataPoints.length / 5)) === 0 || idx === dataPoints.length - 1)
              .map((item, idx) => (
                <span key={idx} className="hover:text-slate-200 transition-colors">
                  {item.label}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
