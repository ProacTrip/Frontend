// app/busqueda-ai/components/BusquedaAISkeleton.tsx
// Suspense fallback — dual-panel ghost layout matching the real grid

export default function BusquedaAISkeleton() {
  return (
    <div className="min-h-screen bg-white pt-[72px]">
      <div className="grid lg:grid-cols-[380px_1fr] max-lg:grid-cols-1 h-[calc(100vh-72px)]">
        {/* Left panel: sidebar skeleton */}
        <aside className="border-r border-[#e8e8e8] bg-[#F5F5F5] p-6 flex flex-col gap-4 max-lg:h-auto max-lg:min-h-[60vh]">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#e8e8e8] animate-pulse" />
              <div>
                <div className="h-4 w-28 bg-[#e8e8e8] rounded animate-pulse" />
                <div className="h-3 w-20 bg-[#e8e8e8] rounded mt-1.5 animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-16 bg-[#e8e8e8] rounded animate-pulse" />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e8e8e8]" />

          {/* Message skeletons */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="h-16 w-3/4 bg-[#e8e8e8] rounded-2xl rounded-br-sm animate-pulse" />
            </div>

            {/* AI bubble */}
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-[#e8e8e8] flex-shrink-0 animate-pulse" />
              <div className="h-24 w-4/5 bg-[#e8e8e8] rounded-2xl rounded-bl-sm animate-pulse" />
            </div>

            {/* Second user bubble */}
            <div className="flex justify-end">
              <div className="h-12 w-1/2 bg-[#e8e8e8] rounded-2xl rounded-br-sm animate-pulse" />
            </div>

            {/* Second AI bubble */}
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-[#e8e8e8] flex-shrink-0 animate-pulse" />
              <div className="h-20 w-2/3 bg-[#e8e8e8] rounded-2xl rounded-bl-sm animate-pulse" />
            </div>
          </div>

          {/* Input skeleton */}
          <div className="h-12 w-full bg-[#e8e8e8] rounded-xl animate-pulse" />
        </aside>

        {/* Right panel: results skeleton */}
        <main className="p-6 flex flex-col gap-4 max-lg:mt-4">
          {/* Tab bar skeleton */}
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-[#e8e8e8] rounded-full animate-pulse" />
            <div className="h-9 w-24 bg-[#e8e8e8] rounded-full animate-pulse" />
            <div className="h-9 w-24 bg-[#e8e8e8] rounded-full animate-pulse" />
          </div>

          {/* Filter bar skeleton */}
          <div className="h-10 w-full bg-[#e8e8e8] rounded-lg animate-pulse" />

          {/* Results heading skeleton */}
          <div className="h-6 w-48 bg-[#e8e8e8] rounded animate-pulse" />

          {/* Result card skeletons */}
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 w-full bg-[#e8e8e8] rounded-2xl animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
