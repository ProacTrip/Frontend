'use client';

import { useState } from 'react';
import SearchForm, { SearchParams } from './components/SearchForm';
import HotelFilters, { FilterValues } from './components/HotelFilters';

export default function HotelesPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterValues>({
    min_price: null,
    max_price: null,
    rating: null,
    property_types: [],
    hotel_classes: [],
    amenities: [],
  });

  const handleSearch = async (params: SearchParams) => {
    console.log('Buscando con parámetros:', params);
    console.log('Filtros activos:', filters);
    setIsSearching(true);
    
    setTimeout(() => {
      setIsSearching(false);
      alert(`Búsqueda realizada:\n${params.query}\n${params.check_in_date} → ${params.check_out_date}\n${params.adults} adultos, ${params.children} niños\n\nFiltros: ${JSON.stringify(filters, null, 2)}`);
    }, 2000);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    console.log('Filtros actualizados:', newFilters);
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 bg-[#ffe884]">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        
        {/* SECCIÓN SUPERIOR: Logo + Formulario */}
        <div className="grid grid-cols-12 gap-6">
          {/* Logo */}
          <div className="col-span-3">
            <div className="border-4 border-[#FF6B6B] rounded-2xl p-4 bg-white shadow-lg">
              <img 
                src="/logoMostrar.png" 
                alt="ProacTrip Logo" 
                className="w-full h-52 object-contain"
              />
            </div>
          </div>

          {/* Formulario */}
          <div className="col-span-9">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-900">Buscar Hoteles</h2>
              <p className="text-gray-600 mt-2">Encuentra los mejores hoteles al mejor precio</p>
            </div>
            <SearchForm onSearch={handleSearch} isLoading={isSearching} />
          </div>
        </div>

        {/* SECCIÓN INFERIOR: Filtros + Resultados */}
        <div className="grid grid-cols-12 gap-6">
          {/* Filtros */}
          <div className="col-span-3">
            <HotelFilters onFilterChange={handleFilterChange} />
          </div>

          {/* Resultados */}
          <div className="col-span-9">
            {searchResults.length > 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Resultados aparecerán aquí...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Realiza una búsqueda
                </h3>
                <p className="text-gray-600">
                  Usa el formulario de arriba para buscar hoteles
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}