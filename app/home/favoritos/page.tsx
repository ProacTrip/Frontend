'use client';

export default function FavoritosPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-8xl mb-6">❤️</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Mis Favoritos
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Guarda tus hoteles y vuelos favoritos aquí
        </p>
        <p className="text-gray-400">Próximamente...</p>
      </div>
    </div>
  );
}