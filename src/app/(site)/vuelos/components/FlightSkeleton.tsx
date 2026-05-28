'use client';

/**
 * FlightSkeleton — Suspense fallback for vuelos search results.
 * Renders 5 pulsing gray rows matching the FlightCard grid layout.
 * Staggered animation via animation-delay cascade.
 */
export default function FlightSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white p-4 animate-pulse"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo placeholder */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100 shrink-0" />

            {/* Main content — compact single line */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {/* Times + Airports */}
              <div className="h-4 w-full max-w-[260px] rounded bg-neutral-100" />
              {/* Airline + stops + duration */}
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-20 rounded bg-neutral-100" />
                <div className="h-5 w-14 rounded-full bg-neutral-100" />
                <div className="h-3.5 w-10 rounded bg-neutral-100" />
              </div>
            </div>

            {/* Price */}
            <div className="shrink-0">
              <div className="h-5 w-14 rounded bg-neutral-100 ml-auto" />
            </div>

            {/* Chevron */}
            <div className="w-5 h-5 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
