'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ContextInitializer } from '@/components/ContextInitializer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/app/lib/queries/queryClient';
import { useRealtimeSSE } from '@/hooks/useRealtimeSSE';

/**
 * Inner component that starts the SSE connection.
 * Must be a child of QueryClientProvider (needs queryClient) and
 * AuthProvider/AuthContext (needs isAuthenticated).
 * Renders nothing — side-effect only.
 */
function RealtimeProvider() {
  useRealtimeSSE();
  return null;
}

/**
 * Client wrapper que provee AuthContext + TanStack Query + SSE a toda la app.
 * Necesario porque Next.js 16 root layout es server component por default
 * y AuthProvider + QueryClientProvider usan hooks (client-only).
 *
 * Nesting order:
 *   1. ErrorBoundary  — catches render errors from everything below
 *   2. QueryClientProvider — provides query client to AuthProvider, SSE, and all pages
 *   3. AuthProvider   — provides auth context; may use queries in the future
 *   4. ContextInitializer — runs after both providers are mounted
 *   5. RealtimeProvider — SSE connection (needs auth + queryClient)
 *   6. children       — page content
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
  const queryClient = getQueryClient();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider serverAuthenticated={serverAuthenticated}>
          <ContextInitializer />
          <RealtimeProvider />
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
