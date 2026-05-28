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
    <div className="rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg hover:border-neutral-300">
      {/* ── Card Row ── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`flight-detail-${offer.booking_token || offer.departure_token}`}
        onClick={() => onToggle(offer)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 rounded-2xl"
      >
        {/* Airline logo */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
          {airline.logoUrl ? (
            <Image
              src={airline.logoUrl}
              alt={airline.name}
              width={40}
              height={40}
              className="object-contain"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-medium">
              {airline.code}
            </div>
          )}
        </div>

        {/* Departure → Arrival (CEEPII-style: compact flowing text) */}
        <div className="flex-1 min-w-0">
          {/* Times + Airports — single flowing line */}
          <div className="text-sm sm:text-base font-medium text-neutral-900 leading-snug">
            <span className="font-semibold tabular-nums">{formatTime(firstLeg?.departure?.datetime)}</span>
            {' '}{firstLeg?.departure?.airport_code}{' '}
            <span className="font-semibold tabular-nums">{formatTime(lastLeg?.arrival?.datetime)}</span>
            {' '}{lastLeg?.arrival?.airport_code}
          </div>
          {/* Airline + Stops + Duration — compact badges line */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
            <span className="text-[12px] text-neutral-500">{airline.name}</span>
            <span className="text-neutral-300 text-[10px]">·</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
              (offer.layovers?.length || 0) === 0
                ? 'bg-green-50 text-green-700'
                : 'bg-neutral-100 text-neutral-600'
            }`}>
              {stopsLabel(offer)}
            </span>
            <span className="text-neutral-300 text-[10px]">·</span>
            <span className="text-[12px] text-neutral-500">{formatDuration(offer.total_duration_minutes)}</span>
            {offer.layovers && offer.layovers.length > 0 && offer.layovers[0]?.airport_code && (
              <>
                <span className="text-neutral-300 text-[10px]">·</span>
                <span className="text-[12px] text-neutral-500">{offer.layovers[0].airport_code}</span>
              </>
            )}
            {hasOvernight && <Moon className="w-3.5 h-3.5 text-amber-500 ml-0.5" aria-label="Vuelo nocturno" />}
            {isOftenDelayed && (
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 ml-0.5" aria-label="Suele retrasarse" />
            )}
          </div>
        </div>

        {/* Price + chevron — right aligned compact */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-sm sm:text-base font-semibold text-neutral-900 tabular-nums">
              {formatPrice(offer.price.amount, offer.price.currency)}
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-[0.38s] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
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
