export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg bg-paper-container animate-pulse" />
      <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 w-full rounded-lg bg-paper-container animate-pulse" />
        ))}
      </div>
    </div>
  );
}
