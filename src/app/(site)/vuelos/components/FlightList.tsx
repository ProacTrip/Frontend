'use client';

import { useState, useCallback, useEffect } from 'react';
import FlightCard from './FlightCard';
import type { FlightOffer } from '@/app/lib/types/flight';

interface FlightListProps {
  offers: FlightOffer[];
  onSelectOutbound?: (offer: FlightOffer) => void;
  phase?: string;
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
}

export default function FlightList({
  offers,
  onSelectOutbound,
  phase,
  routeParams,
  adults,
  currency,
}: FlightListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback(
    (offer: FlightOffer) => {
      const id = offer.booking_token || offer.departure_token || null;
      setExpandedId((prev) => (prev === id ? null : id));
      // Expand does NOT auto-select in outbound_selection — selection is via the detail panel button
    },
    [],
  );

  // Escape key collapses detail panel
  useEffect(() => {
    if (!expandedId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedId(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [expandedId]);

  if (!offers.length) return null;

  return (
    <div className="space-y-3">
      {offers.map((offer, index) => {
        const id = offer.booking_token || offer.departure_token || `offer-${index}`;
        const isExpanded = expandedId === id;

        return (
          <FlightCard
            key={id}
            offer={offer}
            isExpanded={isExpanded}
            onToggle={(o) => handleToggle(o)}
            routeParams={routeParams}
            adults={adults}
            currency={currency}
            onSelectOutbound={onSelectOutbound}
            showSelectButton={phase === 'outbound_selection' && !!offer.departure_token}
          />
        );
      })}
    </div>
  );
}
