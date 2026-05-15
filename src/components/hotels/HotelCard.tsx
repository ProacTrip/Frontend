'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Heart, MapPin, Sparkles, Leaf } from 'lucide-react';
import type { HotelSearchResult } from '@/lib/types/search';
import PriceDisplay from '@/components/ui/PriceDisplay';
import RatingBadge from '@/components/ui/RatingBadge';
import AmenitiesList from '@/components/ui/AmenitiesList';
import { useState } from 'react';

interface HotelCardProps {
  hotel: HotelSearchResult;
}

/** Generate star rating array 1-5 for visual display. */
function StarRating({ hotelClass }: { hotelClass: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${hotelClass} estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={i < hotelClass ? 'text-mustard fill-mustard' : 'text-paper-outline'}
        />
      ))}
    </div>
  );
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const [imageError, setImageError] = useState(false);

  const imageSrc = hotel.images?.[0]?.thumbnail;
  const hasRating = hotel.rating?.overall !== null && hotel.rating?.overall !== undefined;
  const distanceInfo = hotel.nearby_places?.[0];

  return (
    <motion.article
      className="group relative flex flex-col overflow-hidden rounded-xl border border-paper-outline bg-paper-dim transition-shadow hover:shadow-lg"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Image section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-container">
        {imageSrc && !imageError ? (
          <Image
            src={imageSrc}
            alt={hotel.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm text-ink-faint">Sin imagen</span>
          </div>
        )}

        {/* Favorite heart button */}
        <button
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
          aria-label="Guardar en favoritos"
        >
          <Heart size={16} className="text-ink-muted hover:text-coral transition-colors" />
        </button>

        {/* Badges overlay (top-left) */}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {hotel.free_cancellation && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-2 py-0.5 text-xs font-medium text-success">
              Cancelación gratis
            </span>
          )}
          {hotel.special_offer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-container px-2 py-0.5 text-xs font-medium text-warning">
              <Sparkles size={10} />
              Oferta especial
            </span>
          )}
          {hotel.eco_certified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-olive-container px-2 py-0.5 text-xs font-medium text-olive">
              <Leaf size={10} />
              Eco
            </span>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Hotel name */}
        <h3 className="text-base font-bold leading-tight text-ink line-clamp-2">
          {hotel.name}
        </h3>

        {/* Star rating + hotel class */}
        {hotel.hotel_class !== null && hotel.hotel_class !== undefined && hotel.hotel_class > 0 && (
          <div className="flex items-center gap-2">
            <StarRating hotelClass={hotel.hotel_class} />
          </div>
        )}

        {/* Location / distance */}
        {distanceInfo && (
          <div className="flex items-center gap-1 text-xs text-ink-muted">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{distanceInfo.name}</span>
            {distanceInfo.transport?.[0] && (
              <span className="whitespace-nowrap">
                · {distanceInfo.transport[0].duration} {distanceInfo.transport[0].type === 'Walking' ? 'a pie' : distanceInfo.transport[0].type === 'Taxi' ? 'en taxi' : 'transporte'}
              </span>
            )}
          </div>
        )}

        {/* Rating badge */}
        {hasRating && (
          <RatingBadge
            rating={hotel.rating.overall!}
            totalReviews={hotel.total_reviews ?? undefined}
            variant="card"
          />
        )}

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <AmenitiesList amenities={hotel.amenities} max={3} />
        )}

        {/* Spacer to push price + button to bottom */}
        <div className="flex-1" />

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-2 border-t border-paper-outline">
          <PriceDisplay price={hotel.price} variant="card" />
          <a
            href={hotel.booking_url ?? '#'}
            target={hotel.booking_url ? '_blank' : undefined}
            rel={hotel.booking_url ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center rounded-lg bg-coral px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-coral-hover"
          >
            Ver oferta
          </a>
        </div>
      </div>
    </motion.article>
  );
}
