import * as React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-[#070D18] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(113,155,223,0.15),rgba(255,255,255,0))] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#719BDF] selection:text-white relative overflow-hidden font-sans"
      dir="rtl"
    >
      {/* هاله‌های نوری شناور پس‌زمینه (Executive Ambient Glow) */}
      <div
        className="absolute -top-40 -right-40 w-96 h-96 bg-[#719BDF]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-md mx-auto relative z-10">{children}</div>
    </div>
  );
}
