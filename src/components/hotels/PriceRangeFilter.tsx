'use client';

interface PriceRangeFilterProps {
  /** Minimum price per night (undefined = no min) */
  minPrice?: number;
  /** Maximum price per night (undefined = no max) */
  maxPrice?: number;
  /** Called when min changes */
  onMinChange: (value: number | undefined) => void;
  /** Called when max changes */
  onMaxChange: (value: number | undefined) => void;
}

export default function PriceRangeFilter({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: PriceRangeFilterProps) {
  const isInvalid =
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice;

  function handleMinChange(raw: string) {
    const n = raw === '' ? undefined : Math.max(0, parseInt(raw, 10));
    onMinChange(n);
  }

  function handleMaxChange(raw: string) {
    const n = raw === '' ? undefined : Math.max(0, parseInt(raw, 10));
    onMaxChange(n);
  }

  return (
    <div className="flex flex-col gap-2 font-[family-name:var(--font-geist-sans)]">
      <span className="text-sm font-semibold text-ink">Rango de precio</span>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
            €
          </span>
          <input
            type="number"
            min={0}
            value={minPrice ?? ''}
            onChange={(e) => handleMinChange(e.target.value)}
            placeholder="Mín"
            className={`w-full rounded-lg border bg-paper pl-7 pr-3 py-2 text-sm text-ink outline-none transition-colors ${
              isInvalid
                ? 'border-error'
                : 'border-paper-outline focus:border-coral focus:ring-1 focus:ring-coral/30'
            }`}
            aria-label="Precio mínimo por noche"
          />
        </div>
        <span className="text-ink-faint text-xs">—</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
            €
          </span>
          <input
            type="number"
            min={0}
            value={maxPrice ?? ''}
            onChange={(e) => handleMaxChange(e.target.value)}
            placeholder="Máx"
            className={`w-full rounded-lg border bg-paper pl-7 pr-3 py-2 text-sm text-ink outline-none transition-colors ${
              isInvalid
                ? 'border-error'
                : 'border-paper-outline focus:border-coral focus:ring-1 focus:ring-coral/30'
            }`}
            aria-label="Precio máximo por noche"
          />
        </div>
      </div>
      {isInvalid && (
        <p className="text-xs text-error" role="alert">
          El precio mínimo debe ser menor o igual que el máximo
        </p>
      )}
    </div>
  );
}
