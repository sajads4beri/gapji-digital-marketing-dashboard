import type { Metadata } from 'next';
import { ToastProvider } from '@/components/common';
import { AuthProvider } from '@/features/auth';
import { QueryProvider } from '@/components/providers/query-provider';
import { vazirmatn } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gapji Digital Marketing Dashboard',
  description: 'Manage your marketing campaigns with Gapji',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className={`${vazirmatn.className} font-sans antialiased text-slate-100 bg-[#080F1C]`}>
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
