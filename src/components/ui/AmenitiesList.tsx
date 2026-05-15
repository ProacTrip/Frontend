'use client';

interface AmenitiesListProps {
  /** List of amenity labels (e.g., ["WiFi gratis", "Piscina", "Desayuno incluido"]). Null-safe — treated as empty. */
  amenities: string[] | null;
  /** Maximum number of amenities to show before "+N más" overflow (default 4) */
  max?: number;
}

export default function AmenitiesList({ amenities: rawAmenities, max = 4 }: AmenitiesListProps) {
  const amenities = rawAmenities ?? [];
  const visible = amenities.slice(0, max);
  const overflow = amenities.length - visible.length;

  if (amenities.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((amenity) => (
        <span
          key={amenity}
          className="inline-flex items-center rounded-full bg-paper-container px-2.5 py-1 text-xs font-medium text-ink-muted whitespace-nowrap"
        >
          {amenity}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-full bg-paper-outline/50 px-2 py-1 text-xs font-medium text-ink-faint whitespace-nowrap">
          +{overflow} más
        </span>
      )}
    </div>
  );
}
