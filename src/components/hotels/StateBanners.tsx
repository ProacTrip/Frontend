'use client';

import { useEffect, useState } from 'react';
import {
  SearchX,
  AlertTriangle,
  AlertCircle,
  Clock,
  WifiOff,
  ShieldAlert,
  ServerCrash,
} from 'lucide-react';

// ── Error Banner ──

interface ErrorBannerProps {
  /** RFC 9457 error code */
  errorCode?: string;
  /** Custom error message (overrides built-in mapping) */
  message?: string;
  /** Retry-After seconds for 429 errors */
  retryAfter?: number;
}

const ERROR_CONFIG: Record<
  string,
  {
    title: string;
    message: string;
    icon: typeof AlertCircle;
  }
> = {
  VALIDATION_ERROR: {
    title: 'Datos inválidos',
    message: 'Revisá los datos ingresados.',
    icon: AlertCircle,
  },
  TOKEN_INVALID: {
    title: 'Sesión expirada',
    message: 'Tu sesión expiró. Iniciá sesión de nuevo.',
    icon: ShieldAlert,
  },
  INVALID_PARAM_RANGE: {
    title: 'Valores fuera de rango',
    message: 'Algunos valores están fuera de rango.',
    icon: AlertCircle,
  },
  RATE_LIMIT_EXCEEDED: {
    title: 'Demasiadas búsquedas',
    message: 'Demasiadas búsquedas. Esperá {retry} segundos.',
    icon: Clock,
  },
  INTERNAL_ERROR: {
    title: 'Error del servidor',
    message: 'Error interno del servidor. Intentá de nuevo.',
    icon: ServerCrash,
  },
  PROVIDER_UNAVAILABLE: {
    title: 'Servicio no disponible',
    message:
      'El servicio de búsqueda no está disponible. Intentá más tarde.',
    icon: WifiOff,
  },
};

const DEFAULT_ERROR = {
  title: 'Error inesperado',
  message: 'Ocurrió un error. Intentá de nuevo.',
  icon: AlertCircle,
};

export function ErrorBanner({
  errorCode,
  message,
  retryAfter,
}: ErrorBannerProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  // Rate-limit countdown
  useEffect(() => {
    if (errorCode === 'RATE_LIMIT_EXCEEDED' && retryAfter && retryAfter > 0) {
      setCountdown(retryAfter);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [errorCode, retryAfter]);

  const config = errorCode ? ERROR_CONFIG[errorCode] || DEFAULT_ERROR : DEFAULT_ERROR;
  const Icon = config.icon;
  const displayMessage =
    message ||
    (countdown !== null
      ? config.message.replace('{retry}', String(countdown))
      : config.message);

  return (
    <div
      className="font-[family-name:var(--font-geist-sans)] flex items-start gap-3 rounded-xl border border-error/30 bg-error-container px-4 py-3"
      role="alert"
    >
      <Icon size={18} className="text-error shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-error">{config.title}</p>
        <p className="text-xs text-ink-muted mt-0.5">{displayMessage}</p>
      </div>
    </div>
  );
}

// ── Empty State ──

interface EmptyStateProps {
  /** Optional search query to personalize the message */
  query?: string;
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-paper-container">
        <SearchX size={32} className="text-ink-faint" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-ink" suppressHydrationWarning>
          No encontramos alojamientos
        </h3>
        <p className="text-sm text-ink-muted mt-1 max-w-md">
          {query
            ? `No hay resultados para "${query}". Probá con otro destino o ajustá los filtros.`
            : 'Probá con otros filtros o un destino diferente.'}
        </p>
      </div>
    </div>
  );
}

// ── Non-Matching Warning ──

interface NonMatchingWarningProps {
  /** Whether to show the warning */
  visible: boolean;
}

export function NonMatchingWarning({ visible }: NonMatchingWarningProps) {
  if (!visible) return null;

  return (
    <div
      className="font-[family-name:var(--font-geist-sans)] flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-container px-4 py-3"
      role="status"
    >
      <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warning">
          Resultados aproximados
        </p>
        <p className="text-xs text-ink-muted mt-0.5">
          No encontramos resultados exactos con tus filtros. Mostrando los
          alojamientos más cercanos.
        </p>
      </div>
    </div>
  );
}
