'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Wifi,
  Shield,
  Leaf,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { HotelDetailResponse } from '@/lib/types/search';
import { getHotelDetails } from '@/lib/api/search';

// ── Sub-components ──

function StarRating({ hotelClass }: { hotelClass: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${hotelClass} estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < hotelClass ? 'text-mustard fill-mustard' : 'text-paper-outline'
          }
        />
      ))}
    </div>
  );
}

function RatingBadge({ overall }: { overall: number }) {
  const colorClass =
    overall >= 9 ? 'bg-rating-excellent' :
    overall >= 8 ? 'bg-rating-great' :
    overall >= 7 ? 'bg-rating-good' :
    'bg-rating-fair';
  return (
    <span className={`inline-flex items-center rounded-lg ${colorClass} px-2.5 py-1 text-xs font-bold text-white`}>
      {overall.toFixed(1)}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="aspect-[16/9] w-full rounded-xl bg-paper-container" />
      <div className="space-y-3">
        <div className="h-7 w-1/2 rounded bg-paper-container" />
        <div className="h-5 w-1/3 rounded bg-paper-container" />
        <div className="h-4 w-2/3 rounded bg-paper-container" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-10 rounded-lg bg-paper-container" />
        ))}
      </div>
    </div>
  );
}

function ReviewBar({
  name,
  positive,
  total_mentioned,
}: {
  name: string;
  positive: number;
  total_mentioned: number;
}) {
  const pct = total_mentioned > 0 ? (positive / total_mentioned) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-medium text-ink-muted shrink-0">{name}</span>
      <div className="flex-1 h-2 rounded-full bg-paper-container overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-olive"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-semibold text-ink w-10 text-right">{Math.round(pct)}%</span>
    </div>
  );
}

