'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getProfile } from '@/lib/api/user';
import type { GetProfileResponse } from '@/lib/api/types';
import { AvatarSection } from '@/components/account/AvatarSection';
import { ProfileForm } from '@/components/account/ProfileForm';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function AccountPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<GetProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getProfile();
        if (!cancelled) setProfile(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const detail = (err as { detail?: string; message?: string })?.detail
            || (err as { message?: string })?.message
            || 'Error al cargar el perfil.';
          setError(detail);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded-lg bg-paper-container animate-pulse" />
        <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-paper-container animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 rounded bg-paper-container animate-pulse" />
              <div className="h-4 w-24 rounded bg-paper-container animate-pulse" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-paper-container animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-paper-container animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
          Mi Perfil
        </motion.h1>
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-paper-outline bg-error-container p-6"
        >
          <p className="text-error text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 text-sm font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </motion.div>
      </motion.div>
    );
  }

  if (!profile) return null;

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
        Mi Perfil
      </motion.h1>

      <motion.div variants={itemVariants}>
        <AvatarSection
          avatarUrl={profile.avatar_url}
          firstName={profile.first_name}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ProfileForm
          profile={profile}
          email={user?.email ?? profile.email}
        />
      </motion.div>
    </motion.div>
  );
}
