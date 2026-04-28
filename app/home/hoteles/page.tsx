'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchForm, { SearchParams } from './components/SearchForm';
import HotelFilters, { FilterValues } from './components/HotelFilters';
import HotelsList from './components/HotelsList';
import HotelDetailModal from './components/HotelDetailModal';
import { searchHotels, RateLimitError } from '@/app/lib/api';

export default function HotelesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedHotelId = searchParams.get('hotel');

  const [isSearching, setIsSearching] = useState(false);
  const [displayedHotels, setDisplayedHotels] = useState<any[]>([]);
  
  // 🔧 PAGINACIÓN CON BACKEND
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

  // Encontrar hotel seleccionado para el modal
  const selectedHotel = selectedHotelId 
    ? displayedHotels.find(h => h.id === selectedHotelId) 
    : null;

  const handleCloseModal = () => {
    router.push('/home/hoteles', { scroll: false });
  };

  // ==================== BÚSQUEDA INICIAL ====================
  const handleSearch = async (params: SearchParams, customFilters?: FilterValues) => {
    // Usar filtros personalizados si se pasan, sino usar los del estado
    const activeFilters = customFilters || filters;

    console.log('🔍 Iniciando búsqueda de hoteles');
    console.log('📤 Parámetros:', params);
    console.log('🎛️ Filtros:', filters);

    setIsSearching(true);
    setHasSearched(true);
    setLastSearchParams(params);
    
    try {
      // ✅ Llamar a searchHotels() (ahora usa MOCK en api.ts, listo para backend real)
      const response = await searchHotels(params, activeFilters);
      
      // Actualizar estado con los resultados
      setDisplayedHotels(response.properties);
      setNextToken(response.pagination.next_token);
      setHasMore(response.pagination.has_more);
      
      console.log(`✅ Búsqueda completada: ${response.properties.length} hoteles encontrados`);
      
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

  // ==================== CARGAR MÁS RESULTADOS (INFINITE SCROLL) ====================
  const handleLoadMore = async () => {
    if (isSearching || !hasMore || !nextToken || !lastSearchParams) return;
    
    console.log('📄 Cargando siguiente página con token:', nextToken);
    
    setIsSearching(true);
    
    try {
      // ✅ Llamar a searchHotels() con page_token
      const response = await searchHotels(
        {
          ...lastSearchParams,
          page_token: nextToken
        },
        filters
      );
      
      // Añadir nuevos hoteles a los existentes
      setDisplayedHotels((prev) => [...prev, ...response.properties]);
      
      // Actualizar paginación
      setNextToken(response.pagination.next_token);
      setHasMore(response.pagination.has_more);
      
      console.log(`✅ Página cargada: ${response.properties.length} hoteles más`);
      console.log(`📊 Total hoteles mostrados: ${displayedHotels.length + response.properties.length}`);
      
    } catch (error) {
      console.error('❌ Error cargando más hoteles:', error);
      if (error instanceof RateLimitError) {
        alert(error.message);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // ==================== APLICAR FILTROS ====================
  const handleFilterChange = (newFilters: FilterValues) => {
    console.log('🎛️ Filtros actualizados:', newFilters);
    setFilters(newFilters);
    
    // ✅ Re-buscar automáticamente con nuevos filtros
    if (hasSearched && lastSearchParams) {
      console.log('🔄 Re-buscando con nuevos filtros...');
      
      // Resetear paginación al cambiar filtros
      setDisplayedHotels([]);
      setNextToken(null);
      setHasMore(false);
      
      // Pasar newFilters directamente para evitar race condition
      handleSearch(lastSearchParams, newFilters);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3]">
      <div className="max-w-[1600px] mx-auto p-6">
        
        {/* GRID DE 2 COLUMNAS */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* ==================== COLUMNA IZQUIERDA (3 cols) ==================== */}
          <div className="col-span-3 space-y-6">
            
            {/* Logo */}
            <div className="border-4 border-[#FF6B6B] rounded-2xl p-4 bg-white shadow-lg">
              <img 
                src="/logoMostrar.png" 
                alt="ProacTrip Logo" 
                className="w-full h-52 object-contain"
              />
            </div>

            {/* Filtros */}
            <HotelFilters onFilterChange={handleFilterChange} />
          </div>

          {/* ==================== COLUMNA DERECHA (9 cols) ==================== */}
          <div className="col-span-9 space-y-2">
            
            {/* Título */}
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-900">Buscar Hoteles</h2>
              <p className="text-gray-600 mt-2">Encuentra los mejores hoteles al mejor precio</p>
            </div>

            {/* Formulario de búsqueda */}
            <SearchForm onSearch={handleSearch} isLoading={isSearching && !hasSearched} />

            {/* RESULTADOS (PEGADOS al formulario con space-y-2) */}
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
            
                  {/* COLUMNA IZQUIERDA - Texto */}
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
            
                  {/* COLUMNA DERECHA - Imagen decorativa */}
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

      {/* Modal de detalle */}
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