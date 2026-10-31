'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CampaignsTable({ campaigns }: { campaigns: any[] }) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">لیست کمپین‌ها</h2>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
            + کمپین جدید
          </button>
          <input
            type="text"
            placeholder="جستجو..."
            className="border rounded px-3 py-2 text-sm w-48 ml-3"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">نام کمپین</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">کانال</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">بجیت</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">هزینه</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">نمایش</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">کلیک</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تبدیل</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                هیچ کمپین‌ای پیدا نشد
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                <TableCell className="px-6 py-4 font-medium text-gray-900">{campaign.name}</TableCell>
                <TableCell className="px-6 py-4 text-gray-600">{campaign.channel}</TableCell>
                <TableCell className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-gray-600">{campaign.budget.toLocaleString()}</TableCell>
                <TableCell className="px-6 py-4 text-gray-600">{campaign.spend.toLocaleString()}</TableCell>
                <TableCell className="px-6 py-4 text-gray-600">{campaign.impressions.toLocaleString()}</TableCell>
                <TableCell className="px-6 py-4 text-gray-600">{campaign.clicks.toLocaleString()}</TableCell>
                <TableCell className="px-6 py-4 text-gray-600">{campaign.conversions.toLocaleString()}</TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">ویرایش</button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'paused': return 'bg-yellow-100 text-yellow-700';
    case 'completed': return 'bg-blue-100 text-blue-700';
    case 'archived': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
