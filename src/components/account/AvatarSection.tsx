'use client';

import { User } from 'lucide-react';

interface AvatarSectionProps {
  avatarUrl: string | null;
  firstName: string | null;
}

export function AvatarSection({ avatarUrl, firstName }: AvatarSectionProps) {
  const displayName = firstName ?? 'Usuario';

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-paper-outline bg-paper-dim">
      {/* Avatar image */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-paper-container border-2 border-paper-outline shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`Avatar de ${displayName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-faint">
            <User size={40} />
          </div>
        )}
      </div>

      {/* Info + action */}
      <div className="flex-1 text-center sm:text-left">
        <h2 suppressHydrationWarning className="text-lg font-semibold text-ink">
          {displayName}
        </h2>
        <p className="text-sm text-ink-muted">Tu foto de perfil</p>
      </div>

      <button
        type="button"
        disabled
        className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg border border-paper-outline text-ink-muted bg-paper cursor-not-allowed opacity-50"
        title="Próximamente disponible"
      >
        Cambiar foto
      </button>
    </div>
  );
}
