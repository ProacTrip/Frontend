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
          className="rounded-[16px] border border-vuelos-border bg-white p-4 animate-pulse"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div className="flex items-center gap-4">
            {/* Logo placeholder */}
            <div className="w-10 h-10 rounded-full bg-vuelos-skeleton" />

            {/* Times + airline */}
            <div className="space-y-1.5">
              <div className="h-5 w-24 rounded bg-vuelos-skeleton" />
              <div className="h-3 w-16 rounded bg-vuelos-skeleton" />
            </div>

            {/* Route + duration */}
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 rounded bg-vuelos-skeleton mx-auto" />
              <div className="h-3 w-20 rounded bg-vuelos-skeleton mx-auto" />
            </div>

            {/* Stops */}
            <div className="h-5 w-16 rounded-full bg-vuelos-skeleton" />

            {/* Price */}
            <div className="space-y-1.5 shrink-0">
              <div className="h-5 w-20 rounded bg-vuelos-skeleton ml-auto" />
              <div className="h-3 w-12 rounded bg-vuelos-skeleton ml-auto" />
            </div>

            {/* Chevron */}
            <div className="w-5 h-5 rounded bg-vuelos-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
