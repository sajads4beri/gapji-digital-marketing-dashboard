import * as React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-blue-500 selection:text-white"
      dir="rtl"
    >
      <div className="w-full max-w-md mx-auto">{children}</div>
    </div>
  );
}
