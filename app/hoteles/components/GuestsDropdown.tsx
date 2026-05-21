'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface GuestsDropdownProps {
  adults: number;
  children: number;
  childrenAges: number[];
  rooms: number;
  pets: boolean;
  onUpdate: (data: {
    adults: number;
    children: number;
    childrenAges: number[];
    rooms: number;
    pets: boolean;
  }) => void;
  onClose: () => void;
}

export default function GuestsDropdown({
  adults: initialAdults,
  children: initialChildren,
  childrenAges: initialChildrenAges,
  rooms: initialRooms,
  pets: initialPets,
  onUpdate,
  onClose
}: GuestsDropdownProps) {
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [childrenAges, setChildrenAges] = useState<number[]>(initialChildrenAges);
  const [rooms, setRooms] = useState(initialRooms);
  const [pets, setPets] = useState(initialPets);
  const [showPetsInfo, setShowPetsInfo] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
        }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
    }, [onClose]);

  // Actualizar edades cuando cambia el número de niños
  const handleChildrenChange = (newCount: number) => {
    setChildren(newCount);
    
    if (newCount > children) {
      const newAges = [...childrenAges];
      for (let i = children; i < newCount; i++) {
        newAges.push(0);
      }
      setChildrenAges(newAges);
    } else {
      setChildrenAges(childrenAges.slice(0, newCount));
    }
  };

  const handleApply = () => {
    onUpdate({
      adults,
      children,
      childrenAges,
      rooms,
      pets
    });
    onClose();
  };

  return (
    <>
      <div 
        ref={dropdownRef}
        className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-5 z-50"
      >
        
        {/* Adultos */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <p className="font-semibold text-gray-900">Adultos</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAdults(Math.max(1, adults - 1))}
              disabled={adults <= 1}
              className="w-9 h-9 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] flex items-center justify-center hover:bg-[#FF6B6B] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B6B] font-bold text-lg"
            >
              −
            </button>
            <span className="w-10 text-center font-semibold text-gray-900">{adults}</span>
            <button
              type="button"
              onClick={() => setAdults(adults + 1)}
              className="w-9 h-9 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] flex items-center justify-center hover:bg-[#FF6B6B] hover:text-white transition-colors font-bold text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Niños */}
        <div className="flex items-center justify-between mb-3 pb-4 border-b border-gray-200">
          <div>
            <p className="font-semibold text-gray-900">Niños</p>
            <p className="text-xs text-gray-500">0-17 años</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChildrenChange(Math.max(0, children - 1))}
              disabled={children <= 0}
              className="w-9 h-9 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] flex items-center justify-center hover:bg-[#FF6B6B] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B6B] font-bold text-lg"
            >
              −
            </button>
            <span className="w-10 text-center font-semibold text-gray-900">{children}</span>
            <button
              type="button"
              onClick={() => handleChildrenChange(children + 1)}
              disabled={children >= 6}
              className="w-9 h-9 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] flex items-center justify-center hover:bg-[#FF6B6B] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B6B] font-bold text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Edades de niños */}
        {children > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Edades de los niños</p>
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
                  <option value={0}>Edad (obligatorio)</option>
                  {Array.from({ length: 18 }, (_, i) => i).map((ageOption) => (
                    <option key={ageOption} value={ageOption}>
                      {ageOption} {ageOption === 1 ? 'año' : 'años'}
                    </option>
                  ))}
                </select>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Para mostrarte los precios correctos y que encuentres un alojamiento con espacio para todos, necesitamos saber la edad de los niños en el momento del check-out
            </p>
          </div>
        )}

        {/* Habitaciones */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <p className="font-semibold text-gray-900">Habitaciones</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRooms(Math.max(1, rooms - 1))}
              disabled={rooms <= 1}
              className="w-9 h-9 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] flex items-center justify-center hover:bg-[#FF6B6B] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B6B] font-bold text-lg"
            >
              −
            </button>
            <span className="w-10 text-center font-semibold text-gray-900">{rooms}</span>
            <button
              type="button"
              onClick={() => setRooms(rooms + 1)}
              className="w-9 h-9 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] flex items-center justify-center hover:bg-[#FF6B6B] hover:text-white transition-colors font-bold text-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Mascotas */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-900">¿Viajas con mascotas?</p>
          </div>
          <label className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              checked={pets}
              onChange={(e) => setPets(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 rounded-full peer-checked:bg-[#FF6B6B] transition-colors"></div>
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
          </label>
        </div>

        {/* Info mascotas */}
        <div className="mb-5 text-xs text-gray-600">
          <p>Los animales de servicio no se consideran mascotas.</p>
          <button
            type="button"
            onClick={() => setShowPetsInfo(true)}
            className="text-[#FF6B6B] hover:underline font-medium"
          >
            Más info sobre viajar con animales de servicio
          </button>
        </div>

        {/* Botón Listo */}
        <button
          type="button"
          onClick={handleApply}
          className="w-full bg-[#FF6B6B] text-white py-3 rounded-lg hover:bg-[#ff5252] transition-colors font-semibold shadow-md"
        >
          Listo
        </button>
      </div>

      {/* Modal info mascotas - SOLO CIERRA CON X */}
      {showPetsInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div 
            className="bg-white rounded-lg p-8 max-w-md relative shadow-2xl"
          >

            {/* Imagen del perro de servicio */}
            <div className="flex justify-center mb-6">
              <img 
                src="/service-dog.jpg" 
                alt="Perro de servicio" 
                className="w-48 h-48 object-cover rounded-lg"
              />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Viajar con animales de asistencia
            </h3>

            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Los <span className="text-[#FF6B6B] font-semibold">animales de asistencia certificados</span> son acompañantes perfectamente adiestrados que ofrecen apoyo a personas con discapacidad. Desempeñan un papel esencial, ya que ayudan a las personas con discapacidad a llevar a cabo sus tareas cotidianas con seguridad y confianza.
            </p>

            <p className="text-sm text-gray-700 leading-relaxed">
              En muchos países, las personas que viajan con un animal de asistencia tienen derecho a acceder a cualquier alojamiento sin pagar tasas ni aceptar condiciones adicionales, incluso si el alojamiento no admite mascotas. Los requisitos legales para animales de asistencia varían según el destino, así que conoce la legislación local antes de viajar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}