// app/admin/layout.tsx
//Utilidad: Layout protegido: si no eres admin, te redirige a home

'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/admin/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Role comes exclusively from AuthContext (GET /v1/auth/me).
  // localStorage role bypass removed — security: no DevTools override.
  const effectiveRole = user?.role_name;
  const effectivePermissions = user?.permissions;
  const canAccessDashboard =
    effectiveRole === 'admin' || effectivePermissions?.includes('users:read');
  const isReady = !isLoading;

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin');
      return;
    }

    if (!canAccessDashboard) {
      router.push('/home');
    }
  }, [isReady, isAuthenticated, canAccessDashboard, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#c54141] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !canAccessDashboard) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#c54141] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}