'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Shield,
  Leaf,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  ImageOff,
  Clock,
  Users,
  Bed,
  Bath,
  Ruler,
  Home,
  Ban,
} from 'lucide-react';
import type { HotelDetailResponse } from '@/lib/types/search';
import { getHotelDetails } from '@/lib/api/search';
import { getAmenityIcon } from '@/lib/constants/amenityIcons';

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

// ── Check-in / Check-out Card ──

function formatCheckTime(timeStr: string): string {
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';

  if (isNaN(hour)) return timeStr;

  if (hour === 0) return `12:${minutes} AM`;
  if (hour === 12) return minutes === '00' ? '12 PM' : `12:${minutes} PM`;
  if (hour > 12) {
    const h12 = hour - 12;
    return minutes === '00' ? `${h12} PM` : `${h12}:${minutes} PM`;
  }
  return minutes === '00' ? `${hour} AM` : `${hour}:${minutes} AM`;
}

function CheckInOutCard({
  checkIn,
  checkOut,
}: {
  checkIn: string;
  checkOut: string;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-ink mb-3 flex items-center gap-2" suppressHydrationWarning>
        <Clock size={18} className="text-olive" />
        Horarios
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-paper-outline bg-paper-dim p-4">
          <p className="text-xs text-ink-faint mb-1">Check-in</p>
          <p className="text-lg font-bold text-ink">{formatCheckTime(checkIn)}</p>
          <p className="text-xs text-ink-muted mt-1">Horario de entrada</p>
        </div>
        <div className="rounded-lg border border-paper-outline bg-paper-dim p-4">
          <p className="text-xs text-ink-faint mb-1">Check-out</p>
          <p className="text-lg font-bold text-ink">{formatCheckTime(checkOut)}</p>
          <p className="text-xs text-ink-muted mt-1">Horario de salida</p>
        </div>
      </div>
    </section>
  );
}

// ── Excluded Amenities ──

function ExcludedAmenitiesSection({ amenities }: { amenities: string[] }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-ink mb-3 flex items-center gap-2" suppressHydrationWarning>
        <Ban size={18} className="text-error" />
        No incluye
      </h2>
      <div className="flex flex-wrap gap-2">
        {amenities.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-error/20 bg-error-container px-3 py-1.5 text-xs text-error"
          >
            <Ban size={10} />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Capacity Card ──

function CapacityCard({
  capacity,
}: {
  capacity: NonNullable<HotelDetailResponse['capacity']>;
}) {
  const items: { icon: React.ReactNode; label: string }[] = [];

  if (capacity.unit_type) {
    items.push({
      icon: <Home size={14} />,
      label: capacity.unit_type,
    });
  }
  if (capacity.guests !== null && capacity.guests !== undefined) {
    items.push({
      icon: <Users size={14} />,
      label: `${capacity.guests} huésped${capacity.guests !== 1 ? 'es' : ''}`,
    });
  }
  if (capacity.bedrooms !== null && capacity.bedrooms !== undefined) {
    items.push({
      icon: <Bed size={14} />,
      label: `${capacity.bedrooms} dormitorio${capacity.bedrooms !== 1 ? 's' : ''}`,
    });
  }
  if (capacity.bathrooms !== null && capacity.bathrooms !== undefined) {
    items.push({
      icon: <Bath size={14} />,
      label: `${capacity.bathrooms} baño${capacity.bathrooms !== 1 ? 's' : ''}`,
    });
  }
  if (capacity.beds !== null && capacity.beds !== undefined) {
    items.push({
      icon: <Bed size={14} />,
      label: `${capacity.beds} cama${capacity.beds !== 1 ? 's' : ''}`,
    });
  }
  if (capacity.area) {
    items.push({
      icon: <Ruler size={14} />,
      label: capacity.area,
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-ink mb-3 flex items-center gap-2" suppressHydrationWarning>
        <Home size={18} className="text-olive" />
        Capacidad
      </h2>
      <div className="rounded-lg border border-paper-outline bg-paper-dim p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted"
            >
              <span className="text-ink-faint">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Ratings Histogram ──

function RatingsHistogram({
  ratings,
  totalReviews,
}: {
  ratings: { stars: number; count: number }[];
  totalReviews: number;
}) {
  if (!ratings || ratings.length === 0) return null;

  const maxCount = Math.max(...ratings.map((r) => r.count), 1);

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-ink mb-4" suppressHydrationWarning>
        Distribución de valoraciones
      </h2>
      <div className="space-y-2">
        {ratings
          .slice()
          .sort((a, b) => b.stars - a.stars)
          .map((r) => {
            const pct = (r.count / maxCount) * 100;
            return (
              <div key={r.stars} className="flex items-center gap-3">
                <span className="w-12 text-xs font-medium text-ink-muted text-right shrink-0">
                  {r.stars} ★
                </span>
                <div className="flex-1 h-3 rounded-full bg-paper-container overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-mustard"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="w-10 text-xs text-ink-muted text-right shrink-0">
                  {r.count}
                </span>
              </div>
            );
          })}
      </div>
      {totalReviews > 0 && (
        <p className="text-xs text-ink-faint mt-3">
          Basado en {totalReviews.toLocaleString()} reseñas
        </p>
      )}
    </section>
  );
}

// ── Image Lightbox ──

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { thumbnail: string; original: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const total = images.length;

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) setIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && index < total - 1) setIndex((i) => i + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, index, total]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
        aria-label="Cerrar"
      >
        <X size={24} />
      </button>

      {/* Navigation — prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i - 1); }}
          className="absolute left-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
          aria-label="Imagen anterior"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Navigation — next */}
      {index < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i + 1); }}
          className="absolute right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
          aria-label="Imagen siguiente"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Image — uses original URL for full resolution */}
      <motion.div
        key={index}
        className="relative max-w-[90vw] max-h-[85vh] w-auto h-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index].original}
          alt={`Imagen ${index + 1} de ${total}`}
          className="rounded-lg object-contain max-h-[85vh] w-auto h-auto mx-auto"
          style={{ maxWidth: '90vw' }}
        />
      </motion.div>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white font-medium">
        {index + 1} / {total}
      </div>
    </motion.div>
  );
}

