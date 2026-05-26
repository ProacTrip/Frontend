'use client';

import { type ReactNode } from 'react';
import Image from 'next/image';
import { Wifi, Plug, Usb, MonitorPlay, Moon, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { FlightOffer, BookingOption } from '@/app/lib/types/flight';
import { getFlightDetails } from '@/app/lib/api/flights';

interface FlightDetailPanelProps {
  offer: FlightOffer;
  isExpanded: boolean;
  booking_token?: string;
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
  onSelect?: () => void;
  showSelectButton?: boolean;
}

// ─── Helpers ────────────────────────────────────────

function formatTime(datetime: string | undefined): string {
  if (!datetime) return '--:--';
  const parts = datetime.split(' ');
  return parts.length === 2 ? parts[1].substring(0, 5) : datetime.substring(11, 16);
}

function formatDate(datetime: string | undefined): string {
  if (!datetime) return '';
  const parts = datetime.split(' ');
  return parts[0] || '';
}

function formatDurationMins(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
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

function wifiIcon(feature: 'free' | 'paid' | null) {
  if (!feature) return null;
  return (
    <span className="flex items-center gap-1" title={feature === 'free' ? 'WiFi gratis' : 'WiFi de pago'}>
      <Wifi className="w-3.5 h-3.5" />
      {feature === 'paid' && <span className="text-[9px] font-bold text-amber-600">$</span>}
    </span>
  );
}

function amenityIcon(raw: string): { icon: ReactNode; label: string } | null {
  const lower = raw.toLowerCase();
  if (lower.includes('wifi') || lower.includes('wi-fi')) {
    return { icon: <Wifi className="w-3.5 h-3.5" />, label: raw };
  }
  if (lower.includes('power') || lower.includes('outlet') || lower.includes('enchufe')) {
    return { icon: <Plug className="w-3.5 h-3.5" />, label: raw };
  }
  if (lower.includes('usb')) {
    return { icon: <Usb className="w-3.5 h-3.5" />, label: raw };
  }
  if (lower.includes('entertainment') || lower.includes('video') || lower.includes('stream') || lower.includes('on-demand')) {
    return { icon: <MonitorPlay className="w-3.5 h-3.5" />, label: raw };
  }
  if (lower.includes('legroom') || lower.includes('space') || lower.includes('espacio')) {
    return { icon: <span className="text-[11px] font-medium">&#8614;</span>, label: raw };
  }
  if (lower.includes('emission') || lower.includes('carbon') || lower.includes('co2')) {
    return { icon: <span className="text-[11px] font-medium">CO2</span>, label: raw };
  }
  return null;
}

// ─── Booking Options Renderer ────────────────────────

function BookingOptionsSection({ options, currency }: { options: BookingOption[]; currency: string }) {
  if (!options || options.length === 0) return null;

  return (
    <div className="mt-5 pt-4 border-t border-vuelos-skeleton">
      <h4 className="font-[family-name:var(--font-syne)] text-[13px] font-semibold text-vuelos-black mb-3">
        Opciones de reserva
      </h4>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div
            key={idx}
            className="rounded-[10px] border border-vuelos-border bg-vuelos-subtle-bg p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {opt.together.airline_logos?.[0] && (
                  <Image
                    src={opt.together.airline_logos[0]}
                    alt={opt.together.book_with}
                    width={20}
                    height={20}
                    className="object-contain shrink-0"
                  />
                )}
                <span className="text-[12.5px] font-medium text-vuelos-black">
                  {opt.together.book_with}
                </span>
                {opt.together.airline && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                    Directa
                  </span>
                )}
              </div>
              <div className="text-[11.5px] text-vuelos-muted">
                {opt.together.option_title}
                {opt.together.baggage_prices?.length > 0 && (
                  <span className="ml-2">· {opt.together.baggage_prices[0]}</span>
                )}
              </div>
              {opt.separate_tickets && opt.departing && opt.returning && (
                <div className="text-[10.5px] text-vuelos-muted mt-0.5">
                  Ida ({opt.departing.book_with}: {formatPrice(opt.departing.price, currency)}) +{' '}
                  Vuelta ({opt.returning.book_with}: {formatPrice(opt.returning.price, currency)})
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-[family-name:var(--font-syne)] text-[14px] font-bold text-vuelos-black">
                {formatPrice(opt.together.price, currency)}
              </div>
              <span className="text-[10.5px] text-vuelos-muted">total</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────

function BookingOptionsSkeleton() {
  return (
    <div className="mt-5 pt-4 border-t border-vuelos-skeleton animate-pulse">
      <div className="h-4 w-36 bg-vuelos-border rounded mb-3" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-[10px] border border-vuelos-border bg-vuelos-subtle-bg p-3 flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-vuelos-timeline rounded" />
              <div className="h-3 w-40 bg-vuelos-border rounded" />
            </div>
            <div className="w-16">
              <div className="h-4 w-full bg-vuelos-timeline rounded mb-1" />
              <div className="h-3 w-8 bg-vuelos-border rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────

export default function FlightDetailPanel({
  offer,
  isExpanded,
  booking_token,
  routeParams,
  adults,
  currency,
  onSelect,
  showSelectButton,
}: FlightDetailPanelProps) {
  const legs = offer.legs || [];
  const layovers = offer.layovers || [];
  const detailId = `flight-detail-${offer.booking_token || offer.departure_token}`;

  // ── Fetch flight details when expanded and booking_token exists ──
  const {
    data: detailsData,
    isLoading: detailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: booking_token
      ? ['flights', 'detail', booking_token]
      : ['flights', 'detail'],
    queryFn: () =>
      getFlightDetails(
        booking_token!,
        adults,
        currency,
        routeParams,
      ),
    enabled: !!booking_token && isExpanded,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const bookingOptions = detailsData?.booking_options ?? [];

  return (
    <div
      id={detailId}
      className="grid"
      style={{
        gridTemplateRows: isExpanded ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="overflow-hidden">
        <div className="px-5 pb-5 pt-3 border-t border-vuelos-border">
          {/* ── Segments Timeline ── */}
          <div className="space-y-6">
            {legs.map((leg, i) => (
              <div key={`leg-${i}`}>
                {i > 0 && layovers[i - 1] && (
                  <div className="flex items-center gap-3 py-2 px-3">
                    {/* Dot connector */}
                    <div className="flex flex-col items-center shrink-0 w-4">
                      <div className="h-6 border-l-2 border-dashed border-vuelos-timeline" />
                    </div>
                    <div className="flex items-center gap-2 text-[12.5px] text-vuelos-muted">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {formatDurationMins(layovers[i - 1].duration_minutes)} en {layovers[i - 1].airport_code}
                        {layovers[i - 1].overnight && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-amber-600">
                            <Moon className="w-3 h-3" />
                            Nocturna
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Leg segment */}
                <div className="flex gap-4">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center shrink-0 w-4 pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-vuelos-black" />
                    <div className="flex-1 w-0.5 bg-vuelos-timeline min-h-[40px]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-vuelos-black" />
                  </div>

                  {/* Leg details */}
                  <div className="flex-1 min-w-0">
                    {/* Departure */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="font-[family-name:var(--font-syne)] text-[14px] font-semibold text-vuelos-black">
                          {formatTime(leg.departure?.datetime)}
                        </div>
                        <div className="text-[12px] text-vuelos-muted mt-0.5">
                          {leg.departure?.airport_code} &middot; {leg.departure?.airport_name}
                        </div>
                        <div className="text-[11px] text-vuelos-muted">{formatDate(leg.departure?.datetime)}</div>
                      </div>
                      {leg.airline_logo_url && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Image
                            src={leg.airline_logo_url}
                            alt={leg.airline}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                          <span className="text-[12px] text-vuelos-muted">{leg.airline} &middot; {leg.flight_number}</span>
                        </div>
                      )}
                    </div>

                    {/* Mid info: duration, aircraft, class */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 ml-0 text-[11.5px] text-vuelos-muted my-2">
                      <span>{formatDurationMins(leg.duration_minutes)}</span>
                      {leg.aircraft && <span>{leg.aircraft}</span>}
                      <span>{leg.travel_class}</span>
                      {leg.legroom && <span>Legroom: {leg.legroom}</span>}
                    </div>

                    {/* Arrival */}
                    <div className="mt-1">
                      <div className="font-[family-name:var(--font-syne)] text-[14px] font-semibold text-vuelos-black">
                        {formatTime(leg.arrival?.datetime)}
                      </div>
                      <div className="text-[12px] text-vuelos-muted mt-0.5">
                        {leg.arrival?.airport_code} &middot; {leg.arrival?.airport_name}
                      </div>
                      <div className="text-[11px] text-vuelos-muted">{formatDate(leg.arrival?.datetime)}</div>
                    </div>

                    {/* Features + Warnings */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-vuelos-skeleton text-[11.5px] text-vuelos-muted">
                      {leg.features?.wifi && wifiIcon(leg.features.wifi)}
                      {leg.features?.power_outlets && (
                        <span className="flex items-center gap-1" title="Enchufes en el asiento">
                          <Plug className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {leg.features?.usb && (
                        <span className="flex items-center gap-1" title="USB en el asiento">
                          <Usb className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {leg.features?.entertainment && (
                        <span className="flex items-center gap-1" title="Entretenimiento a bordo">
                          <MonitorPlay className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {leg.overnight && (
                        <span className="flex items-center gap-1 text-amber-600" title="Vuelo nocturno">
                          <Moon className="w-3.5 h-3.5" />
                          Nocturno
                        </span>
                      )}
                      {leg.often_delayed && (
                        <span className="flex items-center gap-1 text-red-500 font-medium" title="Este vuelo suele retrasarse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Suele retrasarse
                        </span>
                      )}
                      {leg.operated_by && (
                        <span className="text-[11px] text-vuelos-muted truncate">Operado por: {leg.operated_by}</span>
                      )}
                      {leg.also_sold_by && leg.also_sold_by.length > 0 && (
                        <span className="text-[11px] text-vuelos-muted truncate">
                          También vendido por: {leg.also_sold_by.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Features raw list */}
                    {leg.features?.raw && leg.features.raw.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {leg.features.raw.map((txt, j) => {
                          const match = amenityIcon(txt);
                          return (
                            <span
                              key={j}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vuelos-surface text-[11px] text-vuelos-dim"
                            >
                              {match?.icon}
                              {txt}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Carbon emissions ── */}
          {offer.carbon_emissions && (
            <div className="mt-5 pt-3 border-t border-vuelos-skeleton text-[11.5px] text-vuelos-muted">
              Avg CO2: {Math.round(offer.carbon_emissions.this_flight_grams / 1000)} kg
              {offer.carbon_emissions.difference_percent < 0 && (
                <span className="ml-1 text-green-600 font-medium">
                  ({offer.carbon_emissions.difference_percent}% vs typical)
                </span>
              )}
            </div>
          )}

          {/* ── Booking Options ── */}
          {detailsLoading && <BookingOptionsSkeleton />}

          {!detailsLoading && detailsError && (
            <div className="mt-4 pt-3 border-t border-vuelos-skeleton text-[11.5px] text-vuelos-muted">
              No se pudieron cargar las opciones de reserva
            </div>
          )}

          {!detailsLoading && !detailsError && bookingOptions.length > 0 && (
            <BookingOptionsSection options={bookingOptions} currency={currency || 'EUR'} />
          )}

          {/* ── Seleccionar button (outbound_selection phase) ── */}
          {showSelectButton && onSelect && (
            <div className="mt-4 pt-3 border-t border-vuelos-skeleton">
              <button
                type="button"
                onClick={onSelect}
                className="w-full py-3 bg-vuelos-black text-white font-bold rounded-full hover:bg-[#333] transition-all text-sm flex items-center justify-center gap-2"
              >
                Seleccionar este vuelo
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
