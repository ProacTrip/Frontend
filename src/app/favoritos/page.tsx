'use client';

import { useFavorites } from '@/hooks/useFavorites';
import { Favorite } from '@/app/lib/types/user';
import { Heart, Trash2, Loader, AlertCircle, Building2, Plane, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function FavoritosPage() {
  const { favorites, isLoading, error, refresh, removeFavorite } = useFavorites();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (fav: Favorite) => {
    setDeletingId(fav.id);
    try {
      await removeFavorite(fav.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const hotels = favorites.filter((f) => f.entity_type === 'hotel');
  const flights = favorites.filter((f) => f.entity_type === 'flight');
  const destinations = favorites.filter((f) => f.entity_type === 'destination');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 animate-spin text-[--color-brand-500]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-[--color-brand-500] text-white rounded-lg hover:bg-[--color-brand-600]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Mis Favoritos</h1>
          <p className="text-gray-600 text-lg mb-8">No tienes favoritos guardados todavía</p>
          <Link
            href="/hoteles"
            className="px-6 py-3 bg-[--color-brand-500] text-white rounded-xl font-medium hover:bg-[--color-brand-600] transition-colors"
          >
            Explorar hoteles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
        <Heart className="w-8 h-8 text-[--color-brand-500]" />
        Mis Favoritos
      </h1>
      <p className="text-gray-500 mb-8">
        {favorites.length} guardado{favorites.length !== 1 ? 's' : ''}
      </p>

      {/* HOTELES */}
      {hotels.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[--color-brand-500]" />
            Hoteles ({hotels.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((fav) => (
              <div
                key={fav.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-white/50" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{fav.title}</h3>
                  {fav.notes && <p className="text-sm text-gray-500 mb-3">{fav.notes}</p>}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/hoteles?hotel=${encodeURIComponent(fav.entity_id)}`}
                      className="text-[--color-brand-500] font-medium text-sm hover:underline"
                    >
                      Ver detalles
                    </Link>
                    <button
                      onClick={() => handleDelete(fav)}
                      disabled={deletingId === fav.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === fav.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VUELOS */}
      {flights.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-[--color-brand-500]" />
            Vuelos ({flights.length})
          </h2>
          <div className="space-y-3">
            {flights.map((fav) => (
              <div
                key={fav.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-gray-800">{fav.title}</h3>
                  {fav.notes && <p className="text-sm text-gray-500">{fav.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(fav)}
                  disabled={deletingId === fav.id}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === fav.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DESTINOS */}
      {destinations.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[--color-brand-500]" />
            Destinos ({destinations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destinations.map((fav) => (
              <div
                key={fav.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
              >
                <h3 className="font-medium text-gray-800">{fav.title}</h3>
                {fav.notes && <p className="text-sm text-gray-500 mt-1">{fav.notes}</p>}
                <button
                  onClick={() => handleDelete(fav)}
                  disabled={deletingId === fav.id}
                  className="mt-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === fav.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}