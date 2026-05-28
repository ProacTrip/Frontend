'use client';

import Navbar from "@/components/layout/Navbar";
import AdminGuard from "@/components/auth/AdminGuard";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <Navbar />
      <main className="min-h-screen pt-[72px]">{children}</main>
    </AdminGuard>
  );
}
