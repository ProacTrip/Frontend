'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ContextInitializer } from '@/components/ContextInitializer';

/**
 * Client wrapper que provee AuthContext a toda la app.
 * Necesario porque Next.js 16 root layout es server component por default
 * y AuthProvider usa hooks (client-only).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ContextInitializer />
      {children}
    </AuthProvider>
  );
}
