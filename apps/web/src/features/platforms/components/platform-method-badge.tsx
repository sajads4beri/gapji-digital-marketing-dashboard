import * as React from 'react';
import { FileSpreadsheet, Cpu, PenTool } from 'lucide-react';
import { PlatformRetrievalMethod } from '../types';

interface PlatformMethodBadgeProps {
  method: PlatformRetrievalMethod;
  className?: string;
}

export function PlatformMethodBadge({ method, className = '' }: PlatformMethodBadgeProps) {
  switch (method) {
    case 'api':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/25 ${className}`}
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>API</span>
        </span>
      );
    case 'import':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ${className}`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Import (فایل)</span>
        </span>
      );
    case 'manual':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#18263A] text-slate-300 border border-[#1F2E45] ${className}`}
        >
          <PenTool className="w-3.5 h-3.5 text-slate-400" />
          <span>دستی (Manual)</span>
        </span>
      );
  }
}
