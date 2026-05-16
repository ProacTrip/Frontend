'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AccountSidebar } from './AccountSidebar';

export function AccountShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar skeleton */}
        <aside className="hidden md:flex md:w-56 shrink-0 border-r border-paper-outline bg-paper-dim p-4">
          <div className="space-y-3 w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-paper-container animate-pulse"
              />
            ))}
          </div>
        </aside>
        {/* Content skeleton */}
        <main className="flex-1 p-6">
          <div className="max-w-2xl space-y-4">
            <div className="h-8 w-48 rounded-lg bg-paper-container animate-pulse" />
            <div className="h-48 rounded-xl bg-paper-container animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect in effect above
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AccountSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
