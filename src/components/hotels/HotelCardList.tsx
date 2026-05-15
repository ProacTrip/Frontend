'use client';

import type { HotelSearchResult } from '@/lib/types/search';
import HotelCard from './HotelCard';

interface HotelCardListProps {
  /** Array of hotel search results to render. Null-safe — renders nothing when null/empty. */
  properties: HotelSearchResult[] | null;
  /** Optional callback when a hotel card is clicked. Receives property ID. */
  onPropertyClick?: (id: string) => void;
}

/**
 * Responsive grid of HotelCard components.
 *
 * Desktop (lg): 3 columns
 * Tablet (sm-md): 2 columns
 * Mobile: 1 column
 *
 * Renders nothing when properties array is empty — parent component
 * handles empty state display via StateBanners.
 */
export default function HotelCardList({
  properties,
  onPropertyClick,
}: HotelCardListProps) {
  if (!properties || properties.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {properties.map((property) => (
        <div
          key={property.id}
          onClick={() => onPropertyClick?.(property.id)}
          role={onPropertyClick ? 'button' : undefined}
          tabIndex={onPropertyClick ? 0 : undefined}
          onKeyDown={
            onPropertyClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPropertyClick(property.id);
                  }
                }
              : undefined
          }
          className={onPropertyClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-coral rounded-xl' : ''}
        >
          <HotelCard hotel={property} />
        </div>
      ))}
    </div>
  );
}
