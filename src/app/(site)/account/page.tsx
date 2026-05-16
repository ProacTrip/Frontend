export default function AccountPage() {
  return (
    <div className="space-y-6">
      <h1 suppressHydrationWarning className="text-2xl font-bold text-ink">
        Mi Perfil
      </h1>
      <div className="rounded-xl border border-paper-outline bg-paper-dim p-8 text-center">
        <p className="text-ink-muted text-sm">
          Cargando tu perfil...
        </p>
      </div>
    </div>
  );
}
