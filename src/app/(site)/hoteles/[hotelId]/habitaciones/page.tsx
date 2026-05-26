'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Users, Moon, Building2, Baby, Heart, BedDouble, AlertTriangle } from 'lucide-react';
import RoomCard from './components/RoomCard';
import { goToCheckout } from '@/app/lib/utils/checkoutUtils';
import { getHotelRooms, HotelApiError } from '@/app/lib/api';
import { queryKeys } from '@/app/lib/queries/queryKeys';

function HabitacionesContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hotelId = params.hotelId as string;

  const hotelName = searchParams.get('hotelName') || 'Hotel';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = searchParams.get('adults') || '2';
  const nights = searchParams.get('nights') || '1';
  const rooms = Number(searchParams.get('rooms') || '1');
  
  const childrenParam = searchParams.get('children') || '0';
  const infantsParam = searchParams.get('infants') || '0';

  // ==========================================
  // LOAD ROOMS via useQuery
  // ==========================================
  const {
    data: hotelRooms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [...queryKeys.hotels.rooms(hotelId), checkIn, checkOut, adults, childrenParam],
    queryFn: async () => {
      if (!checkIn || !checkOut) return [];

      try {
        const roomsData = await getHotelRooms(hotelId, {
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults: Number(adults),
          children: Number(childrenParam),
        });

        if (roomsData && Array.isArray(roomsData) && roomsData.length > 0) {
          return roomsData;
        }
        return getHotelRoomsMock(hotelId);
      } catch (err) {
        // Backend /v1/search/hotel-rooms not implemented yet — use mock data
        if (err instanceof HotelApiError) {
          console.warn('Habitaciones no disponibles (endpoint pendiente):', err.detail);
        } else {
          console.error('Error cargando habitaciones:', err);
        }
        return getHotelRoomsMock(hotelId);
      }
    },
    enabled: !!hotelId && !!checkIn && !!checkOut,
  });

  const handleSelectRoom = (roomId: string) => {
    const room = hotelRooms.find(r => r.id === roomId);
    if (!room) return;
 
    const totalPrice = room.price.total * rooms;
    const pricePerUnit = room.price.amount;
 
    goToCheckout(router, {
      type: 'hotel',
      item_id: hotelId,
      item_name: hotelName,
      check_in: checkIn,
      check_out: checkOut,
      adults: Number(adults),
      children: Number(childrenParam),
      infants: Number(infantsParam),
      nights: Number(nights),
      rooms,
      room_id: room.id,
      room_name: rooms > 1
        ? `${rooms}x ${room.name}`
        : room.name,
      price_per_unit: pricePerUnit,
      total_price: totalPrice,
      currency: room.price.currency,
      cancellation_policy: room.cancellation.free
        ? `Cancelación gratuita hasta ${room.cancellation.deadline ?? ''}`
        : 'No reembolsable',
      image: room.images[0],
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Hotel info card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 mb-8">
          <h1 suppressHydrationWarning className="text-2xl font-bold text-neutral-950 mb-4">{hotelName}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-500">
            {checkIn && checkOut && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-700">{checkIn} → {checkOut}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-neutral-400" />
              <span>{adults} adulto{Number(adults) > 1 ? 's' : ''}</span>
            </div>
            {Number(childrenParam) > 0 && (
              <div className="flex items-center gap-1.5 text-brand-600">
                <Baby className="w-4 h-4" />
                <span>{childrenParam} niño{Number(childrenParam) > 1 ? 's' : ''}</span>
              </div>
            )}
            {Number(infantsParam) > 0 && (
              <div className="flex items-center gap-1.5 text-purple-600">
                <Heart className="w-4 h-4" />
                <span>{infantsParam} bebé{Number(infantsParam) > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-neutral-400" />
              <span>{nights} noche{Number(nights) > 1 ? 's' : ''}</span>
            </div>
            {rooms > 1 && (
              <div className="flex items-center gap-1.5 text-brand-500 font-medium">
                <Building2 className="w-4 h-4" />
                <span>{rooms} habitación{rooms > 1 ? 'es' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section heading */}
        <div className="mb-6">
          <h2 suppressHydrationWarning className="text-xl font-bold text-neutral-950">Elige tu habitación</h2>
          {rooms > 1 && (
            <p className="text-sm text-neutral-500 mt-1.5">
              El precio mostrado es por habitación · Se reservarán{' '}
              <span className="font-semibold text-brand-500">{rooms} habitaciones</span> del tipo que elijas
            </p>
          )}
        </div>

        {/* States */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="grid grid-cols-12">
                  <div className="col-span-4 sm:col-span-3 aspect-[4/3] bg-neutral-100" />
                  <div className="col-span-8 sm:col-span-6 p-5 space-y-3">
                    <div className="h-5 bg-neutral-100 rounded w-2/3" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-neutral-100 rounded w-20" />
                      <div className="h-4 bg-neutral-100 rounded w-28" />
                      <div className="h-4 bg-neutral-100 rounded w-16" />
                    </div>
                    <div className="flex gap-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-6 bg-neutral-100 rounded-full w-16" />
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:flex col-span-3 p-5 flex-col items-end justify-between border-l border-neutral-100">
                    <div className="h-4 bg-neutral-100 rounded w-16" />
                    <div className="h-8 bg-neutral-100 rounded w-24" />
                    <div className="h-10 bg-neutral-100 rounded-lg w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-950 mb-2">Error al cargar habitaciones</h3>
            <p className="text-sm text-neutral-500 max-w-sm">
              {error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intentá de nuevo más tarde.'}
            </p>
          </div>
        ) : hotelRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-neutral-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-950 mb-2">Sin habitaciones disponibles</h3>
            <p className="text-sm text-neutral-500 max-w-sm">
              No encontramos habitaciones para las fechas seleccionadas. Probá con otras fechas u hotel.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hotelRooms.map((room) => (
              <RoomCard key={room.id} room={room} onSelect={handleSelectRoom} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HabitacionesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HabitacionesContent />
    </Suspense>
  );
}

// ==========================================
// MOCK HABITACIONES (fallback si backend no responde)
// ==========================================
async function getHotelRoomsMock(hotelId: string) {
  const basePrice = 80 + (hotelId.length * 15);
  
  return [
    {
      id: `room-1-${hotelId}`,
      name: `Habitación Doble Estándar`,
      images: [
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0)}`,
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 1}`,
      ],
      beds: '1 cama doble',
      capacity: 2,
      size: 20,
      amenities: ['WiFi gratis', 'TV', 'Baño privado', 'Aire acondicionado'],
      price: { amount: basePrice, currency: '€', total: basePrice * 4, nights: 4 },
      cancellation: { free: true, deadline: '48h antes' },
    },
    {
      id: `room-2-${hotelId}`,
      name: `Habitación Doble Superior`,
      images: [
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 10}`,
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 11}`,
      ],
      beds: '1 cama king size',
      capacity: 2,
      size: 30,
      amenities: ['WiFi gratis', 'TV', 'Minibar', 'Balcón', 'Baño privado'],
      price: { amount: basePrice + 50, currency: '€', total: (basePrice + 50) * 4, nights: 4 },
      cancellation: { free: true, deadline: '24h antes' },
    },
    {
      id: `room-3-${hotelId}`,
      name: `Suite Junior`,
      images: [
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 20}`,
        `https://picsum.photos/400/300?random=${hotelId.charCodeAt(0) + 21}`,
      ],
      beds: '1 cama king + sofá cama',
      capacity: 4,
      size: 45,
      amenities: ['WiFi gratis', 'TV', 'Minibar', 'Jacuzzi', 'Terraza'],
      price: { amount: basePrice + 150, currency: '€', total: (basePrice + 150) * 4, nights: 4 },
      cancellation: { free: false },
    },
  ];
}
