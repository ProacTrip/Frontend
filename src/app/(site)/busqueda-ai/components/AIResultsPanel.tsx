'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SlidersHorizontal, Building2, Search, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ResultTabs from './ResultTabs';
import FlightCard from '@/app/(site)/vuelos/components/FlightCard';
import HotelCard from '@/app/(site)/hoteles/components/HotelCard';
import HotelDetailModal from '@/app/(site)/hoteles/components/HotelDetailModal';
import FilterModal from '@/app/(site)/vuelos/components/FilterModal';
import FiltersModal from '@/app/(site)/hoteles/components/FiltersModal';
import DiscoveryCard from './DiscoveryCard';
import WeatherCard from './WeatherCard';
import type { FlightOffer } from '@/app/lib/types/flight';
import type { FrontendHotel } from '@/app/lib/types/hotel';
import type { AIDiscoveryResponse } from '@/app/lib/types/search-ai';
import type { VueloFilterValues } from '@/app/(site)/vuelos/components/FilterBar';
import type { FilterValues as HotelFilterValues } from '@/app/lib/types/hotel';

interface AIResultsPanelProps {
  flightOffers: FlightOffer[];
  hotelProperties: FrontendHotel[];
  flightsError?: string;
  hotelsError?: string;
  candidates?: AIDiscoveryResponse['candidates'];
  needsClarification?: boolean;
  clarificationQuestion?: string;
  weather: { temperature: number; description: string; icon?: string; location?: string; date?: string } | null;
  isLoading: boolean;
  /** True while the return-flight search is in progress (after outbound selection) */
  isLoadingReturnFlights?: boolean;
  isEmpty: boolean;
  hasSearched: boolean;
  resultsRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when user selects an outbound flight — parent fetches return flights */
  onSelectOutbound?: (departureToken: string, offer: FlightOffer) => void;
  /** Called when user clicks "Reservar vuelo" on a flight card */
  onBookFlight?: (offer: FlightOffer) => void;
  /** Called when user clicks "Reservar hotel" on a hotel card */
  onBookHotel?: (hotel: FrontendHotel) => void;
}

type ResultTab = 'all' | 'hotels' | 'flights' | 'discovery';

