'use client';

import { useRef, useState, useEffect } from 'react';
import { Minus, Plus, Users } from 'lucide-react';

interface GuestSelectorProps {
  /** Number of adults (min 1) */
  adults: number;
  /** Number of children (min 0) */
  children: number;
  /** Ages of children (one per child, 1-17) */
  childrenAges: number[];
  /** Change handler */
  onChange: (state: { adults: number; children: number; childrenAges: number[] }) => void;
  /** Error message */
  error?: string;
}

const MIN_ADULTS = 1;
const MAX_ADULTS = 10;
const MIN_CHILDREN = 0;
const MAX_CHILDREN = 6;
const CHILD_MIN_AGE = 1;
const CHILD_MAX_AGE = 17;

export default function GuestSelector({
  adults,
  children,
  childrenAges,
  onChange,
  error,
}: GuestSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const total = adults + children;
  const label = `${total} huésped${total !== 1 ? 'es' : ''}`;

  function updateAdults(delta: number) {
    const next = Math.max(MIN_ADULTS, Math.min(MAX_ADULTS, adults + delta));
    onChange({ adults: next, children, childrenAges });
  }

  function updateChildren(delta: number) {
    const next = Math.max(MIN_CHILDREN, Math.min(MAX_CHILDREN, children + delta));
    // Trim or extend childrenAges to match new child count
    let nextAges = childrenAges;
    if (next < childrenAges.length) {
      nextAges = childrenAges.slice(0, next);
    } else if (next > childrenAges.length) {
      nextAges = [...childrenAges, CHILD_MIN_AGE];
    }
    onChange({ adults, children: next, childrenAges: nextAges });
  }

  function updateChildAge(index: number, age: number) {
    const nextAges = [...childrenAges];
    // Clamp to valid range
    nextAges[index] = isNaN(age) ? 0 : Math.max(CHILD_MIN_AGE, Math.min(CHILD_MAX_AGE, age));
    onChange({ adults, children, childrenAges: nextAges });
  }

  // Sync childrenAges length when children changes externally
  useEffect(() => {
    if (childrenAges.length !== children) {
      const synced = children > childrenAges.length
        ? [...childrenAges, ...Array(children - childrenAges.length).fill(CHILD_MIN_AGE)]
        : childrenAges.slice(0, children);
      onChange({ adults, children, childrenAges: synced });
    }
    // Only run when children count diverges from ages length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  // Check for children ages mismatch
  const agesMismatch = children > 0 && childrenAges.length !== children;

  return (
    <div
      className="relative flex flex-col gap-1.5 font-[family-name:var(--font-geist-sans)]"
      ref={containerRef}
    >
      <label className="text-xs font-medium text-ink-muted">Huéspedes</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink transition-colors ${
          open
            ? 'border-coral ring-1 ring-coral/30'
            : error || agesMismatch
              ? 'border-error'
              : 'border-paper-outline hover:border-paper-outline'
        }`}
      >
        <Users size={18} className="shrink-0 text-ink-faint" />
        <span className="flex-1 text-left">{label}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full min-w-[260px] rounded-xl border border-paper-outline bg-paper shadow-lg p-4 space-y-4">
          {/* Adults */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Adultos</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateAdults(-1)}
                disabled={adults <= MIN_ADULTS}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-outline text-ink transition-colors hover:bg-paper-dim disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Menos adultos"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-medium text-ink">{adults}</span>
              <button
                type="button"
                onClick={() => updateAdults(1)}
                disabled={adults >= MAX_ADULTS}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-outline text-ink transition-colors hover:bg-paper-dim disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Más adultos"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Niños</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateChildren(-1)}
                disabled={children <= MIN_CHILDREN}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-outline text-ink transition-colors hover:bg-paper-dim disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Menos niños"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-medium text-ink">{children}</span>
              <button
                type="button"
                onClick={() => updateChildren(1)}
                disabled={children >= MAX_CHILDREN}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-paper-outline text-ink transition-colors hover:bg-paper-dim disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Más niños"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Children ages */}
          {children > 0 && (
            <div className="space-y-2 border-t border-paper-outline pt-3">
              <span className="text-xs font-medium text-ink-muted">
                Edad de los niños al viajar
              </span>
              {childrenAges.slice(0, children).map((age, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted w-20">Niño {i + 1}</span>
                  <select
                    value={age}
                    onChange={(e) => updateChildAge(i, parseInt(e.target.value, 10))}
                    className="flex-1 rounded-md border border-paper-outline bg-paper px-2 py-1.5 text-sm text-ink outline-none focus:border-coral"
                  >
                    {Array.from({ length: CHILD_MAX_AGE }, (_, a) => (
                      <option key={a + 1} value={a + 1}>
                        {a + 1} {a === 0 ? 'año' : 'años'}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-lg bg-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coral-hover"
          >
            Listo
          </button>
        </div>
      )}

      {(error || agesMismatch) && (
        <p className="text-xs text-error" role="alert">
          {error || 'Seleccioná la edad de cada niño'}
        </p>
      )}
    </div>
  );
}
