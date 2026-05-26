'use client';

import { useCallback, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { ChevronDown, Moon, AlertTriangle } from 'lucide-react';
import type { FlightOffer } from '@/app/lib/types/flight';
import FlightDetailPanel from './FlightDetailPanel';

interface FlightCardProps {
  offer: FlightOffer;
  isExpanded: boolean;
  onToggle: (offer: FlightOffer) => void;
  /** Route params for flight-details fetch */
  routeParams?: {
    departure: string;
    arrival: string;
    outbound_date: string;
    return_date?: string;
    hl?: string;
    gl?: string;
  };
  adults?: number;
  currency?: string;
  onSelectOutbound?: (offer: FlightOffer) => void;
  showSelectButton?: boolean;
}

// ─── Format helpers ──────────────────────────────────

function formatTime(datetime: string | undefined): string {
  if (!datetime) return '--:--';
  const parts = datetime.split(' ');
  return parts.length === 2 ? parts[1].substring(0, 5) : datetime.substring(11, 16);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('es-ES')}`;
  }
}

function stopsLabel(offer: FlightOffer): string {
  const count = offer.layovers?.length || 0;
  if (count === 0) return 'Directo';
  if (count === 1) return '1 escala';
  return `${count} escalas`;
}

// ─── Carrier from first leg ──────────────────────────
function primaryAirline(offer: FlightOffer): { name: string; code: string; logoUrl: string } {
  const firstLeg = offer.legs?.[0];
  return {
    name: firstLeg?.airline || 'Unknown',
    code: firstLeg?.airline_code || 'XX',
    logoUrl: firstLeg?.airline_logo_url || offer.airline_logo_url || '',
  };
}

// ─── Component ───────────────────────────────────────

export default function FlightCard({
  offer,
  isExpanded,
  onToggle,
  routeParams,
  adults,
  currency,
  onSelectOutbound,
  showSelectButton,
}: FlightCardProps) {
  const airline = primaryAirline(offer);
  const firstLeg = offer.legs?.[0];
  const lastLeg = offer.legs?.[offer.legs.length - 1];
  const hasOvernight = offer.legs?.some((l) => l.overnight);
  const isOftenDelayed = offer.legs?.some((l) => l.often_delayed);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(offer);
      }
    },
    [offer, onToggle],
  );

  return (
    <div className="rounded-[16px] border border-vuelos-border bg-white transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      {/* ── Card Row ── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`flight-detail-${offer.booking_token || offer.departure_token}`}
        onClick={() => onToggle(offer)}
        onKeyDown={handleKeyDown}
        className={`flex items-center gap-4 px-5 py-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 rounded-[16px]`}
      >
        {/* Logo */}
        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
          {airline.logoUrl ? (
            <Image
              src={airline.logoUrl}
              alt={airline.name}
              width={40}
              height={40}
              className="object-contain"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-vuelos-surface flex items-center justify-center text-xs text-vuelos-muted font-medium">
              {airline.code}
            </div>
          )}
        </div>

        {/* Times + Airline */}
        <div className="min-w-0 shrink-0 w-[120px]">
          <div className="font-[family-name:var(--font-syne)] text-[15px] font-semibold text-vuelos-black">
            {formatTime(firstLeg?.departure?.datetime)}
            {' \u2013 '}
            {formatTime(lastLeg?.arrival?.datetime)}
          </div>
          <div className="text-[12.5px] text-vuelos-muted truncate">{airline.name}</div>
        </div>

        {/* Route + Duration */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-vuelos-black">
            {firstLeg?.departure?.airport_code} → {lastLeg?.arrival?.airport_code}
          </div>
          <div className="text-[12px] text-vuelos-muted">{formatDuration(offer.total_duration_minutes)}</div>
        </div>

        {/* Stops + Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[12.5px] font-medium text-vuelos-muted">{stopsLabel(offer)}</span>
          {hasOvernight && <Moon className="w-3.5 h-3.5 text-vuelos-muted" aria-label="Vuelo nocturno" />}
          {isOftenDelayed && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" aria-label="Suele retrasarse" />
          )}
        </div>

        {/* Price */}
        <div className="text-right shrink-0 min-w-[90px]">
          <div className="font-[family-name:var(--font-syne)] text-[15px] font-bold text-vuelos-black">
            {formatPrice(offer.price.amount, offer.price.currency)}
          </div>
          <div className="text-[11.5px] text-vuelos-muted">por persona</div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-5 h-5 text-vuelos-muted shrink-0 transition-transform duration-[0.38s] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* ── Expandable Detail Panel ── */}
      <FlightDetailPanel
        offer={offer}
        isExpanded={isExpanded}
        booking_token={offer.booking_token}
        routeParams={routeParams}
        adults={adults}
        currency={currency}
        onSelect={onSelectOutbound ? () => onSelectOutbound(offer) : undefined}
        showSelectButton={showSelectButton}
      />
    </div>
  );
}
