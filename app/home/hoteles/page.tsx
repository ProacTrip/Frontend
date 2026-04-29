'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchForm, { SearchParams } from './components/SearchForm';
import HotelFilters, { FilterValues } from './components/HotelFilters';
import HotelsList from './components/HotelsList';
import HotelDetailModal from './components/HotelDetailModal';
import { searchHotels, RateLimitError } from '@/app/lib/api';
import { getStoredContext } from '@/app/lib/utils/location';
import type { ContextResponse } from '@/app/lib/api/context';

function HotelesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedHotelId = searchParams.get('hotel');

  const [isSearching, setIsSearching] = useState(false);
  const [displayedHotels, setDisplayedHotels] = useState<any[]>([]);
  const [locationContext, setLocationContext] = useState<ContextResponse | null>(null);

  useEffect(() => {
    const ctx = getStoredContext();
    if (ctx) {
      setLocationContext(ctx);
    }
  }, []);
  
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);

  const [filters, setFilters] = useState<FilterValues>({
    min_price: null,
    max_price: null,
    rating: null,
    property_types: [],
    hotel_classes: [],
    amenities: [],
  });

  const selectedHotel = selectedHotelId 
    ? displayedHotels.find(h => h.id === selectedHotelId) 
    : null;

  const handleCloseModal = () => {
    router.push('/home/hoteles', { scroll: false });
  };

  const handleSearch = async (params: SearchParams, customFilters?: FilterValues) => {
    const activeFilters = customFilters || filters;

    setIsSearching(true);
    setHasSearched(true);
    setLastSearchParams(params);
    
    try {
      const response = await searchHotels(params, activeFilters);
      
      setDisplayedHotels(response.properties);
      setNextToken(response.pagination.next_token);
      setHasMore(response.pagination.has_more);
      
    } catch (error) {
      console.error('❌ Error en la búsqueda:', error);
      const msg = error instanceof RateLimitError
        ? error.message
        : 'Error al buscar hoteles. Por favor intenta de nuevo.';
      alert(msg);
      setDisplayedHotels([]);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (isSearching || !hasMore || !nextToken || !lastSearchParams) return;
    
    setIsSearching(true);
    
    try {
      const response = await searchHotels(
        {
          ...lastSearchParams,
          page_token: nextToken
        },
        filters
      );
      
      setDisplayedHotels((prev) => [...prev, ...response.properties]);
      
      setNextToken(response.pagination.next_token);
      setHasMore(response.pagination.has_more);
      
    } catch (error) {
      console.error('❌ Error cargando más hoteles:', error);
      if (error instanceof RateLimitError) {
        alert(error.message);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    
    if (hasSearched && lastSearchParams) {
      setDisplayedHotels([]);
      setNextToken(null);
      setHasMore(false);
      
      handleSearch(lastSearchParams, newFilters);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3]">
      <div className="max-w-[1600px] mx-auto p-6">
        
        <div className="grid grid-cols-12 gap-6">
          
          <div className="col-span-3 space-y-6">
            
            <div className="border-4 border-[#FF6B6B] rounded-2xl p-4 bg-white shadow-lg">
              <img 
                src="/logoMostrar.png" 
                alt="ProacTrip Logo" 
                className="w-full h-52 object-contain"
              />
            </div>

            <HotelFilters onFilterChange={handleFilterChange} />
          </div>

          <div className="col-span-9 space-y-2">
            
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-900">Buscar Hoteles</h2>
              <p className="text-gray-600 mt-2">Encuentra los mejores hoteles al mejor precio</p>
              {locationContext && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <span>📍</span>
                  {locationContext.location.city}
                  {locationContext.location.country && `, ${locationContext.location.country}`}
                  {locationContext.location.currency && ` · Moneda: ${locationContext.location.currency}`}
                </p>
              )}
            </div>

            <SearchForm onSearch={handleSearch} isLoading={isSearching && !hasSearched} />

            {hasSearched ? (
              displayedHotels.length > 0 ? (
                <HotelsList
                  hotels={displayedHotels}
                  isLoading={isSearching}
                  hasMore={hasMore}
                  nextToken={nextToken}
                  onLoadMore={handleLoadMore}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No se encontraron hoteles
                  </h3>
                  <p className="text-gray-600">
                    Intenta ajustar tus filtros o cambiar las fechas
                  </p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid grid-cols-2 min-h-[320px]">
            
                  <div className="flex flex-col justify-center px-12 py-10">
                    <p className="text-xs font-semibold text-[#FF6B6B] uppercase tracking-widest mb-3">
                      ProacTrip Hoteles
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
                      Encuentra tu alojamiento perfecto
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                      Introduce tu destino, selecciona las fechas y ajusta los huéspedes para ver los mejores hoteles al mejor precio.
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        'Miles de alojamientos disponibles',
                        'Cancelación gratuita en la mayoría de reservas',
                        'Precios sin comisiones ocultas',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
            
                  <div className="relative bg-gradient-to-br from-[#fff0e6] to-[#ffd4b3] flex items-center justify-center">
                    <div className="text-center px-8">
                      <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Usa el buscador de arriba</p>
                      <p className="text-xs text-gray-500 mt-1">y encuentra tu próxima estancia</p>
                    </div>
                  </div>
            
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          searchParams={lastSearchParams || undefined}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default function HotelesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <HotelesContent />
    </Suspense>
  );
}
