'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X, ChevronLeft, ChevronRight, MapPin, Star, Wifi, Coffee, Waves, Car, Dumbbell, UtensilsCrossed, ShieldCheck, Leaf, Building2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getHotelDetails } from '@/app/lib/api';
import type { FrontendHotel } from '@/app/lib/types/hotel';
import type { SearchParams } from '@/app/lib/types/hotel';
import { HotelApiError } from '@/app/lib/api/hotels';
import { useAuth } from '@/hooks/useAuth';

// ==========================================
// HELPERS
// ==========================================

function extractReviews(externalReviews: FrontendHotel['externalReviews']) {
  if (!externalReviews?.length) return null;
  return externalReviews
    .map(review => {
      const featured = review.featured_review;
      if (!featured) return null;
      return {
        author: featured.author,
        date: formatDateReadable(featured.date),
        rating: featured.score,
        comment: featured.comment,
      };
    })
    .filter(Boolean) as Array<{ author: string; date: string; rating: number; comment: string }>;
}

function formatDateReadable(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Free Wi-Fi': Wifi, 'WiFi gratis': Wifi,
  'Piscina': Waves, 'Outdoor pool': Waves,
  'Parking gratis': Car, 'Free parking': Car,
  'Gimnasio': Dumbbell, 'Fitness center': Dumbbell,
  'Desayuno gratis': Coffee, 'Free breakfast': Coffee,
  'Restaurante': UtensilsCrossed, 'Restaurant': UtensilsCrossed,
};

// ==========================================
// COMPONENT
// ==========================================

interface HotelDetailModalProps {
  hotel: FrontendHotel;
  searchParams?: SearchParams;
  onClose: () => void;
}

