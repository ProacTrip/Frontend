export default function SearchesLoading() {
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
