'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Building2, Plane, MapPin, Hotel, Search } from 'lucide-react';
import { useFavorites } from '@/lib/hooks/useFavorites';
import type { Favorite, EntityType } from '@/lib/api/types';

// ── Entity type config ──

const ENTITY_LABELS: Record<EntityType, string> = {
  hotel: 'Hoteles',
  flight: 'Vuelos',
  destination: 'Destinos',
};

const ENTITY_ICONS: Record<EntityType, React.ComponentType<{ size?: number; className?: string }>> = {
  hotel: Building2,
  flight: Plane,
  destination: MapPin,
};

// ── Animations ──

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ── Group favorites by entity_type ──

function groupByType(favorites: Favorite[]): Record<string, Favorite[]> {
  const groups: Record<string, Favorite[]> = {};
  for (const fav of favorites) {
    const key = fav.entity_type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(fav);
  }
  return groups;
}

function formatDate(iso: string): string {
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

// ── Component ──

export default function FavoritesPage() {
  const { favorites, isLoading, error, removeFavorite, refresh } = useFavorites();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (favoriteId: string) => {
    setDeleting(favoriteId);
    try {
      await removeFavorite(favoriteId);
    } catch {
      // Error is handled by the hook
    } finally {
      setDeleting(null);
    }
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-paper-container animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-3"
          >
            <div className="h-5 w-32 rounded bg-paper-container animate-pulse" />
            <div className="h-4 w-48 rounded bg-paper-container animate-pulse" />
            <div className="h-4 w-24 rounded bg-paper-container animate-pulse" />
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
          Mis Favoritos
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-error-container p-6"
        >
          <p className="text-error text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Empty state ──
  if (favorites.length === 0) {
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
          Mis Favoritos
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-paper-dim p-12 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-coral-container mx-auto mb-4">
            <Heart size={24} className="text-coral" />
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2" suppressHydrationWarning>
            Todavía no tenés favoritos
          </h2>
          <p className="text-sm text-ink-muted max-w-sm mx-auto mb-6">
            Guardá hoteles, vuelos y destinos que te gusten tocando el ícono de corazón. Acá los vas a encontrar todos juntos.
          </p>
          <a
            href="/hotels"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-coral text-white text-sm font-semibold hover:bg-coral-hover transition-colors"
          >
            <Search size={16} />
            Explorar hoteles
          </a>
        </motion.div>
      </motion.div>
    );
  }

  // ── Grouped view ──
  const groups = groupByType(favorites);
  const orderedTypes: EntityType[] = ['hotel', 'flight', 'destination'];

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
        Mis Favoritos
      </motion.h1>

      {orderedTypes.map((type) => {
        const items = groups[type];
        if (!items || items.length === 0) return null;

        const Icon = ENTITY_ICONS[type];
        const label = ENTITY_LABELS[type];

        return (
          <motion.section key={type} variants={itemVariants} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon size={18} className="text-ink-muted" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint" suppressHydrationWarning>
                {label}
              </h2>
              <span className="text-xs text-ink-faint">({items.length})</span>
            </div>

            <div className="grid gap-3">
              <AnimatePresence>
                {items.map((fav) => (
                  <motion.div
                    key={fav.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start justify-between gap-4 rounded-lg border border-paper-outline bg-paper-dim p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Heart size={14} className="text-coral shrink-0" />
                        <h3 className="text-sm font-semibold text-ink truncate" suppressHydrationWarning>
                          {fav.title}
                        </h3>
                      </div>
                      {fav.notes && (
                        <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                          {fav.notes}
                        </p>
                      )}
                      <p className="text-xs text-ink-faint mt-1">
                        Guardado el {formatDate(fav.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(fav.id)}
                      disabled={deleting === fav.id}
                      className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:text-error hover:bg-error-container transition-colors disabled:opacity-50"
                      aria-label={`Eliminar ${fav.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}
