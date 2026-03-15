'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, UserProfile, apiFetch } from '@/app/lib/api';
import { COUNTRIES, getCountryByCode } from '@/app/lib/constants/countries';
import { AVATARS, DEFAULT_AVATAR } from '@/app/lib/constants/avatars';
import Loader from '@/components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, Globe, Save, X, Pencil, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
  const [phonePrefix, setPhonePrefix] = useState('+34');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cargar perfil al montar el componente
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getUserProfile();
        if (data) {
          setProfile(data);
          setFormData(data);
          
          // Parsear teléfono si existe
          if (data.phone) {
            const match = data.phone.match(/^(\+\d+)\s?(.*)$/);
            if (match) {
              setPhonePrefix(match[1]);
              setPhoneNumber(match[2]);
            }
          }
          
          // Si tiene avatar_url que es un emoji, usarlo
          if (data.avatar_url && AVATARS.includes(data.avatar_url)) {
            setSelectedAvatar(data.avatar_url);
          }
        } else {
          setError('No se pudo cargar el perfil. Intenta de nuevo.');
        }
      } catch (err) {
        setError('Error de conexión con el servidor.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Si cambia la nacionalidad, actualizar prefijo telefónico
    if (name === 'nationality') {
      const country = COUNTRIES.find(c => c.code === value);
      if (country) {
        setPhonePrefix(country.phone);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      // Combinar prefijo + número de teléfono
      const fullPhone = phoneNumber ? `${phonePrefix} ${phoneNumber}` : '';
      
      const dataToSend = {
        ...formData,
        phone: fullPhone,
        avatar_url: selectedAvatar, // Guardar el emoji como avatar
      };

      const response = await apiFetch('/api/v1/user/profile', {
        method: 'PUT',
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfile(updatedData);
        setSuccessMsg('¡Perfil actualizado con éxito!');
        setIsEditing(false);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar los cambios.');
      }
    } catch (err) {
      setError('Hubo un problema al conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader text="Cargando tu perfil..." />
      </div>
    );
  }

  // Estado de error
  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Ups! Algo salió mal</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button 
          onClick={() => router.refresh()} 
          className="px-6 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#ff5252]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        
        {/* MENSAJE DE ÉXITO */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5" /> {successMsg}
            </motion.div>
          )}
          
          {/* MENSAJE DE ERROR */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CABECERA CON AVATAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            
            {/* AVATAR */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#ff8a80] flex items-center justify-center border-4 border-white shadow-lg text-6xl">
                {selectedAvatar}
              </div>
              
              {isEditing && (
                <button 
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-[#FF6B6B] hover:scale-110 transition-transform"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* SELECTOR DE AVATAR */}
            {isEditing && showAvatarPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute z-10 mt-40 bg-white rounded-xl shadow-xl border border-gray-200 p-4 grid grid-cols-5 gap-3"
              >
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setSelectedAvatar(emoji);
                      setShowAvatarPicker(false);
                    }}
                    className={`text-4xl hover:scale-125 transition-transform ${
                      selectedAvatar === emoji ? 'ring-4 ring-[#FF6B6B] rounded-lg' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}

            {/* INFO BÁSICA */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-1">
                {profile?.display_name || 
                 `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
                 'Viajero ProacTrip'}
              </h1>
              <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" /> {profile?.email}
              </p>
            </div>

            {/* BOTONES EDITAR/GUARDAR */}
            <div className="flex gap-2">
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  isEditing 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-[#FF6B6B] text-white hover:bg-[#ff5252]'
                } shadow-lg disabled:opacity-50`}
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isEditing ? (
                  <Save className="w-5 h-5" />
                ) : (
                  <Pencil className="w-5 h-5" />
                )}
                {isEditing ? 'Guardar' : 'Editar'}
              </button>
              
              {isEditing && (
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(profile || {});
                  }} 
                  className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATOS PERSONALES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-[#FF6B6B]" /> Datos Personales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* NOMBRE */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Nombre
              </label>
              {isEditing ? (
                <input 
                  name="first_name" 
                  value={formData.first_name || ''} 
                  onChange={handleChange} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] outline-none transition-all" 
                  placeholder="Tu nombre"
                />
              ) : (
                <p className="text-lg text-gray-800 font-medium">
                  {profile?.first_name || '—'}
                </p>
              )}
            </div>

            {/* APELLIDO */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Apellido
              </label>
              {isEditing ? (
                <input 
                  name="last_name" 
                  value={formData.last_name || ''} 
                  onChange={handleChange} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] outline-none transition-all" 
                  placeholder="Tu apellido"
                />
              ) : (
                <p className="text-lg text-gray-800 font-medium">
                  {profile?.last_name || '—'}
                </p>
              )}
            </div>

            {/* NACIONALIDAD */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" /> Nacionalidad
              </label>
              {isEditing ? (
                <select
                  name="nationality"
                  value={formData.nationality || ''}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] outline-none transition-all"
                >
                  <option value="">Selecciona tu país</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-lg text-gray-800 font-medium">
                  {getCountryByCode(profile?.nationality || '')
                    ? `${getCountryByCode(profile?.nationality!)?.flag} ${getCountryByCode(profile?.nationality!)?.name}`
                    : 'No especificada'}
                </p>
              )}
            </div>

            {/* TELÉFONO */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4" /> Teléfono
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phonePrefix}
                    disabled
                    className="w-20 p-3 bg-gray-200 border border-gray-300 rounded-xl text-center font-mono"
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="123 456 789"
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] outline-none"
                  />
                </div>
              ) : (
                <p className="text-lg text-gray-800 font-medium">
                  {profile?.phone || 'No especificado'}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* PREFERENCIAS DE VIAJE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#FF6B6B]" /> Preferencias de Viaje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="text-xs font-bold text-gray-400 uppercase">Idioma</label>
              <p className="text-gray-800 font-bold mt-1">
                {profile?.preferred_language?.toUpperCase() || 'ES'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="text-xs font-bold text-gray-400 uppercase">Moneda</label>
              <p className="text-gray-800 font-bold mt-1">
                {profile?.preferred_currency || 'EUR'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="text-xs font-bold text-gray-400 uppercase">Zona Horaria</label>
              <p className="text-gray-800 font-bold mt-1 text-sm truncate">
                {profile?.timezone || 'Europe/Madrid'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            💡 Las preferencias se detectarán automáticamente según tu ubicación
          </p>
        </div>

      </motion.div>
    </div>
  );
}