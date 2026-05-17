'use client';

// ==========================================
// useRateLimit — Hook para componentes que necesitan feedback de rate limiting
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { rateLimitStore, type RateLimitInfo } from '@/app/lib/api/rate-limit';

interface UseRateLimitReturn {
  /** Info de rate limit del último request */
  info: RateLimitInfo | null;
  /** true si el usuario está bloqueado por 429 */
  isBlocked: boolean;
  /** Segundos restantes hasta que se desbloquee (0 si no está bloqueado) */
  secondsLeft: number;
  /** true si remaining <= 20% del límite — mostrar warning preventivo */
  isLow: boolean;
  /** Reinicia el contador de bloqueo manualmente */
  resetBlock: () => void;
}

export function useRateLimit(): UseRateLimitReturn {
  const [info, setInfo] = useState<RateLimitInfo | null>(rateLimitStore.current);
  const [isBlocked, setIsBlocked] = useState(rateLimitStore.isBlocked);
  const [secondsLeft, setSecondsLeft] = useState(rateLimitStore.secondsUntilUnblock);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLow =
    info !== null && info.limit > 0
      ? info.remaining <= Math.max(3, Math.floor(info.limit * 0.2))
      : false;

  const resetBlock = useCallback(() => {
    rateLimitStore.reset();
    setIsBlocked(false);
    setSecondsLeft(0);
    setInfo(null);
  }, []);

  useEffect(() => {
    const unsub = rateLimitStore.subscribe((newInfo) => {
      setInfo(newInfo);
      setIsBlocked(rateLimitStore.isBlocked);
      setSecondsLeft(rateLimitStore.secondsUntilUnblock);
    });

    return () => {
      unsub();
    };
  }, []);

  // Countdown cuando está bloqueado
  useEffect(() => {
    if (isBlocked && secondsLeft > 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const left = rateLimitStore.secondsUntilUnblock;
        setSecondsLeft(left);
        if (left <= 0) {
          setIsBlocked(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isBlocked, secondsLeft]);

  return { info, isBlocked, secondsLeft, isLow, resetBlock };
}
