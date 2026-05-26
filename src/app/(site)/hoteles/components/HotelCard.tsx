'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Star, Wifi, Car, Waves, Coffee, Building2, Palmtree } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFavorites } from '@/hooks/useFavorites';
import { currencyToSymbol } from '@/app/lib/utils/transformers';
import type { FrontendHotel } from '@/app/lib/types/hotel';

interface HotelCardProps {
  hotel: FrontendHotel;
  nights?: number;
  currency?: string;
}

const TAG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi, 'free wi-fi': Wifi, 'wi-fi gratis': Wifi,
  parking: Car, 'free parking': Car, 'parking gratis': Car,
  pool: Waves, 'outdoor pool': Waves, piscina: Waves,
  kitchen: Coffee, cocina: Coffee,
  breakfast: Coffee, 'free breakfast': Coffee, 'desayuno gratis': Coffee,
  beach: Palmtree, playa: Palmtree,
};

function getTagIcon(name: string): React.ComponentType<{ className?: string }> | null {
  const key = name.toLowerCase();
  for (const [tag, Icon] of Object.entries(TAG_ICONS)) {
    if (key.includes(tag)) return Icon;
  }
  return null;
}

const BADGE_COLORS: Record<string, string> = {
  'Guest favourite': 'bg-white/90 text-[#0A0A0A]',
  'Favorito de los huéspedes': 'bg-white/90 text-[#0A0A0A]',
  'Popular': 'bg-white/90 text-[#0A0A0A]',
};

export default function HotelCard({ hotel, nights = 1, currency }: HotelCardProps) {
  const [toggling, setToggling] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites('hotel');
  const [liked, setLiked] = useState(() => isFavorite(hotel.id));
  const router = useRouter();
  const searchParams = useSearchParams();

  const images: string[] = hotel.images ?? [];
  const hasImage = images.length > 0;
  const badge = hotel.specialOffer ? 'Oferta especial' : hotel.rating?.score && hotel.rating.score >= 4.5 ? 'Favorito de los huéspedes' : hotel.rating?.score && hotel.rating.score >= 4 ? 'Popular' : null;
  const badgeStyle = badge ? BADGE_COLORS[badge] || 'bg-white/90 text-[#0A0A0A]' : '';

  const amenities = hotel.amenities?.slice(0, 3) || [];
  const priceAmount = hotel.price?.amount || 0;
  const priceCurrency = currency || hotel.price?.currency || 'EUR';

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (toggling) return;
    setToggling(true);
    try {
      await toggleFavorite({
        entity_id: hotel.id,
        entity_type: 'hotel',
        title: hotel.name,
      });
      setLiked(!liked);
    } catch {
      // silently fail
    } finally {
      setToggling(false);
    }
  };

  const handleClick = () => {
    const merged = new URLSearchParams(searchParams.toString());
    merged.set('hotel', hotel.id);
    router.push(`/hoteles?${merged.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const currencySymbol = currencyToSymbol(priceCurrency);

  return (
    <article
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="rounded-[18px] bg-white overflow-hidden cursor-pointer transition-all duration-[0.38s] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-[0_2px_16px_rgba(0,0,0,0.09)] group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A]"
      aria-label={`${hotel.name}, ${currencySymbol}${priceAmount} por ${nights} noche${nights !== 1 ? 's' : ''}, puntuación ${hotel.rating?.score ?? 'N/A'}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F5]">
        {hasImage ? (
          <Image
            src={images[0]}
            alt={hotel.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <Building2 className="w-12 h-12 text-neutral-300" />
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span
            className={`absolute top-3 left-3 backdrop-blur-[6px] rounded-full px-2.5 py-1 text-[11px] font-semibold pointer-events-none ${badgeStyle}`}
          >
            {badge}
          </span>
        )}

        {/* Heart */}
        <button
          onClick={handleToggleLike}
          disabled={toggling}
          className="absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-115 cursor-pointer"
          aria-label={liked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-pressed={liked}
        >
          <Heart
            className={`w-[22px] h-[22px] transition-colors duration-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] ${
              liked ? 'fill-[#E8415A] stroke-[#E8415A]' : 'stroke-white fill-transparent'
            }`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 pb-2">
        {/* Title + Rating */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-[15px] font-semibold text-[#0A0A0A] leading-tight line-clamp-1">
            {hotel.name}
          </h3>
          {hotel.rating?.score && hotel.rating.score > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-[13px] h-[13px] fill-[#0A0A0A] stroke-none" />
              <span className="text-[13.5px] font-semibold text-[#0A0A0A]">{hotel.rating.score.toFixed(1)}</span>
              <span className="text-[12px] text-[#6A7282]">({hotel.rating.reviews || 0})</span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-[12px] text-[#6A7282] mb-2.5 truncate">
          {hotel.type}{hotel.location?.city ? ` — ${hotel.location.city}` : ''}
        </p>

        {/* Amenity tags */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {amenities.map((a) => {
              const Icon = getTagIcon(a);
              return (
                <span
                  key={a}
                  className="flex items-center gap-1 text-[11px] text-[#0A0A0A] bg-[#F2F2F2] rounded-lg px-2 py-1"
                >
                  {Icon && <Icon className="w-3 h-3 stroke-current" />}
                  {a}
                </span>
              );
            })}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-[15px] font-bold text-[#0A0A0A] underline underline-offset-2 cursor-pointer">
            {currencySymbol}{priceAmount}
          </span>
          <span className="text-[12px] text-[#0A0A0A]">
            por {nights} noche{nights !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </article>
  );
}
