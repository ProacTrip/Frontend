'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Bell, BellOff, Calendar, Hash } from 'lucide-react';
import {
  listSavedSearches,
  deleteSavedSearch,
  toggleAlert,
} from '@/lib/api/user';
import type { SavedSearch } from '@/lib/api/types';

// ── Animations ──

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ── Helpers ──

function formatDate(iso: string | null): string {
  if (!iso) return 'Nunca';
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function summarizeParams(params: Record<string, unknown>): string {
  const parts: string[] = [];
  if (params.query) parts.push(String(params.query));
  if (params.check_in_date && params.check_out_date) {
    parts.push(`${String(params.check_in_date)} → ${String(params.check_out_date)}`);
  } else if (params.check_in_date) {
    parts.push(String(params.check_in_date));
  }
  const adults = params.adults as number | undefined;
  if (adults && adults > 0) {
    parts.push(`${adults} ${adults === 1 ? 'huésped' : 'huéspedes'}`);
  }
  return parts.join(' · ') || 'Sin parámetros';
}

// ── Component ──

export default function SearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listSavedSearches();
      setSearches(response.searches ?? []);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || 'Error al cargar búsquedas guardadas.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (searchId: string) => {
    setDeleting(searchId);
    try {
      await deleteSavedSearch(searchId);
      setSearches((prev) => prev.filter((s) => s.id !== searchId));
    } catch {
      // Ignore — user can retry
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleAlert = async (searchId: string, currentState: boolean) => {
    setToggling(searchId);
    // Optimistic update
    setSearches((prev) =>
      prev.map((s) => (s.id === searchId ? { ...s, alert_enabled: !currentState } : s))
    );
    try {
      await toggleAlert(searchId, !currentState);
    } catch {
      // Rollback
      setSearches((prev) =>
        prev.map((s) => (s.id === searchId ? { ...s, alert_enabled: currentState } : s))
      );
    } finally {
      setToggling(null);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-paper-container animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 rounded bg-paper-container animate-pulse" />
              <div className="h-5 w-5 rounded bg-paper-container animate-pulse" />
            </div>
            <div className="h-4 w-64 rounded bg-paper-container animate-pulse" />
            <div className="flex gap-4">
              <div className="h-3 w-24 rounded bg-paper-container animate-pulse" />
              <div className="h-3 w-20 rounded bg-paper-container animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.h1
          suppressHydrationWarning
          variants={itemVariants}
          className="text-2xl font-bold text-ink"
        >
          Búsquedas Guardadas
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-error-container p-6"
        >
          <p className="text-error text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Empty state ──
  if (searches.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.h1
          suppressHydrationWarning
          variants={itemVariants}
          className="text-2xl font-bold text-ink"
        >
          Búsquedas Guardadas
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-paper-dim p-12 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-olive-container mx-auto mb-4">
            <Search size={24} className="text-olive" />
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2" suppressHydrationWarning>
            No tenés búsquedas guardadas
          </h2>
          <p className="text-sm text-ink-muted max-w-sm mx-auto mb-6">
            Guardá tus búsquedas frecuentes para repetirlas rápido y recibir alertas cuando bajen los precios.
          </p>
          <a
            href="/hotels"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-coral text-white text-sm font-semibold hover:bg-coral-hover transition-colors"
          >
            <Search size={16} />
            Buscar hoteles
          </a>
        </motion.div>
      </motion.div>
    );
  }

  // ── List ──
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.h1
        suppressHydrationWarning
        variants={itemVariants}
        className="text-2xl font-bold text-ink"
      >
        Búsquedas Guardadas
      </motion.h1>

      <div className="space-y-3">
        <AnimatePresence>
          {searches.map((search) => (
            <motion.div
              key={search.id}
              variants={itemVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-paper-outline bg-paper-dim p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ink truncate" suppressHydrationWarning>
                    {search.name || 'Búsqueda sin nombre'}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">
                    {summarizeParams(search.parameters)}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-ink-faint">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(search.last_executed_at)}
                    </span>
                    {search.result_count !== null && (
                      <span className="flex items-center gap-1">
                        <Hash size={12} />
                        {search.result_count} resultados
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Alert toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleAlert(search.id, search.alert_enabled)}
                    disabled={toggling === search.id}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      search.alert_enabled
                        ? 'text-olive bg-olive-container hover:bg-olive-container/80'
                        : 'text-ink-faint hover:text-ink hover:bg-paper-container'
                    }`}
                    aria-label={
                      search.alert_enabled
                        ? 'Desactivar alerta'
                        : 'Activar alerta'
                    }
                    title={
                      search.alert_enabled
                        ? 'Alertas activadas'
                        : 'Alertas desactivadas'
                    }
                  >
                    {search.alert_enabled ? (
                      <Bell size={14} />
                    ) : (
                      <BellOff size={14} />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(search.id)}
                    disabled={deleting === search.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                    aria-label="Eliminar búsqueda"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
