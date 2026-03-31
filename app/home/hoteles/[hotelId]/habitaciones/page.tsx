'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import RoomCard from './components/RoomCard';
import { goToCheckout } from '@/app/lib/utils/checkoutUtils';

// 🚧 MOCK - Eliminar cuando Marco active el endpoint de habitaciones
// ✅ TODO APARTADO 13: Reemplazar con llamada real a getHotelRooms(hotelId)
const MOCK_ROOMS = [
  {
    id: 'room-1',
    name: 'Habitación Doble Estándar',
    images: [
      'https://picsum.photos/400/300?random=10',
      'https://picsum.photos/400/300?random=11',
    ],
    beds: '1 cama doble',
    capacity: 2,
    size: 20,
    amenities: ['WiFi gratis', 'TV', 'Baño privado', 'Aire acondicionado'],
    price: { amount: 100, currency: '€', total: 400, nights: 4 },
    cancellation: { free: true, deadline: '48h antes' },
  },
  {
    id: 'room-2',
    name: 'Habitación Doble Superior',
    images: [
      'https://picsum.photos/400/300?random=20',
      'https://picsum.photos/400/300?random=21',
    ],
    beds: '1 cama king size',
    capacity: 2,
    size: 30,
    amenities: ['WiFi gratis', 'TV', 'Minibar', 'Balcón', 'Baño privado'],
    price: { amount: 150, currency: '€', total: 600, nights: 4 },
    cancellation: { free: true, deadline: '24h antes' },
  },
  {
    id: 'room-3',
    name: 'Suite Junior',
    images: [
      'https://picsum.photos/400/300?random=30',
      'https://picsum.photos/400/300?random=31',
    ],
    beds: '1 cama king + sofá cama',
    capacity: 4,
    size: 45,
    amenities: ['WiFi gratis', 'TV', 'Minibar', 'Jacuzzi', 'Terraza'],
    price: { amount: 250, currency: '€', total: 1000, nights: 4 },
    cancellation: { free: false },
  },
];

export default function HabitacionesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hotelId = params.hotelId as string;

  // Recuperar datos de búsqueda de la URL
  const hotelName = searchParams.get('hotelName') || 'Hotel';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = searchParams.get('adults') || '2';
  const nights = searchParams.get('nights') || '1';
  const rooms = Number(searchParams.get('rooms') || '1');

    const handleSelectRoom = (roomId: string) => {
    const room = MOCK_ROOMS.find(r => r.id === roomId);
    if (!room) return;
 
    // Multiplicamos precio por el número de habitaciones pedidas
    const totalPrice = room.price.total * rooms;
    const pricePerUnit = room.price.amount;
 
    goToCheckout(router, {
      type: 'hotel',
      item_id: hotelId,
      item_name: hotelName,
      check_in: checkIn,
      check_out: checkOut,
      adults: Number(adults),
      children: 0,
      nights: Number(nights),
      rooms,                              // 👈 cuántas habitaciones
      room_id: room.id,
      room_name: rooms > 1
        ? `${rooms}x ${room.name}`        // "2x Habitación Doble Estándar"
        : room.name,
      price_per_unit: pricePerUnit,
      total_price: totalPrice,            // 👈 ya multiplicado
      currency: room.price.currency,
      cancellation_policy: room.cancellation.free
        ? `Cancelación gratuita hasta ${room.cancellation.deadline ?? ''}`
        : 'No reembolsable',
      image: room.images[0],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3]">
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div className="bg-white rounded-lg shadow-md p-5">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{hotelName}</h1>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              {checkIn && checkOut && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{checkIn} → {checkOut}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{adults} adultos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span>{nights} noche{parseInt(nights) > 1 ? 's' : ''}</span>
              </div>
              {/* Mostrar cuántas habitaciones se van a reservar */}
              {rooms > 1 && (
                <div className="flex items-center gap-1.5 text-[#FF6B6B] font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{rooms} habitaciones</span>
                </div>
              )}
            </div>
          </div>
        </div>
 
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Elige tu habitación</h2>
          {rooms > 1 && (
            <p className="text-sm text-gray-500 mt-1">
              El precio mostrado es por habitación · Se reservarán <span className="font-semibold text-[#FF6B6B]">{rooms} habitaciones</span> del tipo que elijas
            </p>
          )}
        </div>
 
        {/* 🚧 MOCK activo - conectar en Apartado 13 con getHotelRooms() */}
        <div className="space-y-4">
          {MOCK_ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} onSelect={handleSelectRoom} />
          ))}
        </div>
      </div>
    </div>
  );
}