export default function MedicalLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg bg-paper-container animate-pulse" />
      <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 rounded bg-paper-container animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-paper-container animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
