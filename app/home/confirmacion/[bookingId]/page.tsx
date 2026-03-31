'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Users, Moon, Download, Home, Phone, Mail } from 'lucide-react';

export default function ConfirmacionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  // ==================== LEER DATOS DEL BACKEND (futuro) ====================
  // Por ahora reconstruimos lo que podemos desde localStorage
  // En Apartado 13 esto vendrá de GET /v1/bookings/{bookingId}
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    // 🚧 MOCK - En Apartado 13 reemplazar con:
    // const response = await apiFetch(`/v1/bookings/${bookingId}`);
    // const data = await response.json();
    // setBookingData(data);

    // Por ahora usamos fecha actual y bookingId de la URL
    setBookingData({
      booking_id: bookingId,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    });

    // Limpiar checkout_data del localStorage por si acaso no se limpió en checkout
    localStorage.removeItem('checkout_data');
  }, [bookingId]);

  const handleDownload = () => {
    window.print();
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* CSS solo para impresión/descarga */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3] py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* ==================== CABECERA ÉXITO ==================== */}
          <div className="text-center mb-8 no-print">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva confirmada!</h1>
            <p className="text-gray-600">
              Te hemos enviado un email de confirmación con todos los detalles.
            </p>
          </div>

          {/* ==================== VOUCHER ==================== */}
          <div className="print-container bg-white rounded-2xl shadow-xl overflow-hidden">

            {/* Header del voucher */}
            <div className="bg-[#FF6B6B] px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">
                    ProacTrip · Voucher de reserva
                  </p>
                  <h2 className="text-2xl font-bold">Reserva confirmada</h2>
                </div>
                <CheckCircle className="w-12 h-12 opacity-80" />
              </div>
            </div>

            {/* Código de reserva */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                Código de reserva
              </p>
              <p className="text-2xl font-bold text-gray-900 font-mono tracking-wider">
                {bookingId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Reserva realizada el {new Date(bookingData.created_at).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            {/* Detalles de la reserva */}
            {/* 🚧 MOCK - En Apartado 13 estos datos vendrán de GET /v1/bookings/{bookingId} */}
            <div className="px-8 py-6 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Detalles · disponibles cuando Marco active el endpoint
              </p>

              <div className="grid grid-cols-2 gap-4">

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Check-in</p>
                    <p className="text-sm font-bold text-gray-900">—</p>
                    <p className="text-xs text-gray-500">Desde las 14:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Check-out</p>
                    <p className="text-sm font-bold text-gray-900">—</p>
                    <p className="text-xs text-gray-500">Antes de las 12:00</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Huéspedes</p>
                    <p className="text-sm font-bold text-gray-900">—</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <Moon className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Duración</p>
                    <p className="text-sm font-bold text-gray-900">—</p>
                  </div>
                </div>

              </div>

              {/* Precio total */}
              <div className="flex items-center justify-between p-4 bg-[#fff5e6] rounded-xl border border-[#ffd4b3]">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Total pagado</p>
                  <p className="text-xs text-gray-400">IVA e impuestos incluidos</p>
                </div>
                <p className="text-2xl font-bold text-[#FF6B6B]">—</p>
              </div>
            </div>

            {/* Contacto */}
            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                ¿Necesitas ayuda?
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-[#FF6B6B]" />
                  <span>soporte@proactrip.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-[#FF6B6B]" />
                  <span>+34 900 000 000</span>
                </div>
              </div>
            </div>

            {/* Footer del voucher */}
            <div className="px-8 py-4 bg-[#FF6B6B] text-white text-center">
              <p className="text-xs opacity-80">
                ProacTrip · Sistema de Gestión de Viajes · TFG 2025
              </p>
            </div>

          </div>

          {/* ==================== BOTONES ==================== */}
          <div className="flex gap-4 mt-8 no-print">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-800 py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-semibold shadow-sm"
            >
              <Download className="w-5 h-5" />
              Descargar voucher
            </button>
            <button
              onClick={() => router.push('/home')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#FF6B6B] text-white py-3 px-6 rounded-xl hover:bg-[#ff5252] transition-colors font-semibold shadow-md"
            >
              <Home className="w-5 h-5" />
              Volver al inicio
            </button>
          </div>

          {/* Nota sobre datos reales */}
          <p className="text-center text-xs text-gray-400 mt-4 no-print">
            Los detalles completos de la reserva se mostrarán cuando el backend esté conectado
          </p>

        </div>
      </div>
    </>
  );
}