'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  query: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  children_ages: number[];
  rooms: number;
}

export default function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  // Actualizar edades de niños cuando cambia la cantidad
  const handleChildrenChange = (newCount: number) => {
    setChildren(newCount);
    
    if (newCount > children) {
      const newAges = [...childrenAges];
      for (let i = children; i < newCount; i++) {
        newAges.push(5);
      }
      setChildrenAges(newAges);
    } else {
      setChildrenAges(childrenAges.slice(0, newCount));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query || !checkIn || !checkOut) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    onSearch({
      query,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults,
      children,
      children_ages: childrenAges,
      rooms,
    });
  };

  // Formatear fechas para mostrar
  const formatDateRange = () => {
    if (!checkIn || !checkOut) return 'Añadir fechas';
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    };
    
    return `${start.toLocaleDateString('es-ES', options)} — ${end.toLocaleDateString('es-ES', options)}`;
  };

  // Formatear resumen de huéspedes
  const formatGuestsSummary = () => {
    const parts = [];
    parts.push(`${adults} ${adults === 1 ? 'adulto' : 'adultos'}`);
    if (children > 0) parts.push(`${children} ${children === 1 ? 'niño' : 'niños'}`);
    parts.push(`${rooms} ${rooms === 1 ? 'habitación' : 'habitaciones'}`);
    return parts.join(' · ');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg">
      <div className="grid grid-cols-12 divide-x divide-gray-200">
        
        {/* DESTINO */}
        <div className="col-span-3 p-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            ¿Adónde vas?
          </label>
          <div className="relative">
            <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ciudad o destino"
              className="w-full pl-7 pr-2 py-1 text-sm border-0 focus:ring-0 outline-none placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        {/* FECHAS */}
        <div className="col-span-4 p-4 relative">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Fechas
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={today}
                className="flex-1 text-sm border-0 focus:ring-0 outline-none"
                required
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || today}
                className="flex-1 text-sm border-0 focus:ring-0 outline-none"
                required
              />
            </div>
          </div>
          {checkIn && checkOut && (
            <p className="text-xs text-gray-500 mt-1 ml-7">
              {formatDateRange()}
            </p>
          )}
        </div>

        {/* HUÉSPEDES */}
        <div className="col-span-4 p-4 relative">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Huéspedes
          </label>
          <button
            type="button"
            onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
            className="w-full flex items-center gap-2 text-left"
          >
            <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 flex-1">
              {formatGuestsSummary()}
            </span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${showGuestsDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown de huéspedes */}
          {showGuestsDropdown && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
              
              {/* Adults */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-700">Adultos</p>
                  <p className="text-xs text-gray-500">18+ años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                    disabled={adults <= 1}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-700">Niños</p>
                  <p className="text-xs text-gray-500">0-17 años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleChildrenChange(Math.max(0, children - 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                    disabled={children <= 0}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{children}</span>
                  <button
                    type="button"
                    onClick={() => handleChildrenChange(children + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Rooms */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-gray-700">Habitaciones</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRooms(Math.max(1, rooms - 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                    disabled={rooms <= 1}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{rooms}</span>
                  <button
                    type="button"
                    onClick={() => setRooms(rooms + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Edades de niños */}
              {children > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Edades de los niños
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {childrenAges.map((age, index) => (
                      <select
                        key={index}
                        value={age}
                        onChange={(e) => {
                          const newAges = [...childrenAges];
                          newAges[index] = parseInt(e.target.value);
                          setChildrenAges(newAges);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none text-sm"
                      >
                        {Array.from({ length: 18 }, (_, i) => i).map((ageOption) => (
                          <option key={ageOption} value={ageOption}>
                            {ageOption} {ageOption === 1 ? 'año' : 'años'}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuestsDropdown(false)}
                className="w-full mt-4 py-2 bg-[#FF6B6B] text-white rounded-md hover:bg-[#ff5252] transition-colors font-medium text-sm"
              >
                Listo
              </button>
            </div>
          )}
        </div>

        {/* BOTÓN BUSCAR */}
        <div className="col-span-1 p-4 flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF6B6B] text-white py-3 px-4 rounded-lg hover:bg-[#ff5252] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span className="hidden xl:inline">Buscar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}