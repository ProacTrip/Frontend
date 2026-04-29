'use client';

import { useEffect } from 'react';
import { fetchAndStoreContext } from '@/app/lib/utils/location';
import { useAuth } from '@/hooks/useAuth';

export function ContextInitializer() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      fetchAndStoreContext();
    }
  }, [isAuthenticated]);

  return null;
}
