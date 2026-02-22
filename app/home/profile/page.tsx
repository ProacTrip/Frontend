'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, UserProfile } from '@/app/lib/api';
import Loader from '@/components/ui/Loader';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar perfil al montar el componente
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      const data = await getUserProfile();

      if (data) {
        setProfile(data);
      } else {
        setError('No se pudo cargar el perfil. Intenta de nuevo.');
      }

      setIsLoading(false);
    };

    loadProfile();
  }, []);

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader text="Cargando perfil..." />
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Estado sin perfil (no debería pasar, pero por si acaso)
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🤷</div>
          <p className="text-gray-600">No se encontró información del perfil</p>
        </div>
      </div>
    );
  }

  // ✅ ESTADO PRINCIPAL: Mostrar perfil
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* CABECERA */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center gap-6">
            {/* AVATAR */}
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#FF6B6B]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#ff8a80] flex items-center justify-center border-4 border-[#FF6B6B]">
                  <span className="text-white text-3xl font-bold">
                    {profile.first_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* INFO BÁSICA */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {profile.display_name || 
                 `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
                 'Usuario'}
              </h1>
              <p className="text-gray-600 mb-2">{profile.email}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  ✓ Email verificado
                </span>
              </div>
            </div>

            {/* BOTÓN EDITAR (próximamente) */}
            <button
              onClick={() => alert('Edición de perfil: Próximamente')}
              className="px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252] transition-colors"
            >
              ✏️ Editar
            </button>
          </div>
        </div>

        {/* INFORMACIÓN PERSONAL */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Información Personal</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nombre
              </label>
              <p className="text-gray-800 font-medium">
                {profile.first_name || 'No especificado'}
              </p>
            </div>

            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Apellido
              </label>
              <p className="text-gray-800 font-medium">
                {profile.last_name || 'No especificado'}
              </p>
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Fecha de Nacimiento
              </label>
              <p className="text-gray-800 font-medium">
                {profile.date_of_birth 
                  ? new Date(profile.date_of_birth).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'No especificado'}
              </p>
            </div>

            {/* Nacionalidad */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nacionalidad
              </label>
              <p className="text-gray-800 font-medium">
                {profile.nationality || 'No especificado'}
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Teléfono
              </label>
              <p className="text-gray-800 font-medium">
                {profile.phone || 'No especificado'}
              </p>
            </div>
          </div>
        </div>

        {/* PREFERENCIAS */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Preferencias</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Idioma */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Idioma
              </label>
              <p className="text-gray-800 font-medium">
                {profile.preferred_language?.toUpperCase() || 'ES'}
              </p>
            </div>

            {/* Moneda */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Moneda
              </label>
              <p className="text-gray-800 font-medium">
                {profile.preferred_currency || 'EUR'}
              </p>
            </div>

            {/* Zona horaria */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Zona Horaria
              </label>
              <p className="text-gray-800 font-medium">
                {profile.timezone || 'Europe/Madrid'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}