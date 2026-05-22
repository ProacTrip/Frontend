'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import BookingSummary, { CheckoutData } from './components/BookingSummary';
import PaymentForm, { GuestData } from './components/PaymentForm';

// Clave de localStorage donde cada módulo guarda los datos antes de redirigir aquí
const CHECKOUT_KEY = 'checkout_data';

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  // ==================== LEER DATOS DEL localStorage ====================
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKOUT_KEY);
      if (!raw) {
        router.push('/hoteles');
        return;
      }
      const data: CheckoutData = JSON.parse(raw);
      setCheckoutData(data);
    } catch {
      router.push('/hoteles');
    }
  }, [router]);

  // ==================== CONFIRMAR RESERVA (useMutation) ====================
  const { mutate: confirmBooking, isPending: isLoading } = useMutation({
    mutationFn: async ({
      guest,
    }: {
      guest: GuestData;
    }) => {
      // 🚧 VERSIÓN MOCK - COMENTAR CUANDO ACTIVES EL BACKEND REAL
      console.log('🚧 [MOCK] Simulando confirmación de reserva...');
      console.log('📤 Datos del huésped:', guest);
      console.log('📤 Datos de la reserva:', checkoutData);

      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockBookingId = `BOOK-${Date.now()}`;
      console.log(`✅ [MOCK] Reserva confirmada: ${mockBookingId}`);
      return mockBookingId;
    },
    onSuccess: (bookingId: string) => {
      localStorage.removeItem(CHECKOUT_KEY);
      router.push(`/confirmacion/${bookingId}`);
    },
    onError: (err: unknown) => {
      console.error('❌ Error en el pago:', err);
      setMutationError(
        err instanceof Error ? err.message : 'Error al procesar el pago. Inténtalo de nuevo.',
      );
    },
  });

  const handleConfirm = (guest: GuestData) => {
    if (!checkoutData) return;
    setMutationError(null);
    confirmBooking({ guest });
  };

  // ==================== LOADING INICIAL ====================
  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const grandTotal = checkoutData.total_price + Math.round(checkoutData.total_price * 0.1);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fff5e6] via-[#ffe4cc] to-[#ffd4b3]">
      <div className="max-w-6xl mx-auto p-6">

        {/* CABECERA */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Finalizar reserva</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Rellena tus datos y confirma el pago para completar tu reserva
          </p>
        </div>

        {/* ERROR GLOBAL */}
        {mutationError && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Error al procesar el pago</p>
              <p className="text-sm text-red-600 mt-0.5">{mutationError}</p>
            </div>
          </div>
        )}

        {/* GRID: Formulario (izquierda) + Resumen (derecha) */}
        <div className="grid grid-cols-12 gap-6">

          {/* Formulario de pago */}
          <div className="col-span-7">
            <PaymentForm
              totalAmount={checkoutData.total_price}
              currency={checkoutData.currency}
              isLoading={isLoading}
              onSubmit={handleConfirm}
            />
          </div>

          {/* Resumen de reserva */}
          <div className="col-span-5">
            <BookingSummary data={checkoutData} />
          </div>

        </div>

      </div>
    </div>
  );
}