'use client';

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          ¡Bienvenido a ProacTrip! 🌍
        </h1>
        <p className="text-gray-600 text-lg">
          Descubre los mejores destinos y planifica tu próximo viaje.
        </p>
      </div>

      {/* PLACEHOLDER PARA FUTURO CONTENIDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Hoteles</h2>
          <p className="text-gray-600">Encuentra los mejores hoteles al mejor precio...</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Vuelos</h2>
          <p className="text-gray-600">Compara vuelos y ahorra en tus viajes...</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Actividades</h2>
          <p className="text-gray-600">Descubre experiencias únicas en cada destino...</p>
        </div>
      </div>
    </div>
  );
}