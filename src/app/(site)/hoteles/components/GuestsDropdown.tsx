'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

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
  onClose,
}: GuestsDropdownProps) {
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [childrenAges, setChildrenAges] = useState<number[]>(initialChildrenAges);
  const [rooms, setRooms] = useState(initialRooms);
  const [pets, setPets] = useState(initialPets);
  const [showPetsInfo, setShowPetsInfo] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const handleChildrenChange = (newCount: number) => {
    setChildren(newCount);
    if (newCount > children) {
      const newAges = [...childrenAges];
      for (let i = children; i < newCount; i++) newAges.push(0);
      setChildrenAges(newAges);
    } else {
      setChildrenAges(childrenAges.slice(0, newCount));
    }
  };

  const handleApply = () => {
    onUpdate({ adults, children, childrenAges, rooms, pets });
    onClose();
  };

  const counterBtn = "w-9 h-9 rounded-full border-2 border-neutral-900 text-neutral-900 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-neutral-900 font-bold text-lg";

  return (
    <>
      <div ref={dropdownRef} className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-neutral-200 p-5 z-50">
        {/* Adults + Children via custom rows with children ages */}
        <div className="space-y-4">
          {/* Adults row */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div>
              <p className="font-semibold text-neutral-900">Adultos</p>
              <p className="text-xs text-neutral-500">18 años o más</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1} className={counterBtn}>−</button>
              <span className="w-10 text-center font-semibold text-neutral-900">{adults}</span>
              <button type="button" onClick={() => setAdults(Math.min(9, adults + 1))} disabled={adults >= 9} className={counterBtn}>+</button>
            </div>
          </div>

          {/* Children row */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div>
              <p className="font-semibold text-neutral-900">Niños</p>
              <p className="text-xs text-neutral-500">2–17 años</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => handleChildrenChange(Math.max(0, children - 1))} disabled={children <= 0} className={counterBtn}>−</button>
              <span className="w-10 text-center font-semibold text-neutral-900">{children}</span>
              <button type="button" onClick={() => handleChildrenChange(Math.min(6, children + 1))} disabled={children >= 6} className={counterBtn}>+</button>
            </div>
          </div>

          {/* Children ages */}
          {children > 0 && (
            <div className="mb-4 pb-4 border-b border-neutral-200">
              <p className="text-sm font-medium text-neutral-700 mb-3">Edades de los niños</p>
              <div className="grid grid-cols-2 gap-2">
                {childrenAges.map((age, index) => (
                  <select key={index} value={age} onChange={(e) => { const newAges = [...childrenAges]; newAges[index] = parseInt(e.target.value); setChildrenAges(newAges); }} className="px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none text-sm">
                    <option value={0}>Edad (obligatorio)</option>
                    {Array.from({ length: 18 }, (_, i) => i).map((ageOption) => (
                      <option key={ageOption} value={ageOption}>{ageOption} {ageOption === 1 ? 'año' : 'años'}</option>
                    ))}
                  </select>
                ))}
              </div>
              <p className="text-xs text-neutral-600 mt-3">Para mostrarte los precios correctos y que encuentres un alojamiento con espacio para todos, necesitamos saber la edad de los niños en el momento del check-out</p>
            </div>
          )}

          {/* Rooms row — using GuestCounter pattern */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div>
              <p className="font-semibold text-neutral-900">Habitaciones</p>
              <p className="text-xs text-neutral-500">Número de habitaciones</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))} disabled={rooms <= 1} className={counterBtn}>−</button>
              <span className="w-10 text-center font-semibold text-neutral-900">{rooms}</span>
              <button type="button" onClick={() => setRooms(rooms + 1)} className={counterBtn}>+</button>
            </div>
          </div>

          {/* Pets toggle */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-neutral-900">¿Viajas con mascotas?</p>
              <p className="text-xs text-neutral-500">No incluye animales de servicio</p>
            </div>
            <label className="relative inline-block w-12 h-6 cursor-pointer">
              <input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} className="sr-only peer" />
              <div className="w-12 h-6 bg-neutral-300 rounded-full peer-checked:bg-neutral-900 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md" />
            </label>
          </div>

          <div className="mb-5 text-xs text-neutral-600">
            <p>Los animales de servicio no se consideran mascotas.</p>
            <button type="button" onClick={() => setShowPetsInfo(true)} className="text-neutral-900 hover:underline font-medium">Más info sobre viajar con animales de servicio</button>
          </div>
        </div>

        <button type="button" onClick={handleApply} className="w-full bg-neutral-900 text-white py-3 rounded-full hover:bg-neutral-800 transition-colors font-semibold">
          Listo
        </button>
      </div>

      {showPetsInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-8 max-w-md relative shadow-2xl">
            <div className="flex justify-center mb-6">
              <Image src="/service-dog.jpg" alt="Perro de servicio" width={192} height={192} className="w-48 h-48 object-cover rounded-xl" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-4 text-center">Viajar con animales de asistencia</h3>
            <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
              Los <span className="text-neutral-900 font-semibold">animales de asistencia certificados</span> son acompañantes perfectamente adiestrados que ofrecen apoyo a personas con discapacidad. Desempeñan un papel esencial, ya que ayudan a las personas con discapacidad a llevar a cabo sus tareas cotidianas con seguridad y confianza.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              En muchos países, las personas que viajan con un animal de asistencia tienen derecho a acceder a cualquier alojamiento sin pagar tasas ni aceptar condiciones adicionales, incluso si el alojamiento no admite mascotas. Los requisitos legales para animales de asistencia varían según el destino, así que conoce la legislación local antes de viajar.
            </p>
          </div>
        </div>
      )}
    </>
  );
}