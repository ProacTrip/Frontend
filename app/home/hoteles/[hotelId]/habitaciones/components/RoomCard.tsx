'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Maximize, BedDouble, CheckCircle, XCircle } from 'lucide-react';

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    images: string[];
    beds: string;
    capacity: number;
    size: number; // m²
    amenities: string[];
    price: {
      amount: number;
      currency: string;
      total: number; // precio total (noches x precio)
      nights: number;
    };
    cancellation: {
      free: boolean;
      deadline?: string; // "hasta 24h antes"
    };
  };
  onSelect: (roomId: string) => void;
}

export default function RoomCard({ room, onSelect }: RoomCardProps) {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="grid grid-cols-12">

        {/* IMAGEN */}
        <div className="col-span-3 relative">
          <div className="relative h-full min-h-[200px]">
            <img
              src={room.images[currentImage]}
              alt={room.name}
              className="w-full h-full object-cover"
            />
            {room.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage(p => (p - 1 + room.images.length) % room.images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => setCurrentImage(p => (p + 1) % room.images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* INFO */}
        <div className="col-span-6 p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-3">{room.name}</h3>

          {/* Características */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-gray-400" />
              <span>{room.beds}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-400" />
              <span>Máx. {room.capacity} personas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="w-4 h-4 text-gray-400" />
              <span>{room.size} m²</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-4">
            {room.amenities.map((amenity) => (
              <span
                key={amenity}
                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>

          {/* Cancelación */}
          <div className="flex items-center gap-1.5 text-sm">
            {room.cancellation.free ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">
                  Cancelación gratuita {room.cancellation.deadline ? `hasta ${room.cancellation.deadline}` : ''}
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-500 font-medium">No reembolsable</span>
              </>
            )}
          </div>
        </div>

        {/* PRECIO Y BOTÓN */}
        <div className="col-span-3 p-5 flex flex-col items-end justify-between border-l border-gray-100">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">{room.price.nights} noche{room.price.nights > 1 ? 's' : ''}</p>
            <p className="text-3xl font-bold text-gray-900">
              {room.price.currency}{room.price.amount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total: {room.price.currency}{room.price.total}
            </p>
          </div>

          <button
            onClick={() => onSelect(room.id)}
            className="w-full bg-[#FF6B6B] text-white py-3 px-4 rounded-lg hover:bg-[#ff5252] transition-colors font-semibold text-sm mt-4"
          >
            Seleccionar
          </button>
        </div>

      </div>
    </div>
  );
}