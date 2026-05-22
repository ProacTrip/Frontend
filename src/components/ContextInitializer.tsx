'use client';

import { useEffect, useRef } from 'react';
import { fetchAndStoreEnvironment } from '@/app/lib/utils/location';
import { useAuthContext } from '@/contexts/AuthContext';

const MAX_RETRIES = 3;

export function ContextInitializer() {
  const { isAuthenticated, isLoading, context, setContext } = useAuthContext();
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (isLoading) {
      console.log('[ContextInit] AuthProvider still loading, waiting...');
      return;
    }

    if (isAuthenticated || context) {
      console.log('[ContextInit] Skipping —', isAuthenticated ? 'authenticated' : 'context already set');
      return;
    }

    let cancelled = false;

    async function fetchWithRetry() {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;
        retryCountRef.current = attempt;

        console.log(`[ContextInit] Fetching environment (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

        try {
          const result = await fetchAndStoreEnvironment();
          if (cancelled) return;
          console.log('[ContextInit] Response:', result ? 'OK' : 'FAILED');
          if (result) {
            setContext(result);
            return; // success — stop retrying
          }
          // null result (non-throwing failure) — retry
        } catch {
          // network error — retry
          console.log(`[ContextInit] Attempt ${attempt + 1} failed`);
        }

        // Last attempt failed — give up silently
        if (attempt === MAX_RETRIES) return;

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    fetchWithRetry();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, context]);

  return null;
}
