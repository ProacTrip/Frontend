'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Redirects admin users to /admin.
 * Admins have NO access to client routes (/, /perfil, /documentos, etc.).
 * Wrap around site layout content.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.permissions?.includes('users:read') || user?.role_name === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (isAdmin) {
      router.replace('/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
