'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { queryKeys } from '@/app/lib/queries/queryKeys';
import Loader from '@/components/ui/Loader';
import {
  User,
  Globe,
  Plane,
  HeartPulse,
  Image as ImageIcon,
} from 'lucide-react';

import {
  PersonalDataForm,
  LocaleForm,
  TravelForm,
  MedicalForm,
  AvatarForm,
} from './components';

const TABS = [
  { id: 'personal', label: 'Datos personales', icon: User },
  { id: 'locale', label: 'Idioma y moneda', icon: Globe },
  { id: 'travel', label: 'Viaje', icon: Plane },
  { id: 'medical', label: 'Médico', icon: HeartPulse },
  { id: 'avatar', label: 'Avatar', icon: ImageIcon },
];

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('personal');

  // ---- useProfile hook ----
  const {
    profile: data,
    isLoading,
    error,
  } = useProfile();

  const queryClient = useQueryClient();

  // Invalidate and refetch profile after form saves
  const reloadProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    // Avatar is now sourced from AuthContext.profileAvatar — TanStack Query is
    // the single source of truth, no localStorage cache needed.
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader text="Cargando perfil..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-lg font-semibold text-red-600 mb-4">
          Error al cargar el perfil
        </p>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={reloadProfile}
          className="px-6 py-2 bg-[--color-brand-500] text-white rounded-xl font-medium hover:bg-[--color-brand-600] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { profile, travel_preferences } = data;
  const userEmail = user?.email ?? null;

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-[--color-brand-500] to-[--color-brand-400] flex items-center justify-center border-4 border-white shadow-lg ${profile.avatar_url ? 'absolute top-0 left-0 -z-10' : ''}`}>
            <User className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">
            {profile.first_name || profile.last_name
              ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
              : 'Usuario'}
          </h1>
          {userEmail && (
            <p className="text-gray-500 mt-1">{userEmail}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[--color-brand-500] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── CONTENIDO ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'personal' && (
          <PersonalDataForm profile={profile} onSave={reloadProfile} />
        )}
        {activeTab === 'locale' && (
          <LocaleForm profile={profile} onSave={reloadProfile} />
        )}
        {activeTab === 'travel' && (
          <TravelForm
            prefs={travel_preferences ?? {
              preferred_class: null,
              seat_preference: null,
              meal_preference: null,
              special_assistance: null,
              preferred_airlines: null,
              preferred_hotels: null,
              avoid_layovers: false,
              max_layover_duration: null,
            }}
            onSave={reloadProfile}
          />
        )}
        {activeTab === 'medical' && (
          <MedicalForm onSave={reloadProfile} />
        )}
        {activeTab === 'avatar' && (
          <AvatarForm currentUrl={profile.avatar_url} onSave={reloadProfile} />
        )}
      </div>


    </div>
  );
}
