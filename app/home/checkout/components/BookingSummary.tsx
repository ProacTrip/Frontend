'use client';

import { CheckCircle, MapPin, Calendar, Users, Moon, Tag } from 'lucide-react';

// ==================== TIPO DE DATO QUE LLEGA DEL localStorage ====================
// Cada módulo (hoteles, vuelos, plan...) guarda esto antes de redirigir a /home/checkout
export interface CheckoutData {
  type: 'hotel' | 'vuelo' | 'plan' | 'experiencia';

  // Identificadores
  item_id: string;           // ID del hotel / vuelo / plan
  item_name: string;         // Nombre para mostrar

  // Fechas y huéspedes (común a todos)
  check_in: string;          // "2026-06-01"
  check_out: string;         // "2026-06-05"
  adults: number;
  children?: number;
  nights: number;

  // Habitación (solo hoteles)
  room_id?: string;
  room_name?: string;
  rooms?: number;  

  // Precio
  price_per_unit: number;    // Precio por noche / por persona / etc.
  total_price: number;       // Total sin impuestos
  currency: string;          // "EUR"

  // Política de cancelación
  cancellation_policy: string;

  // Imagen para mostrar en el resumen
  image?: string;

  // Hotel específico
  hotel_address?: string;
}

interface BookingSummaryProps {
  data: CheckoutData;
}

export default function BookingSummary({ data }: BookingSummaryProps) {
  const taxes = Math.round(data.total_price * 0.1);
  const grandTotal = data.total_price + taxes;

  // Etiqueta de unidad según tipo
  const unitLabel = () => {
    switch (data.type) {
      case 'hotel': return `${data.nights} noche${data.nights > 1 ? 's' : ''}`;
      case 'vuelo': return `${data.adults} pasajero${data.adults > 1 ? 's' : ''}`;
      case 'plan': return `${data.nights} noche${data.nights > 1 ? 's' : ''} · paquete completo`;
      case 'experiencia': return `${data.adults} persona${data.adults > 1 ? 's' : ''}`;
    }
  };

  // Badge de tipo
  const typeBadge = () => {
    const map = {
      hotel: { label: 'Hotel', color: 'bg-blue-100 text-blue-800' },
      vuelo: { label: 'Vuelo', color: 'bg-sky-100 text-sky-800' },
      plan: { label: 'Plan ProacTrip', color: 'bg-purple-100 text-purple-800' },
      experiencia: { label: 'Experiencia', color: 'bg-green-100 text-green-800' },
    };
    return map[data.type];
  };

  const badge = typeBadge();

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">

      {/* Título */}
      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">
        Resumen de reserva
      </h3>

      {/* Imagen + nombre */}
      <div className="mb-5">
        {data.image && (
          <div className="w-full h-36 rounded-lg overflow-hidden mb-3">
            <img
              src={data.image}
              alt={data.item_name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Badge de tipo */}
        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold mb-2 ${badge.color}`}>
          {badge.label}
        </span>

        <p className="font-bold text-gray-900 text-base leading-tight">{data.item_name}</p>

        {/* Habitación (solo hoteles) */}
        {data.room_name && (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            {data.room_name}
          </p>
        )}

        {/* Dirección (hoteles) */}
        {data.hotel_address && (
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {data.hotel_address}
          </p>
        )}
      </div>

      {/* Detalles de la reserva */}
      <div className="space-y-2.5 mb-5 pb-5 border-b border-gray-200">

        {/* Fechas */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400" />
            Check-in
          </span>
          <span className="font-medium text-gray-900">{data.check_in}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400" />
            Check-out
          </span>
          <span className="font-medium text-gray-900">{data.check_out}</span>
        </div>

        {/* Huéspedes */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Users className="w-4 h-4 text-gray-400" />
            Huéspedes
          </span>
          <span className="font-medium text-gray-900">
            {data.adults} adulto{data.adults > 1 ? 's' : ''}
            {data.children && data.children > 0 ? `, ${data.children} niño${data.children > 1 ? 's' : ''}` : ''}
          </span>
        </div>

        {/* Noches */}
        {data.nights > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Moon className="w-4 h-4 text-gray-400" />
              Duración
            </span>
            <span className="font-medium text-gray-900">{unitLabel()}</span>
          </div>
        )}

        {/* Habitaciones (solo hoteles con más de 1) */}
        {data.type === 'hotel' && data.rooms && data.rooms > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Tag className="w-4 h-4 text-gray-400" />
              Habitaciones
            </span>
            <span className="font-medium text-[#FF6B6B]">{data.rooms} habitaciones</span>
          </div>
        )}
      </div>

      {/* Desglose de precios */}
      <div className="space-y-2 mb-5 pb-5 border-b border-gray-200 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>
            {data.type === 'hotel'
              ? `${data.currency} ${data.price_per_unit} × ${data.nights} noche${data.nights > 1 ? 's' : ''}`
              : `Precio base`}
          </span>
          <span>{data.currency} {data.total_price}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tasas e impuestos (10%)</span>
          <span>{data.currency} {taxes}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span className="text-[#FF6B6B]">{data.currency} {grandTotal}</span>
        </div>
      </div>

      {/* Política de cancelación */}
      <div className="flex items-start gap-2 text-sm">
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <span className="text-green-700">{data.cancellation_policy}</span>
      </div>
    </div>
  );
}