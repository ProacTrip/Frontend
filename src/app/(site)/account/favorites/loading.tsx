export default function FavoritesLoading() {
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
