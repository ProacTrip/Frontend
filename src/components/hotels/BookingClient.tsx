'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, CheckCircle, Home } from 'lucide-react';
import type { HotelDetailResponse } from '@/lib/types/search';
import { getHotelDetails } from '@/lib/api/search';

type BookingStatus = 'loading' | 'success' | 'error';

export default function BookingClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = typeof params.id === 'string' ? params.id : '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const adults = Number(searchParams.get('adults')) || 2;
  const name = decodeURIComponent(searchParams.get('name') || '');

  const [detail, setDetail] = useState<HotelDetailResponse | null>(null);
  const [status, setStatus] = useState<BookingStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setStatus('loading');
    try {
      const data = await getHotelDetails({
        id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
      });
      setDetail(data);
      setStatus('success');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'No se pudo cargar la información.');
      setStatus('error');
    }
  }, [id, checkIn, checkOut, adults]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const displayName = detail?.name || name || 'Alojamiento';
  const mainImage = (detail?.images ?? [])[0];

  // Price formatting
  const priceText = detail
    ? detail.type === 'hotel' && detail.price_range
      ? `${detail.price_range.currency === 'USD' ? 'US$' : '€'}${Math.round(detail.price_range.min)} por noche`
      : detail.price && detail.price.per_night.amount > 0
        ? `${detail.price.currency === 'USD' ? 'US$' : '€'}${Math.round(detail.price.per_night.amount)} por noche`
        : null
    : null;

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-paper font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al hotel
        </button>

        {status === 'loading' && (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-1/3 rounded bg-paper-container" />
            <div className="aspect-[16/9] w-full rounded-xl bg-paper-container" />
            <div className="space-y-3">
              <div className="h-5 w-2/3 rounded bg-paper-container" />
              <div className="h-4 w-1/2 rounded bg-paper-container" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-error font-semibold text-lg mb-4">{error || 'Error al cargar'}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-bold text-white hover:bg-coral-hover transition-colors"
            >
              <ArrowLeft size={16} />
              Volver al hotel
            </button>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Success badge */}
            <div className="flex items-center justify-center mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-success-container px-4 py-1.5 text-sm font-semibold text-success">
                <CheckCircle size={16} />
                Reserva confirmada (ficticia)
              </span>
            </div>

            {/* Booking summary card */}
            <div className="rounded-xl border border-paper-outline bg-paper-dim overflow-hidden shadow-sm">
              {/* Hotel image */}
              {mainImage && (
                <div className="relative w-full aspect-[16/9] bg-paper-container">
                  <Image
                    src={mainImage.thumbnail}
                    alt={displayName}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              <div className="p-6">
                {/* Hotel name */}
                <h1 className="text-xl font-bold text-ink mb-5" suppressHydrationWarning>
                  {displayName}
                </h1>

                {/* Details grid */}
                <div className="space-y-4">
                  {/* Dates */}
                  {(checkIn || checkOut) && (
                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-ink-faint shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-ink-faint mb-0.5">Fechas</p>
                        <p className="text-sm font-medium text-ink">
                          {checkIn ? formatDisplayDate(checkIn) : '—'}
                          {' — '}
                          {checkOut ? formatDisplayDate(checkOut) : '—'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Guests */}
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-ink-faint shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-ink-faint mb-0.5">Huéspedes</p>
                      <p className="text-sm font-medium text-ink">
                        {adults} adulto{adults !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  {priceText && (
                    <div className="flex items-start gap-3">
                      <div className="w-[18px] h-[18px] shrink-0 mt-0.5 flex items-center justify-center">
                        <span className="text-sm font-bold text-coral">€</span>
                      </div>
                      <div>
                        <p className="text-xs text-ink-faint mb-0.5">Precio</p>
                        <p className="text-sm font-semibold text-coral">{priceText}</p>
                      </div>
                    </div>
                  )}

                  {/* Type */}
                  <div className="flex items-start gap-3">
                    <Home size={18} className="text-ink-faint shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-ink-faint mb-0.5">Tipo</p>
                      <p className="text-sm font-medium text-ink capitalize">
                        {detail?.type === 'vacation_rental' ? 'Alquiler vacacional' : 'Hotel'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-paper-outline" />

                {/* Disclaimer */}
                <p className="text-xs text-ink-faint leading-relaxed">
                  Esta es una reserva de demostración. En la versión final, aquí se integrará
                  el proceso de pago real con confirmación por email.
                </p>
              </div>
            </div>

            {/* Back button */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-lg bg-paper-container px-6 py-3 text-sm font-medium text-ink hover:bg-paper-outline transition-colors"
              >
                <ArrowLeft size={16} />
                Volver al hotel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
