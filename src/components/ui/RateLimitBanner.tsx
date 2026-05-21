'use client';

// ==========================================
// RateLimitBanner — Feedback visual de rate limiting para páginas de auth
// ==========================================

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRateLimit } from '@/hooks/useRateLimit';

interface RateLimitBannerProps {
  /** Si no es null, el error incluye mensaje del RateLimitError para mostrar junto al banner */
  rateLimitError: string | null;
  /** Llamado cuando expira el bloqueo — el padre debe limpiar el error */
  onRetryReady: () => void;
}

export default function RateLimitBanner({ rateLimitError, onRetryReady }: RateLimitBannerProps) {
  const { isBlocked, secondsLeft, isLow, info } = useRateLimit();

  // Notificar al padre cuando el bloqueo expira — must be in useEffect,
  // NOT in render body (anti-pattern: triggers setState during render).
  useEffect(() => {
    if (!isBlocked && rateLimitError) {
      onRetryReady();
    }
  }, [isBlocked, rateLimitError, onRetryReady]);

  return (
    <AnimatePresence>
      {/* Banner preventivo: pocas peticiones restantes */}
      {isLow && !isBlocked && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-800 text-sm rounded"
        >
          ⚠️ Quedan {info?.remaining ?? 0} de {info?.limit ?? '?'} peticiones. 
          El límite se reinicia en breve.
        </motion.div>
      )}

      {/* Banner de bloqueo: 429 activo */}
      {isBlocked && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-sm rounded"
        >
          {rateLimitError || 'Demasiadas peticiones.'}
          {secondsLeft > 0 && (
            <span className="block mt-1 font-medium">
              Podés intentar de nuevo en {secondsLeft}s
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
