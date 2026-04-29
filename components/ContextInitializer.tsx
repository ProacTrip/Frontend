'use client';

import { useEffect } from 'react';
import { fetchAndStoreContext } from '@/app/lib/utils/location';
import { useAuthContext } from '@/contexts/AuthContext';

export function ContextInitializer() {
  const { isAuthenticated, isLoading, context, setContext } = useAuthContext();

  useEffect(() => {
    if (isLoading) {
      console.log('[ContextInit] AuthProvider still loading, waiting...');
      return;
    }

    if (isAuthenticated || context) {
      console.log('[ContextInit] Skipping —', isAuthenticated ? 'authenticated' : 'context already set');
      return;
    }

    console.log('[ContextInit] Fetching context from GET /v1/context...');

    fetchAndStoreContext().then((result) => {
      console.log('[ContextInit] Response:', result ? 'OK' : 'FAILED');
      if (result) {
        setContext(result);
      }
    });
  }, [isLoading, isAuthenticated, context]);

  return null;
}
