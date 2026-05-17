'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ContextInitializer } from '@/components/ContextInitializer';

/**
 * Client wrapper que provee AuthContext a toda la app.
 * Necesario porque Next.js 16 root layout es server component por default
 * y AuthProvider usa hooks (client-only).
 *
 * serverAuthenticated viene del layout (Server Component) que ya leyó las cookies.
 * Evita llamadas innecesarias a GET /v1/auth/me cuando no hay sesión.
 */
export function Providers({
  children,
  serverAuthenticated,
}: {
  children: React.ReactNode;
  serverAuthenticated: boolean;
}) {
  return (
    <AuthProvider serverAuthenticated={serverAuthenticated}>
      <ContextInitializer />
      {children}
    </AuthProvider>
  );
}
