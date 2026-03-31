// app/home/hoteles/components/HotelFilters.tsx

'use client';

import { useState } from 'react';
import { DollarSign, Star, Home } from 'lucide-react';
import type { FilterValues } from '@/app/lib/types/hotel';

// ✅ CORRECCIÓN 1: Re-export para que page.tsx no se rompa
export type { FilterValues } from '@/app/lib/types/hotel';

interface HotelFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export default function HotelFilters({ onFilterChange }: HotelFiltersProps) {
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<number[]>([]);
  const [selectedHotelClasses, setSelectedHotelClasses] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);

  // Ratings disponibles
  const ratings = [
    { value: null, label: 'Cualquiera' },
    { value: 7, label: '3.5+' },
    { value: 8, label: '4.0+' },
    { value: 9, label: '4.5+' },
  ];

  // ✅ CORREGIDO: Tipos de propiedad según documentación de Marco Aurelio
  // Solo HOTELS (vacation_rentals: false). IDs 1-11 son Vacation Rentals.
  const propertyTypes = [
    { id: 13, name: 'Hoteles Boutique' },      // ✅ Antes: Apartamentos (MAL)
    { id: 14, name: 'Hostales' },               // ✅ Nuevo - Hostels
    { id: 17, name: 'Resorts' },                // ✅ Antes: Hoteles (MAL)
    { id: 18, name: 'Hoteles Spa' },            // ✅ Antes: Villas (MAL)
    { id: 19, name: 'Bed & Breakfast' },        // ✅ Antes: Hostales y pensiones (MAL)
    { id: 21, name: 'Aparthoteles' },           // ✅ Nuevo
    // ELIMINADOS (son Vacation Rentals, IDs 1-11):
    // { id: 12, name: 'Casa rural' },          // ❌ 12 = Beach hotels (Hotel, pero nombre mal)
    // { id: 18, name: 'Villas' },              // ❌ 18 = Spa hotels (ya está arriba)
    // { id: 20, name: 'Casas y chalets' },     // ❌ 20 = Other (Hotel, pero es VR en tu lógica)
  ];

  // Clases de hotel (estrellas) - ✅ Correcto, no cambia
  const hotelClasses = [
    { id: 2, name: '2 estrellas' },
    { id: 3, name: '3 estrellas' },
    { id: 4, name: '4 estrellas' },
    {id: 5, name: '5 estrellas' },
  ];

  // Servicios (amenities) - ✅ Correcto, IDs verificados con Marco
  const amenities = [
    { id: 35, name: 'WiFi gratis' },
    { id: 9, name: 'Desayuno gratis' },
    { id: 6, name: 'Piscina' },
    { id: 10, name: 'Spa' },
    { id: 1, name: 'Parking gratis' },
    { id: 8, name: 'Restaurante' },
    { id: 40, name: 'Aire acondicionado' },
    { id: 11, name: 'Bar' },
    { id: 14, name: 'Gimnasio' },
    { id: 15, name: 'Servicio de habitaciones' },
    { id: 16, name: 'Transfer aeropuerto' },
    { id: 17, name: 'Recepción 24 horas' },
     // Nota: El ID 7 (Fitness center) ya está cubierto por el 14 según documentación de Marco
    // Algunas APIs usan 7, otras 14 para Gimnasio. Verifica con Marco cuál usar.
  ];

  // Toggle de property types
  const togglePropertyType = (id: number) => {
    setSelectedPropertyTypes(prev => 
      prev.includes(id) 
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  // Toggle de hotel classes
  const toggleHotelClass = (id: number) => {
    setSelectedHotelClasses(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  // Toggle de amenities
  const toggleAmenity = (id: number) => {
    setSelectedAmenities(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    onFilterChange({
      min_price: minPrice > 0 ? minPrice : null,
      max_price: maxPrice < 1000 ? maxPrice : null,
      rating: selectedRating,
      property_types: selectedPropertyTypes,
      hotel_classes: selectedHotelClasses,
      amenities: selectedAmenities,
    });
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setMinPrice(0);
    setMaxPrice(1000);
    setSelectedRating(null);
    setSelectedPropertyTypes([]);
    setSelectedHotelClasses([]);
    setSelectedAmenities([]);
    
    onFilterChange({
      min_price: null,
      max_price: null,
      rating: null,
      property_types: [],
      hotel_classes: [],
      amenities: [],
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Filtrar por</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-[#FF6B6B] hover:text-[#ff5252] font-medium"
        >
          Limpiar
        </button>
      </div>

      {/* PRICE RANGE */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-800">Precio por noche</h4>
        </div>
        
        <div className="space-y-4">
          {/* Inputs mínimo/máximo */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Mínimo</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none"
                min={0}
                max={maxPrice}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Máximo</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none"
                min={minPrice}
                max={10000}
              />
            </div>
          </div>

          {/* Slider dual */}
          <div className="relative pt-2">
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 10))}
              className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none z-20 slider-thumb"
            />
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 10))}
              className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none z-30 slider-thumb"
            />
            <div className="relative w-full h-2 bg-gray-200 rounded-full">
              <div
                className="absolute h-2 bg-[#FF6B6B] rounded-full"
                style={{
                  left: `${(minPrice / 1000) * 100}%`,
                  right: `${100 - (maxPrice / 1000) * 100}%`,
                }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center mt-2">
            €{minPrice} - €{maxPrice >= 1000 ? '1000+' : maxPrice}
          </p>
        </div>
      </div>

      {/* RATING */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-800">Valoración</h4>
        </div>
        
        <div className="space-y-2">
          {ratings.map((rating) => (
            <label
              key={rating.value ?? 'any'}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <input
                type="radio"
                name="rating"
                checked={selectedRating === rating.value}
                onChange={() => setSelectedRating(rating.value)}
                className="w-4 h-4 text-[#FF6B6B] focus:ring-[#FF6B6B] cursor-pointer"
              />
              <span className="text-sm text-gray-700">{rating.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* TYPE OF STAY - ✅ CORREGIDO: Nombres según IDs de Marco */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-gray-600" />
          <h4 className="font-semibold text-gray-800">Tipo de alojamiento</h4>
        </div>
        
        <div className="space-y-2">
          {propertyTypes.map((type) => (
            <label
              key={type.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedPropertyTypes.includes(type.id)}
                onChange={() => togglePropertyType(type.id)}
                className="w-4 h-4 text-[#FF6B6B] focus:ring-[#FF6B6B] rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">{type.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* HOTEL CLASS (Estrellas) */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-4">Categoría</h4>
        
        <div className="space-y-2">
          {hotelClasses.map((hotelClass) => (
            <label
              key={hotelClass.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedHotelClasses.includes(hotelClass.id)}
                onChange={() => toggleHotelClass(hotelClass.id)}
                className="w-4 h-4 text-[#FF6B6B] focus:ring-[#FF6B6B] rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">{hotelClass.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AMENITIES */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-4">Servicios</h4>
        
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {amenities.map((amenity) => (
            <label
              key={amenity.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity.id)}
                onChange={() => toggleAmenity(amenity.id)}
                className="w-4 h-4 text-[#FF6B6B] focus:ring-[#FF6B6B] rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">{amenity.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Botón aplicar filtros */}
      <button
        onClick={handleApplyFilters}
        className="w-full bg-[#FF6B6B] text-white py-3 rounded-lg hover:bg-[#ff5252] transition-colors font-semibold shadow-md"
      >
        Aplicar filtros
      </button>

      {/* CSS para los sliders */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FF6B6B;
          cursor: pointer;
          pointer-events: all;
          position: relative;
          z-index: 50;
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FF6B6B;
          cursor: pointer;
          pointer-events: all;
          border: none;
        }
      `}</style>
    </div>
  );
}