// ── Image with fallback (grid thumbnails use next/image) ──

function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return width && height ? (
      <div
        className={`flex items-center justify-center bg-paper-container ${className ?? ''}`}
        style={{ width, height }}
      >
        <ImageOff size={24} className="text-ink-faint" />
      </div>
    ) : (
      <div className={`flex aspect-[4/3] items-center justify-center bg-paper-container rounded-lg ${className ?? ''}`}>
        <ImageOff size={32} className="text-ink-faint" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={!width && !height}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setHasError(true)}
    />
  );
}

// ── Main Client Component ──

type DetailStatus = 'idle' | 'loading' | 'success' | 'error';

export default function HotelDetailClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = typeof params.id === 'string' ? params.id : '';
  const query = searchParams.get('query') || undefined;
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const adults = Number(searchParams.get('adults')) || 2;
  const children = Number(searchParams.get('children')) || 0;
  const childrenAgesRaw = searchParams.get('children_ages') || '';

  const [detail, setDetail] = useState<HotelDetailResponse | null>(null);
  const [status, setStatus] = useState<DetailStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
        query,
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
  }, [id, query, checkIn, checkOut, adults, children, childrenAgesRaw]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleBack = () => {
    router.back();
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

  const mainImages = detail.images ?? [];
  const isHotel = detail.type === 'hotel';
  const hasPrice = isHotel
    ? detail.price_range !== null && detail.price_range !== undefined
    : detail.price !== null && detail.price !== undefined && detail.price.per_night.amount > 0;

  // Build booking URL params
  const bookingParams = new URLSearchParams();
  if (checkIn) bookingParams.set('check_in', checkIn);
  if (checkOut) bookingParams.set('check_out', checkOut);
  if (adults !== 2) bookingParams.set('adults', String(adults));
  bookingParams.set('name', encodeURIComponent(detail.name));
  const bookingQs = bookingParams.toString();

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

        {/* ── Image Gallery — ALL images, thumbnail URLs, priority on first 2 ── */}
        {mainImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {/* Main first image — large, above the fold */}
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-paper-container cursor-zoom-in group mb-2"
            >
              <ImageWithFallback
                src={mainImages[0].thumbnail}
                alt={`${detail.name} — foto principal`}
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </button>

            {/* Remaining images in responsive 3-column grid */}
            {mainImages.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mainImages.slice(1).map((img, i) => (
                  <button
                    key={`${img.thumbnail}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden bg-paper-container cursor-zoom-in group"
                  >
                    <ImageWithFallback
                      src={img.thumbnail}
                      alt={`${detail.name} — foto ${i + 2}`}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={i === 0}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Lightbox — uses original URLs ── */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <ImageLightbox
              images={mainImages}
              initialIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </AnimatePresence>

        {/* ── Hotel header ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
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
                  {detail.directions_url && (
                    <a
                      href={detail.directions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 ml-2 text-coral hover:text-coral-hover font-medium shrink-0"
                    >
                      Ver en Google Maps
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Price — Hotels: price_range, VR: price.per_night */}
            {hasPrice && (
              <div className="text-right shrink-0">
                {isHotel && detail.price_range ? (
                  <>
                    <p className="text-xl font-bold text-coral">
                      {detail.price_range.currency === 'USD' ? 'US$' : '€'}
                      {Math.round(detail.price_range.min)}
                    </p>
                    <p className="text-xs text-ink-faint">por noche</p>
                  </>
                ) : detail.price && detail.price.per_night.amount > 0 ? (
                  <>
                    <p className="text-xl font-bold text-coral">
                      {detail.price.currency === 'USD' ? 'US$' : '€'}
                      {Math.round(detail.price.per_night.amount)}
                    </p>
                    <p className="text-xs text-ink-faint">por noche</p>
                  </>
                ) : null}
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

        {/* ── Check-in / Check-out ── */}
        {detail.check_in && detail.check_out && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <CheckInOutCard checkIn={detail.check_in} checkOut={detail.check_out} />
          </motion.div>
        )}

        {/* ── Capacity (VR only) ── */}
        {detail.capacity && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <CapacityCard capacity={detail.capacity} />
          </motion.div>
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
              {(detail.amenities ?? []).map((amenity) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1.5 rounded-full border border-paper-outline bg-paper-dim px-3 py-1.5 text-xs text-ink-muted"
                  >
                    <Icon size={12} className="text-ink-faint" />
                    {amenity}
                  </span>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── Excluded Amenities ── */}
        {(detail.excluded_amenities ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <ExcludedAmenitiesSection amenities={detail.excluded_amenities!} />
          </motion.div>
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

        {/* ── Ratings Histogram ── */}
        {(detail.ratings ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <RatingsHistogram
              ratings={detail.ratings!}
              totalReviews={detail.total_reviews ?? 0}
            />
          </motion.div>
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
              {(detail.external_reviews ?? []).map((ext, i) => (
                <div
                  key={`${ext.source}-${i}`}
                  className="rounded-lg border border-paper-outline bg-paper-dim p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {ext.logo_url && (
                      <img
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
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-ink">{ext.featured_review.author}</span>
                        <span className="text-xs text-ink-faint">
                          {new Date(ext.featured_review.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-coral">
                          {ext.featured_review.score}/{ext.max_score}
                        </span>
                      </div>
                      <blockquote className="text-xs text-ink-muted italic border-l-2 border-mustard pl-3 mt-1">
                        {ext.featured_review.comment.length > 250
                          ? ext.featured_review.comment.slice(0, 250) + '...'
                          : ext.featured_review.comment}
                      </blockquote>
                    </div>
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
                    <img
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

        {/* ── TODO: Weather widget (Phase 2) ── */}
        {/* TODO Phase 2: Weather widget using detail.gps coordinates
            lat={detail.gps.lat} lng={detail.gps.lng}
            Will show current weather at hotel location */}

        {/* ── Booking CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-4 mt-8 p-4 bg-paper-dim border border-paper-outline rounded-xl shadow-lg"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              {detail.check_in && detail.check_out ? (
                <div className="flex items-center gap-3 text-sm text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} className="text-ink-faint" />
                    {formatCheckTime(detail.check_in)}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={14} className="text-ink-faint" />
                    {formatCheckTime(detail.check_out)}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">Consultá disponibilidad</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push(`/hotels/${id}/booking?${bookingQs}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white hover:bg-coral-hover transition-colors shrink-0"
            >
              Reservar
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
