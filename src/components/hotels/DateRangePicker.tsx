'use client';

interface DateRangePickerProps {
  /** Check-in date in YYYY-MM-DD format */
  checkIn: string;
  /** Check-out date in YYYY-MM-DD format */
  checkOut: string;
  /** Check-in change handler */
  onCheckInChange: (value: string) => void;
  /** Check-out change handler */
  onCheckOutChange: (value: string) => void;
  /** Error message override */
  error?: string;
}

/** Returns today's date as YYYY-MM-DD string */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  error,
}: DateRangePickerProps) {
  const isInvalid =
    checkIn && checkOut && checkOut <= checkIn;

  return (
    <div className="flex flex-col gap-1.5 font-[family-name:var(--font-geist-sans)]">
      <label className="text-xs font-medium text-ink-muted">Fechas</label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="date"
            value={checkIn}
            onChange={(e) => onCheckInChange(e.target.value)}
            min={todayStr()}
            className={`w-full rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors font-[family-name:var(--font-geist-sans)] ${
              isInvalid || error
                ? 'border-error'
                : 'border-paper-outline focus:border-coral focus:ring-1 focus:ring-coral/30'
            }`}
            aria-label="Fecha de entrada"
          />
        </div>
        <span className="text-ink-faint text-xs shrink-0">—</span>
        <div className="flex-1">
          <input
            type="date"
            value={checkOut}
            onChange={(e) => onCheckOutChange(e.target.value)}
            min={checkIn || todayStr()}
            className={`w-full rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors font-[family-name:var(--font-geist-sans)] ${
              isInvalid || error
                ? 'border-error'
                : 'border-paper-outline focus:border-coral focus:ring-1 focus:ring-coral/30'
            }`}
            aria-label="Fecha de salida"
          />
        </div>
      </div>
      {(isInvalid || error) && (
        <p className="text-xs text-error" role="alert">
          {error || 'La fecha de salida debe ser posterior a la de entrada'}
        </p>
      )}
    </div>
  );
}
