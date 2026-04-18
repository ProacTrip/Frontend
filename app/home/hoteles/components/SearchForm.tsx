'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, Users, AlertCircle } from 'lucide-react';
import DateRangePicker from '../../../../components/DateRangePicker';
import GuestsDropdown from './GuestsDropdown';

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

interface FormErrors {
  query?: string;
  dates?: string;
  guests?: string;
}

const COUNTRIES = [
  'Alemania', 'Argentina', 'Australia', 'Austria', 'Bélgica',
  'Bolivia', 'Brasil', 'Canada', 'Chile', 'China', 'Colombia',
  'Croacia', 'Dinamarca', 'Ecuador', 'Egipto', 'Emiratos Árabes',
  'España', 'Estados Unidos', 'Finlandia', 'Francia', 'Grecia',
  'Holanda', 'India', 'Indonesia', 'Irlanda', 'Italia', 'Japón',
  'Marruecos', 'México', 'Noruega', 'Nueva Zelanda', 'Perú',
  'Polonia', 'Portugal', 'Reino Unido', 'República Checa',
  'Rumanía', 'Rusia', 'Sudáfrica', 'Suecia', 'Suiza',
  'Tailandia', 'Turquía', 'Uruguay', 'Venezuela',
];

export default function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pets, setPets] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!query || query.trim().length === 0) {
      newErrors.query = 'Por favor ingresa un destino';
    }

    if (!checkIn || !checkOut) {
      newErrors.dates = 'Selecciona las fechas de entrada y salida';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInD = new Date(checkIn);
      const checkOutD = new Date(checkOut);

      if (checkInD < today) {
        newErrors.dates = 'La fecha de entrada no puede ser anterior a hoy';
      } else if (checkOutD <= checkInD) {
        newErrors.dates = 'La fecha de salida debe ser posterior a la de entrada';
      } else {
        const diffDays = Math.ceil((checkOutD.getTime() - checkInD.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          newErrors.dates = 'La reserva no puede ser de más de 30 noches';
        }
      }
    }

    if (children > 0 && childrenAges.some(age => age === 0)) {
      newErrors.guests = 'Selecciona la edad de todos los niños';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

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

  const formatDateRange = () => {
    if (!checkInDate || !checkOutDate) return 'Añadir fechas';
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    return `${checkInDate.toLocaleDateString('es-ES', options)} — ${checkOutDate.toLocaleDateString('es-ES', options)}`;
  };

  const formatGuestsSummary = () => {
    const parts = [];
    parts.push(`${adults} ${adults === 1 ? 'adulto' : 'adultos'}`);
    if (children > 0) parts.push(`${children} ${children === 1 ? 'niño' : 'niños'}`);
    if (pets) parts.push('Mascotas');
    parts.push(`${rooms} ${rooms === 1 ? 'habitación' : 'habitaciones'}`);
    return parts.join(' · ');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-4">
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* DESTINO */}
        <div className="col-span-3">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            ¿Adónde vas?
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                clearError('query');

                if (value.trim().length >= 1) {
                  const filtered = COUNTRIES.filter(c =>
                    c.toLowerCase().startsWith(value.toLowerCase())
                  );
                  setSuggestions(filtered.slice(0, 3));
                } else {
                  setSuggestions([]);
                }
              }}
              placeholder="Ciudad o país"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none placeholder:text-gray-400 text-sm transition-colors ${
                errors.query ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {suggestions.map((country) => (
                  <li
                    key={country}
                    onClick={() => {
                      setQuery(country);
                      setSuggestions([]);
                      clearError('query');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    {country}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errors.query && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{errors.query}</p>
            </div>
          )}
        </div>

        {/* FECHAS */}
        <div className="col-span-3 relative">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Fechas
          </label>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDatePicker(!showDatePicker);
              setShowGuestsDropdown(false);
              clearError('dates');
            }}
            className={`w-full flex items-center gap-2 px-4 py-3 border rounded-lg hover:border-[#FF6B6B] transition-colors text-left bg-white ${
              errors.dates ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          >
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 flex-1 truncate">
              {checkInDate && checkOutDate ? formatDateRange() : 'Añadir fechas'}
            </span>
          </button>
          {errors.dates && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{errors.dates}</p>
            </div>
          )}
          {showDatePicker && (
            <DateRangePicker
              checkIn={checkInDate}
              checkOut={checkOutDate}
              onDateChange={(start, end) => {
                setCheckInDate(start);
                setCheckOutDate(end);
                if (start) setCheckIn(start.toISOString().split('T')[0]);
                if (end) setCheckOut(end.toISOString().split('T')[0]);
                clearError('dates');
              }}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>

        {/* HUÉSPEDES */}
        <div className="col-span-4 relative">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Huéspedes
          </label>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowGuestsDropdown(!showGuestsDropdown);
              setShowDatePicker(false);
            }}
            className={`w-full flex items-center gap-2 px-4 py-3 border rounded-lg hover:border-[#FF6B6B] transition-colors text-left bg-white ${
              errors.guests ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          >
            <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 flex-1 truncate">
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
          {errors.guests && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-500">{errors.guests}</p>
            </div>
          )}
          {showGuestsDropdown && (
            <GuestsDropdown
              adults={adults}
              children={children}
              childrenAges={childrenAges}
              rooms={rooms}
              pets={pets}
              onUpdate={(data) => {
                setAdults(data.adults);
                setChildren(data.children);
                setChildrenAges(data.childrenAges);
                setRooms(data.rooms);
                setPets(data.pets);
                clearError('guests');
              }}
              onClose={() => setShowGuestsDropdown(false)}
            />
          )}
        </div>

        {/* BOTÓN BUSCAR */}
        <div className="col-span-2 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF6B6B] text-white px-6 py-3 rounded-lg hover:bg-[#ff5252] transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Buscar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}