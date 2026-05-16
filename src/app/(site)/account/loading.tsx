export default function AccountLoading() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <div className="h-8 w-40 rounded-lg bg-paper-container animate-pulse" />
      {/* Card skeleton */}
      <div className="rounded-xl border border-paper-outline bg-paper-dim p-6 space-y-4">
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
