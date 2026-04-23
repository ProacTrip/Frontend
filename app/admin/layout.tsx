// app/admin/layout.tsx
//Utilidad: Layout protegido: si no eres admin, te redirige a home

'use client';

import { useEffect, useState } from 'react';
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
  const [devRole, setDevRole] = useState<string | null>(null);

  // Leer localStorage SOLO en cliente
  useEffect(() => {
    setDevRole(localStorage.getItem('role'));
  }, []);

  // ✅ CORREGIDO: localStorage gana sobre user?.role
  // Si pusiste 'admin' en consola, se usa eso. Si no, se usa lo que diga useAuth.
  const effectiveRole = devRole !== null ? devRole : user?.role;
  
  // Esperamos a que useAuth termine de cargar Y a que leamos localStorage
  const isReady = !isLoading && devRole !== null;

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin');
      return;
    }

    if (effectiveRole !== 'admin') {
      console.log('[AdminLayout] Redirigiendo. Rol detectado:', effectiveRole);
      router.push('/home');
    }
  }, [isReady, isAuthenticated, effectiveRole, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#c54141] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || effectiveRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}