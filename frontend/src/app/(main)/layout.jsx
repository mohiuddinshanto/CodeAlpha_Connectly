'use client';

import { LeftSidebar } from '../../components/LeftSidebar';
import { MobileBottomNav, MobileHeader } from '../../components/MobileNav';
import { RightSidebar } from '../../components/RightSidebar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <MobileHeader />

      <div className="mx-auto flex max-w-[1280px] justify-center">
        <LeftSidebar />

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-10">
          <div className="mx-auto max-w-[660px]">{children}</div>
        </main>

        <RightSidebar />
      </div>

      <MobileBottomNav />
    </div>
  );
}