export default function AIResultsPanel({
  flightOffers,
  hotelProperties,
  flightsError,
  hotelsError,
  candidates,
  needsClarification,
  clarificationQuestion,
  weather,
  isLoading,
  isLoadingReturnFlights,
  isEmpty,
  hasSearched,
  resultsRef,
  onSelectOutbound,
  onBookFlight,
  onBookHotel,
}: AIResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>('all');
  const [flightsFilterModalOpen, setFlightsFilterModalOpen] = useState(false);
  const [hotelsFilterModalOpen, setHotelsFilterModalOpen] = useState(false);
  const [flightsFilters, setFlightsFilters] = useState<VueloFilterValues>({});
  const [hotelsFilters, setHotelsFilters] = useState<HotelFilterValues>({
    min_price: null,
    max_price: null,
    rating: null,
    property_types: [],
    hotel_classes: [],
    amenities: [],
    sort_by: undefined,
    brands: undefined,
    free_cancellation: undefined,
    special_offers: undefined,
    eco_certified: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
  });
  const [activeHotelsFilterCount, setActiveHotelsFilterCount] = useState(0);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [expandedFlightIdx, setExpandedFlightIdx] = useState<number | null>(null);
  const [selectedOutboundToken, setSelectedOutboundToken] = useState<string | null>(null);
  const [selectedOutboundOffer, setSelectedOutboundOffer] = useState<FlightOffer | null>(null);

  // Pagination
  const HOTELS_PER_PAGE = 8;
  const FLIGHTS_PER_PAGE = 8;
  const [hotelsVisible, setHotelsVisible] = useState(HOTELS_PER_PAGE);
  const [flightsVisible, setFlightsVisible] = useState(FLIGHTS_PER_PAGE);

  // Reset pagination when results change (new search)
  const prevCounts = useRef({ hotels: 0, flights: 0, flightKey: '' });
  useEffect(() => {
    if (hotelProperties.length !== prevCounts.current.hotels) {
      setHotelsVisible(HOTELS_PER_PAGE);
      prevCounts.current.hotels = hotelProperties.length;
    }
    if (flightOffers.length !== prevCounts.current.flights) {
      setFlightsVisible(FLIGHTS_PER_PAGE);
      prevCounts.current.flights = flightOffers.length;
    }
    // Reset outbound selection ONLY when completely new flights arrive
    // (different departure airport/dates), NOT when return flights merge in.
    if (flightOffers.length > 0 && flightOffers.length !== prevCounts.current.flights) {
      const firstOffer = flightOffers[0];
      const newKey = firstOffer?.legs?.[0]?.departure?.airport_code + '|' + firstOffer?.legs?.[0]?.departure?.datetime;
      if (newKey !== prevCounts.current.flightKey) {
        setSelectedOutboundToken(null);
        setSelectedOutboundOffer(null);
      }
      prevCounts.current.flightKey = newKey;
    }
  }, [hotelProperties.length, flightOffers.length]);

  // Count active flight filters
  const activeFlightsFilterCount = useMemo(() => {
    let count = 0;
    if (flightsFilters.include_airlines?.length) count++;
    if (flightsFilters.stops && flightsFilters.stops !== 'any') count++;
    if (flightsFilters.max_price) count++;
    if (flightsFilters.max_duration_minutes) count++;
    if (flightsFilters.travel_class) count++;
    return count;
  }, [flightsFilters]);

  // Apply client-side hotel filtering
  const filteredHotelProperties = useMemo(() => {
    if (activeHotelsFilterCount === 0) return hotelProperties;
    return hotelProperties.filter((hotel) => {
      if (hotelsFilters.min_price != null && (hotel.price?.amount ?? 0) < hotelsFilters.min_price) return false;
      if (hotelsFilters.max_price != null && (hotel.price?.amount ?? 0) > hotelsFilters.max_price) return false;
      if (hotelsFilters.rating != null && (hotel.rating?.score ?? 0) < hotelsFilters.rating) return false;
      if (hotelsFilters.hotel_classes?.length && !hotelsFilters.hotel_classes.includes(hotel.stars ?? 0)) return false;
      if (hotelsFilters.free_cancellation && !(hotel as unknown as Record<string, unknown>).freeCancellation) return false;
      if (hotelsFilters.eco_certified && !(hotel as unknown as Record<string, unknown>).ecoCertified) return false;
      if (hotelsFilters.special_offers && !(hotel as unknown as Record<string, unknown>).specialOffer) return false;
      return true;
    });
  }, [hotelProperties, hotelsFilters, activeHotelsFilterCount]);
  const filteredFlightOffers = useMemo(() => {
    if (activeFlightsFilterCount === 0) return flightOffers;
    return flightOffers.filter((offer) => {
      if (flightsFilters.stops && flightsFilters.stops !== 'any') {
        const stops = offer.layovers?.length ?? 0;
        if (
          (flightsFilters.stops === 'nonstop' && stops !== 0) ||
          (flightsFilters.stops === 'max_1' && stops > 1) ||
          (flightsFilters.stops === 'max_2' && stops > 2)
        )
          return false;
      }
      if (flightsFilters.max_price && offer.price?.amount > flightsFilters.max_price) return false;
      if (flightsFilters.include_airlines?.length) {
        const airline = offer.legs?.[0]?.airline_code;
        if (airline && !flightsFilters.include_airlines.includes(airline)) return false;
      }
      return true;
    });
  }, [flightOffers, flightsFilters, activeFlightsFilterCount]);

  // Separate outbound vs return flights based on token type.
  // - departure_token → outbound selection phase (round_trip, phase=outbound_selection)
  // - booking_token   → return selection or complete (one_way or round_trip phase=complete)
  const outboundFlights = useMemo(
    () => filteredFlightOffers.filter((f) => !!f.departure_token),
    [filteredFlightOffers],
  );
  const returnFlights = useMemo(
    () => filteredFlightOffers.filter((f) => !!f.booking_token && !f.departure_token),
    [filteredFlightOffers],
  );
  // Show all flights if we can't distinguish phases (one_way or already complete)
  const hasSeparatedPhases = outboundFlights.length > 0;
  const displayFlights = hasSeparatedPhases
    ? (selectedOutboundToken ? returnFlights : outboundFlights)
    : filteredFlightOffers;

  // Determine if flights are one-way (complete) vs round-trip (needs return selection)
  const isRoundTripOutbound = hasSeparatedPhases && !selectedOutboundToken;
  // True when user selected outbound but return flights haven't arrived yet
  const isWaitingForReturnFlights = !!selectedOutboundToken && isLoadingReturnFlights && returnFlights.length === 0;

  // Available airlines for filter modal (use all flight offers, not just displayed)
  const availableAirlines = useMemo(() => {
    const seen = new Set<string>();
    return flightOffers
      .map((f) => {
        const leg = f.legs?.[0];
        if (!leg || seen.has(leg.airline_code)) return null;
        seen.add(leg.airline_code);
        return { code: leg.airline_code, name: leg.airline, logoUrl: leg.airline_logo_url };
      })
      .filter(Boolean) as Array<{ code: string; name: string; logoUrl?: string }>;
  }, [flightOffers]);

  // Determine which tabs to show
  const hasFlights = flightOffers.length > 0;
  const hasHotels = hotelProperties.length > 0;
  const hasDiscovery = !!candidates && candidates.length > 0;
  const showFlights = hasFlights || !!flightsError;
  const showHotels = hasHotels || !!hotelsError;

  const tabs = [
    { id: 'all' as const, label: 'Todos', count: (hasFlights ? flightOffers.length : 0) + (hasHotels ? hotelProperties.length : 0) },
    ...(showHotels ? [{ id: 'hotels' as const, label: 'Hoteles', count: hotelProperties.length }] : []),
    ...(showFlights ? [{ id: 'flights' as const, label: 'Vuelos', count: flightOffers.length }] : []),
    ...(hasDiscovery ? [{ id: 'discovery' as const, label: 'Descubrir', count: candidates!.length }] : []),
  ];

  // Derive which items to show based on active tab
  const showFlightCards = activeTab === 'all' || activeTab === 'flights';
  const showHotelCards = activeTab === 'all' || activeTab === 'hotels';
  const showDiscoveryCards = activeTab === 'discovery';

  const handleClearFlightsFilters = useCallback(() => {
    setFlightsFilters({});
  }, []);

  const handleClearHotelsFilters = useCallback(() => {
    setHotelsFilters({
      min_price: null,
      max_price: null,
      rating: null,
      property_types: [],
      hotel_classes: [],
      amenities: [],
      sort_by: undefined,
      brands: undefined,
      free_cancellation: undefined,
      special_offers: undefined,
      eco_certified: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
    });
    setActiveHotelsFilterCount(0);
  }, []);

  return (
    <main ref={resultsRef} className="p-6 flex flex-col gap-4 overflow-y-auto max-md:px-4 max-md:py-4">
      {/* ── Empty State ── */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center h-full text-center py-32">
          <div className="w-20 h-20 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-5">
            <Search className="w-10 h-10 text-[#767676]" />
          </div>
          <h2 className="text-xl font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A] mb-2">
            Resultados de tu búsqueda
          </h2>
          <p className="text-sm text-[#6A7282] max-w-sm">
            Enviá un mensaje en el chat para ver vuelos, hoteles y recomendaciones personalizadas.
          </p>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-[#e8e8e8] rounded-full animate-pulse" />
            <div className="h-9 w-24 bg-[#e8e8e8] rounded-full animate-pulse" />
            <div className="h-9 w-24 bg-[#e8e8e8] rounded-full animate-pulse" />
          </div>
          <div className="h-10 w-full bg-[#e8e8e8] rounded-lg animate-pulse" />
          <div className="h-6 w-48 bg-[#e8e8e8] rounded animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 w-full bg-[#e8e8e8] rounded-2xl animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* ── Has Searched, Not Loading ── */}
      {hasSearched && !isLoading && (
        <>
          {/* Tabs */}
          {tabs.length > 1 && (
            <ResultTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as ResultTab)}
            />
          )}

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap max-md:overflow-x-auto max-md:flex-nowrap max-md:gap-2 max-md:pb-2">
            {showFlights && (activeTab === 'all' || activeTab === 'flights') && (
              <button
                onClick={() => setFlightsFilterModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[#e8e8e8] bg-white text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors max-md:min-h-[44px] max-md:shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtros vuelos
                {activeFlightsFilterCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-[#0A0A0A] text-white text-[10px] flex items-center justify-center">
                    {activeFlightsFilterCount}
                  </span>
                )}
              </button>
            )}
            {showHotels && (activeTab === 'all' || activeTab === 'hotels') && (
              <button
                onClick={() => setHotelsFilterModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[#e8e8e8] bg-white text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors max-md:min-h-[44px] max-md:shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtros hoteles
                {activeHotelsFilterCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-[#0A0A0A] text-white text-[10px] flex items-center justify-center">
                    {activeHotelsFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Results heading */}
          {(showFlightCards || showHotelCards) && !showDiscoveryCards && (
            <div>
              <h2 className="text-lg font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A]">
                {activeTab === 'flights'
                  ? `${filteredFlightOffers.length} vuelos`
                  : activeTab === 'hotels'
                    ? `${filteredHotelProperties.length} hoteles`
                    : `${filteredFlightOffers.length + filteredHotelProperties.length} resultados`}
              </h2>
            </div>
          )}

          {/* Weather Card */}
          {weather && (
            <WeatherCard
              temperature={weather.temperature ?? 0}
              description={weather.description ?? ''}
              location={weather.location}
              iconCode={weather.icon}
            />
          )}

          {/* Clarification question */}
          {needsClarification && clarificationQuestion && (
            <div className="p-4 rounded-2xl bg-[#F5F5F5] border border-[#e8e8e8]">
              <p className="text-sm text-[#0A0A0A]">{clarificationQuestion}</p>
            </div>
          )}

          {/* Error banners */}
          {flightsError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>No se pudieron obtener vuelos: {flightsError}</span>
            </div>
          )}
          {hotelsError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>No se pudieron obtener hoteles: {hotelsError}</span>
            </div>
          )}

          {/* Discovery cards */}
          {showDiscoveryCards && candidates && candidates.length > 0 && (
            <div className="flex flex-col gap-3">
              {candidates.map((candidate, idx) => (
                <DiscoveryCard
                  key={`${candidate.destination}-${idx}`}
                  destination={candidate.destination}
                  country={candidate.country}
                  region={candidate.region}
                  tags={candidate.tags}
                  budgetTier={candidate.budget_tier}
                  score={candidate.score}
                  reasons={candidate.reasons}
                  bestMonths={candidate.best_months}
                  source={candidate.source}
                  index={idx}
                />
              ))}
            </div>
          )}

          {/* Discovery empty */}
          {showDiscoveryCards && (!candidates || candidates.length === 0) && (
            <div className="p-6 rounded-2xl bg-[#F5F5F5] text-center">
              <p className="text-sm text-[#6A7282] mb-2">No encontré destinos específicos.</p>
              <p className="text-xs text-[#767676]">
                Probá siendo más específico: &ldquo;playas baratas en agosto&rdquo; o &ldquo;ciudades europeas con vuelo directo&rdquo;.
              </p>
            </div>
          )}

          {/* Selected outbound banner — shown when user picks an outbound flight */}
          {selectedOutboundOffer && hasSeparatedPhases && (
            <div className="p-3 rounded-xl bg-[#F5F5F5] border border-[#e8e8e8] flex items-center justify-between">
              <div className="text-sm min-w-0 flex-1">
                <span className="text-[#6A7282]">Ida seleccionada: </span>
                <span className="font-medium text-[#0A0A0A]">
                  {selectedOutboundOffer.legs?.[0]?.departure?.airport_code} → {selectedOutboundOffer.legs?.[selectedOutboundOffer.legs.length - 1]?.arrival?.airport_code}
                </span>
                <span className="text-[#6A7282] ml-1">
                  {selectedOutboundOffer.price?.amount != null ? `${selectedOutboundOffer.price.amount} ${selectedOutboundOffer.price.currency}` : ''}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedOutboundToken(null);
                  setSelectedOutboundOffer(null);
                  onSelectOutbound?.('', null as unknown as FlightOffer);
                }}
                className="text-xs text-[#6A7282] hover:text-[#0A0A0A] underline shrink-0 ml-3"
              >
                Cambiar
              </button>
            </div>
          )}

          {/* Flight Cards with AnimatePresence */}
          <AnimatePresence mode="popLayout">
            {/* Return flights loading state */}
            {showFlightCards && !showDiscoveryCards && isWaitingForReturnFlights && (
              <React.Fragment key="return-loading">
                <h2 className="text-lg font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A]">
                  Buscando vuelos de vuelta…
                </h2>
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={`return-skel-${i}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-2xl border border-[#e8e8e8] bg-white p-4 animate-pulse"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-48 rounded bg-[#F5F5F5]" />
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-20 rounded bg-[#F5F5F5]" />
                            <div className="h-5 w-12 rounded-full bg-[#F5F5F5]" />
                          </div>
                        </div>
                        <div className="h-5 w-14 rounded bg-[#F5F5F5]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </React.Fragment>
            )}
            {showFlightCards && !showDiscoveryCards && displayFlights.length > 0 && (
              <React.Fragment key="flights-section">
                {hasSeparatedPhases && (
                  <h2 className="text-lg font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A]">
                    {selectedOutboundToken ? 'Selecciona tu vuelo de vuelta' : 'Selecciona tu vuelo de ida'}
                  </h2>
                )}
                {!hasSeparatedPhases && displayFlights.length > 0 && (
                  <h2 className="text-lg font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A]">
                    {displayFlights.length} vuelos
                  </h2>
                )}
                <div className="flex flex-col gap-3">
                  {displayFlights.slice(0, flightsVisible).map((offer, idx) => (
                    <motion.div
                      key={offer.booking_token || offer.departure_token || `flight-${idx}-${offer.legs?.[0]?.flight_number || idx}`}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                        delay: idx * 0.05,
                      }}
                    >
                      <FlightCard
                        offer={offer}
                        isExpanded={expandedFlightIdx === idx}
                        onToggle={() => setExpandedFlightIdx(expandedFlightIdx === idx ? null : idx)}
                        routeParams={undefined}
                        onSelectOutbound={offer.departure_token ? () => {
                          setSelectedOutboundToken(offer.departure_token ?? null);
                          setSelectedOutboundOffer(offer);
                          setExpandedFlightIdx(null);
                          onSelectOutbound?.(offer.departure_token!, offer);
                        } : undefined}
                        showSelectButton={isRoundTripOutbound && !!offer.departure_token}
                      />
                    </motion.div>
                  ))}
                </div>
                {flightsVisible < displayFlights.length && (
                  <button
                    onClick={() => setFlightsVisible((prev) => Math.min(prev + FLIGHTS_PER_PAGE, displayFlights.length))}
                    className="flex items-center justify-center gap-1.5 w-full py-3 text-sm text-[#6A7282] hover:text-[#0A0A0A] transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Mostrar más vuelos ({displayFlights.length - flightsVisible} restantes)
                  </button>
                )}
                {/* Booking banner */}
                {showFlightCards && !showDiscoveryCards && displayFlights.length > 0 && onBookFlight && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#0A0A0A] text-white">
                    <p className="text-sm mb-3">
                      {isRoundTripOutbound
                        ? 'Selecciona un vuelo de vuelta para reservar'
                        : `${displayFlights.length} vuelos disponibles — ¿encontraste el ideal?`}
                    </p>
                    <button
                      onClick={() => onBookFlight(displayFlights[0])}
                      className="w-full py-3 bg-white text-[#0A0A0A] font-bold rounded-full text-sm hover:bg-[#F5F5F5] transition-colors"
                    >
                      Reservar primer vuelo
                    </button>
                  </div>
                )}
              </React.Fragment>
            )}

            {/* Hotel Cards with AnimatePresence */}
            {showHotelCards && !showDiscoveryCards && filteredHotelProperties.length > 0 && (
              <React.Fragment key="hotels-section">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredHotelProperties.slice(0, hotelsVisible).map((hotel, idx) => (
                    <motion.div
                      key={hotel.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                        delay: idx * 0.03,
                      }}
                      onClick={() => setSelectedHotelId(hotel.id)}
                      className="cursor-pointer"
                    >
                      <HotelCard hotel={hotel} nights={1} onSelect={(id) => setSelectedHotelId(id)} />
                    </motion.div>
                  ))}
                </div>
                {hotelsVisible < filteredHotelProperties.length && (
                  <button
                    onClick={() => setHotelsVisible((prev) => Math.min(prev + HOTELS_PER_PAGE, filteredHotelProperties.length))}
                    className="flex items-center justify-center gap-1.5 w-full py-3 text-sm text-[#6A7282] hover:text-[#0A0A0A] transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Mostrar más hoteles ({filteredHotelProperties.length - hotelsVisible} restantes)
                  </button>
                )}
              </React.Fragment>
            )}
          </AnimatePresence>

          {/* No results after search */}
          {isEmpty && !isLoading && !hasDiscovery && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-[#767676]" />
              </div>
              <p className="text-base font-semibold text-[#0A0A0A] mb-1">Sin resultados</p>
              <p className="text-sm text-[#6A7282]">Probá con otra consulta en el chat.</p>
            </div>
          )}
        </>
      )}

      {/* ── Filter Modals ── */}
      {/* Flight FilterModal */}
      <FilterModal
        open={flightsFilterModalOpen}
        onClose={() => setFlightsFilterModalOpen(false)}
        filters={flightsFilters}
        onApply={(f) => {
          setFlightsFilters(f);
          setFlightsFilterModalOpen(false);
        }}
        onClear={() => {
          handleClearFlightsFilters();
          setFlightsFilterModalOpen(false);
        }}
        availableAirlines={availableAirlines}
      />

      {/* Hotel FiltersModal */}
      <FiltersModal
        open={hotelsFilterModalOpen}
        onClose={() => setHotelsFilterModalOpen(false)}
        filters={hotelsFilters}
        onApply={(draft) => {
          setHotelsFilters(draft);
          let c = 0;
          if (draft.min_price != null) c++;
          if (draft.max_price != null) c++;
          if (draft.rating != null) c++;
          if (draft.property_types?.length) c++;
          if (draft.hotel_classes?.length) c++;
          if (draft.amenities?.length) c++;
          if (draft.free_cancellation) c++;
          if (draft.special_offers) c++;
          if (draft.eco_certified) c++;
          if ((draft.bedrooms ?? 0) > 0) c++;
          if ((draft.bathrooms ?? 0) > 0) c++;
          setActiveHotelsFilterCount(c);
          setHotelsFilterModalOpen(false);
        }}
        onClear={() => {
          handleClearHotelsFilters();
          setHotelsFilterModalOpen(false);
        }}
        vacationRentals={false}
      />
      {/* ── Hotel Detail Modal ── */}
      {selectedHotelId && (
        <HotelDetailModal
          hotel={filteredHotelProperties.find((h) => h.id === selectedHotelId) || hotelProperties.find((h) => h.id === selectedHotelId)!}
          onClose={() => setSelectedHotelId(null)}
        />
      )}
    </main>
  );
}
