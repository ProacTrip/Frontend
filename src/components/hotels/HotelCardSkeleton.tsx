/**
 * HotelCardSkeleton — Loading placeholder matching HotelCard layout.
 *
 * Uses Tailwind animate-pulse with paper palette surface-container colors.
 * No framer-motion needed — CSS animation is sufficient for skeletons.
 */

interface HotelCardSkeletonProps {
  /** Number of skeleton cards to render (default 1) */
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-paper-outline bg-paper-dim">
      {/* Image placeholder */}
      <div className="aspect-[4/3] w-full animate-pulse bg-paper-container" />

      {/* Content placeholder */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title line 1 */}
        <div className="h-4 w-3/4 animate-pulse rounded bg-paper-container" />
        {/* Title line 2 (shorter) */}
        <div className="h-4 w-1/2 animate-pulse rounded bg-paper-container" />

        {/* Stars placeholder */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-3 w-3 animate-pulse rounded-sm bg-paper-container" />
          ))}
        </div>

        {/* Location placeholder */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 animate-pulse rounded-full bg-paper-container" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-paper-container" />
        </div>

        {/* Rating placeholder */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-8 animate-pulse rounded bg-paper-container" />
          <div className="h-3 w-24 animate-pulse rounded bg-paper-container" />
        </div>

        {/* Amenity chips placeholder */}
        <div className="flex flex-wrap gap-1.5">
          <div className="h-6 w-20 animate-pulse rounded-full bg-paper-container" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-paper-container" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-paper-container" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price + button row */}
        <div className="flex items-end justify-between pt-2 border-t border-paper-outline">
          <div className="flex flex-col gap-1 items-end">
            <div className="h-4 w-20 animate-pulse rounded bg-paper-container" />
            <div className="h-3 w-14 animate-pulse rounded bg-paper-container" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-lg bg-paper-container" />
        </div>
      </div>
    </div>
  );
}

export default function HotelCardSkeleton({ count = 1 }: HotelCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </>
  );
}