export default function HotelDetailModal({ hotel, searchParams, onClose }: HotelDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryError, setGalleryError] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Set<number>>(new Set());
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [hotelDetails, setHotelDetails] = useState<FrontendHotel | null>(null);
  const [detailsError, setDetailsError] = useState<{ code: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadDetails = async () => {
      if (!searchParams) { setIsLoadingDetails(false); return; }
      try {
        setIsLoadingDetails(true);
        setDetailsError(null);
        const data = await getHotelDetails(hotel.id, searchParams);
        if (cancelled) return;
        setHotelDetails(data.property);
      } catch (error) {
        if (cancelled) return;
        console.error('Error cargando detalles:', error);
        if (error instanceof HotelApiError) {
          if (error.status === 502) {
            setDetailsError({ code: 'PROVIDER_UNAVAILABLE', message: 'El proveedor rechazó la solicitud. Intentá de nuevo más tarde.' });
          } else if (error.status === 500 || error.status === 503 || error.code === 'INTERNAL_ERROR') {
            setDetailsError({ code: 'INTERNAL_ERROR', message: 'Error interno del servidor. Intentá de nuevo.' });
          } else {
            setDetailsError({ code: 'UNKNOWN', message: error.detail || 'Error al cargar los detalles del hotel.' });
          }
        } else {
          setDetailsError({ code: 'NETWORK', message: 'Error de conexión. Verificá tu internet.' });
        }
      } finally {
        if (!cancelled) setIsLoadingDetails(false);
      }
    };
    loadDetails();
    return () => { cancelled = true; };
  }, [hotel.id, searchParams]);

  const images = (hotelDetails?.images?.length ? hotelDetails.images : null) || hotel.images || [];
  const nextImage = () => { setCurrentImageIndex((prev) => (prev + 1) % images.length); setGalleryError(false); };
  const prevImage = () => { setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length); setGalleryError(false); };

  const handleReserve = () => {
    const checkInStr = searchParams?.check_in_date || '';
    const checkOutStr = searchParams?.check_out_date || '';
    const adults = searchParams?.adults || 2;
    const rooms = searchParams?.rooms || 1;
    let nights = 1;
    if (checkInStr && checkOutStr) {
      const diff = new Date(checkOutStr).getTime() - new Date(checkInStr).getTime();
      nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    router.push(
      `/hoteles/${hotel.id}/habitaciones?hotelName=${encodeURIComponent(hotel.name)}&checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${adults}&nights=${nights}&rooms=${rooms}&children=${searchParams?.children || 0}&infants=${searchParams?.infants_in_seat || 0}`
    );
  };

  const displayData = {
    images,
    description: hotelDetails?.description || hotel.description || undefined,
    amenities: hotelDetails?.amenities || hotel.amenities || [],
    checkIn: hotelDetails?.checkIn || hotel.checkIn || undefined,
    checkOut: hotelDetails?.checkOut || hotel.checkOut || undefined,
    address: hotelDetails?.address || null,
    nearbyPlaces: hotelDetails?.nearbyPlaces || [],
    reviews: extractReviews(hotelDetails?.externalReviews) || null,
    healthAndSafety: hotelDetails?.healthAndSafety || null,
    sustainability: hotelDetails?.sustainability || null,
  };

  const stars = hotelDetails?.stars || hotel.stars;
  const rating = hotelDetails?.rating || hotel.rating;
  const price = hotelDetails?.price || hotel.price;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/60" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
            <div>
              <DialogTitle className="text-2xl font-bold text-neutral-900">{hotel.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {stars && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.round(stars) }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                )}
                <span className="text-sm text-neutral-500">•</span>
                <div className="flex items-center gap-1 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4" />
                  <span>{hotel.location.city}{hotel.location.district ? `, ${hotel.location.district}` : ''}</span>
                </div>
                {displayData.address && (
                  <>
                    <span className="text-sm text-neutral-500">•</span>
                    <span className="text-sm text-neutral-500 truncate max-w-xs">{displayData.address}</span>
                  </>
                )}
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors" aria-label="Cerrar modal">
              <X className="w-6 h-6 text-neutral-600" />
            </button>
          </div>

          {isLoadingDetails ? (
            /* Loading skeleton grid */
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-6 animate-pulse">
                  <div className="aspect-video bg-[#F5F5F5] rounded-xl" />
                  <div className="space-y-3">
                    <div className="h-5 bg-[#F5F5F5] rounded w-1/3" />
                    <div className="h-4 bg-[#F5F5F5] rounded w-full" />
                    <div className="h-4 bg-[#F5F5F5] rounded w-5/6" />
                    <div className="h-4 bg-[#F5F5F5] rounded w-4/6" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-10 bg-[#F5F5F5] rounded-lg" />
                    ))}
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="bg-[#F5F5F5] rounded-xl h-80 animate-pulse" />
                </div>
              </div>
            </div>
          ) : detailsError ? (
            /* Error state */
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">
                {detailsError.code === 'PROVIDER_UNAVAILABLE' ? 'Proveedor no disponible' : 'Error al cargar detalles'}
              </h3>
              <p className="text-sm text-[#6A7282] max-w-md">{detailsError.message}</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-6">
                  {/* Galería */}
                  {displayData.images.length > 0 && (
                    <div className="relative">
                      <div className="relative h-96 rounded-xl overflow-hidden">
                        {!galleryError ? (
                          <Image src={displayData.images[currentImageIndex]} alt={`${hotel.name} - ${currentImageIndex + 1}`} fill unoptimized className="object-cover" onError={() => setGalleryError(true)} />
                        ) : (
                          <div className="bg-gradient-to-br from-neutral-400 to-neutral-600 w-full h-full flex items-center justify-center">
                            <Building2 className="w-16 h-16 text-white/50" />
                          </div>
                        )}
                        {displayData.images.length > 1 && (
                          <>
                            <button onClick={prevImage} aria-label="Imagen anterior" className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                              <ChevronLeft className="w-6 h-6 text-neutral-700" />
                            </button>
                            <button onClick={nextImage} aria-label="Siguiente imagen" className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                              <ChevronRight className="w-6 h-6 text-neutral-700" />
                            </button>
                            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                              {currentImageIndex + 1} / {displayData.images.length}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {displayData.images.slice(0, 6).map((img: string, idx: number) => (
                          <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all relative ${idx === currentImageIndex ? 'border-neutral-900' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                            {thumbErrors.has(idx) ? (
                              <div className="w-full h-full bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-white/50" />
                              </div>
                            ) : (
                              <Image src={img} alt="" fill unoptimized className="object-cover" onError={() => setThumbErrors(prev => new Set(prev).add(idx))} />
                            )}
                          </button>
                        ))}
                        {displayData.images.length > 6 && (
                          <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-neutral-100 flex items-center justify-center text-sm text-neutral-600">+{displayData.images.length - 6}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {displayData.description && (
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Descripción</h3>
                      <p className="text-neutral-700 leading-relaxed">{displayData.description}</p>
                    </div>
                  )}

                  {displayData.amenities.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Servicios</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {displayData.amenities.map((amenity: string) => {
                          const Icon = amenityIcons[amenity] || Star;
                          return (
                            <div key={amenity} className="flex items-center gap-3 text-neutral-700">
                              <Icon className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                              <span>{amenity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {displayData.healthAndSafety && displayData.healthAndSafety.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /> Salud y seguridad</h3>
                      <div className="space-y-3">
                        {displayData.healthAndSafety.map((category) => (
                          <div key={category.category} className="bg-blue-50 rounded-xl p-3">
                            <p className="font-medium text-blue-800 text-sm mb-2">{category.category}</p>
                            <div className="flex flex-wrap gap-2">
                              {category.items.map((item) => (
                                <span key={item.name} className={`text-xs px-2 py-1 rounded ${item.available ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500 line-through'}`}>
                                  {item.available ? '✓' : '✗'} {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayData.sustainability && displayData.sustainability.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2"><Leaf className="w-5 h-5 text-green-600" /> Sostenibilidad</h3>
                      <div className="space-y-3">
                        {displayData.sustainability.map((category) => (
                          <div key={category.category} className="bg-green-50 rounded-xl p-3">
                            <p className="font-medium text-green-800 text-sm mb-2">{category.category}</p>
                            <div className="flex flex-wrap gap-2">
                              {category.items.map((item) => (
                                <span key={item.name} className={`text-xs px-2 py-1 rounded ${item.available ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-500 line-through'}`}>
                                  {item.available ? '✓' : '✗'} {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rating && rating.score > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Valoraciones</h3>
                      <p className="text-sm text-neutral-500 mb-4">
                        Puntuación general: <span className="font-bold text-neutral-900">{rating.score.toFixed(1)}/5</span> ({rating.reviews} comentarios)
                      </p>
                    </div>
                  )}

                  {displayData.reviews && displayData.reviews.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-3">Comentarios de huéspedes</h3>
                      <div className="space-y-4">
                        {displayData.reviews.slice(0, 4).map((review) => (
                          <div key={review.author + review.date} className="border border-neutral-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-neutral-900">{review.author}</p>
                                <p className="text-sm text-neutral-500">{review.date}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.round(review.rating) }).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                ))}
                              </div>
                            </div>
                            <p className="text-neutral-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* COLUMNA DERECHA */}
                <div className="col-span-4">
                  <div className="sticky top-24 bg-white border border-neutral-200 rounded-xl p-5 shadow-lg">
                    {rating && rating.score > 0 && (
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200">
                        <div className="bg-neutral-900 text-white px-3 py-2 rounded-xl font-bold text-xl">{rating.score.toFixed(1)}</div>
                        <div>
                          <p className="font-semibold text-neutral-900">{rating.label}</p>
                          <p className="text-sm text-neutral-500">{rating.reviews} comentarios</p>
                        </div>
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-sm text-neutral-600 mb-1">{price.nights} noche{price.nights > 1 ? 's' : ''}, {price.adults} adulto{price.adults > 1 ? 's' : ''}</p>
                      <p className="text-4xl font-bold text-neutral-900 mb-1">{price.currency}{price.amount}</p>
                      {price.includesTaxes && <p className="text-sm text-neutral-500">Incluye impuestos y cargos</p>}
                    </div>

                    {(displayData.checkIn || displayData.checkOut) && (
                      <div className="space-y-2 mb-4 pb-4 border-b border-neutral-200 text-sm">
                        {displayData.checkIn && <div className="flex justify-between"><span className="text-neutral-600">Check-in:</span><span className="font-medium">{displayData.checkIn}</span></div>}
                        {displayData.checkOut && <div className="flex justify-between"><span className="text-neutral-600">Check-out:</span><span className="font-medium">{displayData.checkOut}</span></div>}
                        <div className="flex justify-between"><span className="text-neutral-600">Tipo:</span><span className="font-medium">{hotel.type}</span></div>
                      </div>
                    )}

                    {(hotel.freeCancellation || hotel.specialOffer || hotel.ecoCertified) && (
                      <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-neutral-200">
                        {hotel.freeCancellation && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Cancelación gratuita</span>}
                        {hotel.specialOffer && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium">Oferta especial</span>}
                        {hotel.ecoCertified && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">Eco-certificado</span>}
                      </div>
                    )}

                    <button
                      onClick={isAuthenticated ? handleReserve : () => router.push('/auth/login')}
                      className="w-full bg-neutral-900 text-white py-4 rounded-full hover:bg-neutral-800 transition-colors font-semibold text-lg cursor-pointer"
                    >
                      {isAuthenticated ? 'Reservar ahora' : 'Inicia sesión para reservar'}
                    </button>

                    {displayData.nearbyPlaces.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-neutral-200">
                        <h4 className="font-semibold text-neutral-900 mb-3">Lugares cercanos</h4>
                        <div className="space-y-2 text-sm">
                          {displayData.nearbyPlaces.slice(0, 6).map((place) => (
                            <div key={place.name} className="flex items-center justify-between text-neutral-700 py-1">
                              <span className="truncate mr-2">{place.name}</span>
                              <span className="text-neutral-500 whitespace-nowrap">
                                {place.transport?.[0] ? `${place.transport[0].type} ${place.transport[0].duration}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