function HealthSafetySection({
  categories,
}: {
  categories: NonNullable<HotelDetailResponse['health_and_safety']>;
}) {
  return (
    <section>
      <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2" suppressHydrationWarning>
        <Shield size={18} className="text-olive" />
        Salud y seguridad
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="rounded-lg border border-paper-outline bg-paper-dim p-3"
          >
            <p className="text-sm font-semibold text-ink mb-2">{cat.category}</p>
            <ul className="space-y-1">
              {cat.items.map((item) => (
                <li key={item.name} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      item.available ? 'bg-success' : 'bg-error'
                    }`}
                  />
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function SustainabilitySection({
  categories,
}: {
  categories: NonNullable<HotelDetailResponse['sustainability']>;
}) {
  return (
    <section>
      <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2" suppressHydrationWarning>
        <Leaf size={18} className="text-olive" />
        Sostenibilidad
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="rounded-lg border border-paper-outline bg-paper-dim p-3"
          >
            <p className="text-sm font-semibold text-ink mb-2">{cat.category}</p>
            <ul className="space-y-1">
              {cat.items.map((item) => (
                <li key={item.name} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      item.available ? 'bg-success' : 'bg-error'
                    }`}
                  />
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main Client Component ──

type DetailStatus = 'idle' | 'loading' | 'success' | 'error';

export default function HotelDetailClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = typeof params.id === 'string' ? params.id : '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const adults = Number(searchParams.get('adults')) || 2;
  const children = Number(searchParams.get('children')) || 0;
  const childrenAgesRaw = searchParams.get('children_ages') || '';

  const [detail, setDetail] = useState<HotelDetailResponse | null>(null);
  const [status, setStatus] = useState<DetailStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setStatus('loading');
    setError(null);
    try {
      const childrenAges = childrenAgesRaw
        ? childrenAgesRaw.split(',').map(Number).filter((n) => !isNaN(n) && n >= 1 && n <= 17)
        : [];
      const data = await getHotelDetails({
        id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
        children: children > 0 ? children : undefined,
        children_ages: children > 0 && childrenAges.length > 0 ? childrenAges : undefined,
      });
      setDetail(data);
      setStatus('success');
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      setError(apiErr.message || 'No se pudo cargar el detalle del hotel.');
      setStatus('error');
    }
  }, [id, checkIn, checkOut, adults, children, childrenAgesRaw]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleBack = () => {
    if (checkIn && checkOut) {
      const qs = new URLSearchParams();
      qs.set('query', searchParams.get('query') || '');
      qs.set('check_in', checkIn);
      qs.set('check_out', checkOut);
      if (adults !== 2) qs.set('adults', String(adults));
      if (children > 0) {
        qs.set('children', String(children));
        if (childrenAgesRaw) qs.set('children_ages', childrenAgesRaw);
      }
      // Preserve filter state from search params if available
      const vr = searchParams.get('vr');
      if (vr) qs.set('vr', vr);
      router.push(`/hotels?${qs.toString()}`);
    } else {
      router.push('/hotels');
    }
  };

  // ── Render ──

  if (!id) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
        <p className="text-ink-muted">ID de hotel no válido.</p>
      </div>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="min-h-screen bg-paper font-[family-name:var(--font-geist-sans)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a resultados
          </button>
          <Skeleton />
        </div>
      </div>
    );
  }

  if (status === 'error' || !detail) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 font-[family-name:var(--font-geist-sans)]">
        <p className="text-error font-semibold text-lg">{error || 'Error al cargar'}</p>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 rounded-lg bg-coral px-4 py-2 text-sm font-bold text-white hover:bg-coral-hover transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>
    );
  }

  const mainImages = (detail.images ?? []).slice(0, 4);
  const hasPrice = detail.price_range || detail.price;

  return (
    <div className="min-h-screen bg-paper font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Back button ── */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a resultados
        </button>

        {/* ── Image Gallery ── */}
        {mainImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden"
          >
            {mainImages.slice(0, 1).map((img, i) => (
              <div key={i} className="aspect-[16/9] sm:aspect-auto sm:row-span-2 relative overflow-hidden bg-paper-container">
                <Image
                  src={img.original}
                  alt={`${detail.name} — foto principal`}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              {mainImages.slice(1, 5).map((img, i) => (
                <div key={i} className="aspect-[4/3] relative overflow-hidden bg-paper-container">
                  <Image
                    src={img.original}
                    alt={`${detail.name} — foto ${i + 2}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Hotel header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink" suppressHydrationWarning>
                {detail.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {detail.hotel_class !== null &&
                  detail.hotel_class !== undefined &&
                  detail.hotel_class > 0 && (
                    <StarRating hotelClass={detail.hotel_class} />
                  )}
                {detail.rating.overall !== null && detail.rating.overall !== undefined && (
                  <RatingBadge overall={detail.rating.overall} />
                )}
                {detail.total_reviews !== null && detail.total_reviews !== undefined && (
                  <span className="text-xs text-ink-muted">
                    {detail.total_reviews.toLocaleString()} reseñas
                  </span>
                )}
              </div>
              {detail.address && (
                <div className="flex items-start gap-1.5 mt-2 text-xs text-ink-muted">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{detail.address}</span>
                </div>
              )}
            </div>

            {/* Price */}
            {hasPrice && (
              <div className="text-right shrink-0">
                {detail.price_range && (
                  <>
                    <p className="text-xs text-ink-muted">Desde</p>
                    <p className="text-xl font-bold text-coral">
                      {detail.price_range.currency === 'USD' ? 'US$' : '€'}
                      {Math.round(detail.price_range.min)}
                    </p>
                    <p className="text-xs text-ink-faint">por noche</p>
                  </>
                )}
                {detail.price && (
                  <>
                    <p className="text-xs text-ink-muted">Desde</p>
                    <p className="text-xl font-bold text-coral">
                      {detail.price.currency === 'USD' ? 'US$' : '€'}
                      {Math.round(detail.price.per_night.amount)}
                    </p>
                    <p className="text-xs text-ink-faint">por noche</p>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Description ── */}
        {detail.description && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-ink mb-3" suppressHydrationWarning>
              Sobre este alojamiento
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">{detail.description}</p>
          </motion.section>
        )}

        {/* ── Amenities ── */}
        {(detail.amenities ?? []).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-ink mb-3" suppressHydrationWarning>
              Servicios
            </h2>
            <div className="flex flex-wrap gap-2">
              {(detail.amenities ?? []).map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1.5 rounded-full border border-paper-outline bg-paper-dim px-3 py-1.5 text-xs text-ink-muted"
                >
                  <Wifi size={12} className="text-ink-faint" />
                  {amenity}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Reviews Breakdown ── */}
        {(detail.reviews_breakdown ?? []).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-ink mb-4" suppressHydrationWarning>
              Valoraciones de huéspedes
            </h2>
            <div className="space-y-3">
              {(detail.reviews_breakdown ?? []).map((rb) => (
                <ReviewBar
                  key={rb.name}
                  name={rb.name}
                  positive={rb.positive}
                  total_mentioned={rb.total_mentioned}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* ── External Reviews ── */}
        {(detail.external_reviews ?? []).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-ink mb-3 flex items-center gap-2" suppressHydrationWarning>
              <ExternalLink size={16} className="text-coral" />
              Reseñas externas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(detail.external_reviews ?? []).map((ext) => (
                <div
                  key={ext.source}
                  className="rounded-lg border border-paper-outline bg-paper-dim p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {ext.logo_url && (
                      <Image
                        src={ext.logo_url}
                        alt={ext.source}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    )}
                    <span className="text-sm font-semibold text-ink">{ext.source}</span>
                    <span className="ml-auto inline-flex items-center rounded-md bg-coral-container px-2 py-0.5 text-xs font-bold text-coral-on-container">
                      {ext.score}/{ext.max_score}
                    </span>
                  </div>
                  {ext.featured_review && (
                    <blockquote className="text-xs text-ink-muted italic mt-2 border-l-2 border-paper-outline pl-3">
                      {ext.featured_review.comment.length > 200
                        ? ext.featured_review.comment.slice(0, 200) + '...'
                        : ext.featured_review.comment}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Health & Safety ── */}
        {(detail.health_and_safety ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <HealthSafetySection categories={detail.health_and_safety!} />
          </motion.div>
        )}

        {/* ── Sustainability ── */}
        {(detail.sustainability ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <SustainabilitySection categories={detail.sustainability!} />
          </motion.div>
        )}

        {/* ── Nearby Places ── */}
        {(detail.nearby_places ?? []).length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-ink mb-3" suppressHydrationWarning>
              Lugares cercanos
            </h2>
            <ul className="divide-y divide-paper-outline">
              {(detail.nearby_places ?? []).map((place) => (
                <li
                  key={`${place.name}-${place.category}`}
                  className="flex items-center gap-3 py-3"
                >
                  {place.thumbnail_url ? (
                    <Image
                      src={place.thumbnail_url}
                      alt={place.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-paper-container shrink-0 flex items-center justify-center">
                      <MapPin size={16} className="text-ink-faint" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink truncate">
                        {place.name}
                      </span>
                      {place.rating !== null && place.rating !== undefined && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-ink-muted shrink-0">
                          <Star size={10} className="text-mustard fill-mustard" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {place.description && (
                      <p className="text-xs text-ink-faint truncate">{place.description}</p>
                    )}
                  </div>
                  {place.transport?.[0] && (
                    <span className="text-xs text-ink-muted shrink-0 flex items-center gap-1">
                      <ChevronRight size={12} />
                      {place.transport[0].duration}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ── Booking CTA ── */}
        {detail.booking_url && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="sticky bottom-4 mt-8 p-4 bg-paper-dim border border-paper-outline rounded-xl shadow-lg"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm text-ink-muted">
                  {detail.check_in && detail.check_out
                    ? `Check-in: ${detail.check_in} · Check-out: ${detail.check_out}`
                    : 'Consultá disponibilidad en el sitio oficial'}
                </p>
              </div>
              <a
                href={detail.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white hover:bg-coral-hover transition-colors shrink-0"
              >
                <ExternalLink size={16} />
                Ver oferta
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
