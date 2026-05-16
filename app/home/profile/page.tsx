'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getProfile, ProfileResponse, listMedicalPending } from '@/app/lib/api';
import Loader from '@/components/ui/Loader';
import {
  User,
  Globe,
  Plane,
  HeartPulse,
  Bell,
  Image as ImageIcon,
  FileText,
  Search,
} from 'lucide-react';

import {
  PersonalDataForm,
  LocaleForm,
  TravelForm,
  MedicalForm,
  NotificationsForm,
  AvatarForm,
  DocumentsForm,
  SavedSearchesForm,
  MedicalConflictsCard,
} from './components';

const TABS = [
  { id: 'personal', label: 'Datos personales', icon: User },
  { id: 'locale', label: 'Localización', icon: Globe },
  { id: 'travel', label: 'Viaje', icon: Plane },
  { id: 'medical', label: 'Médico', icon: HeartPulse },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'avatar', label: 'Avatar', icon: ImageIcon },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'searches', label: 'Búsquedas', icon: Search },
];

export default function ProfilePage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('personal');
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conflictCount, setConflictCount] = useState(0);

  const reloadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profileData = await getProfile();
      setData(profileData);
      if (profileData.profile.avatar_url) {
        localStorage.setItem('user_avatar_url', profileData.profile.avatar_url);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch medical conflicts count for badge
  useEffect(() => {
    async function fetchConflicts() {
      try {
        const res = await listMedicalPending();
        setConflictCount(res.conflicts.length);
      } catch {
        setConflictCount(0);
      }
    }
    fetchConflicts();
  }, []);

  useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

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
          className="px-6 py-2 bg-[#FF6B6B] text-white rounded-xl font-medium hover:bg-[#ff5252] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { profile, travel_preferences, notification_preferences } = data;
  const userEmail = user?.email ?? null;

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#ff8a80] flex items-center justify-center border-4 border-white shadow-lg ${profile.avatar_url ? 'absolute top-0 left-0 -z-10' : ''}`}>
            <User className="w-10 h-10 text-white" />
          </div>
          {profile.phone_verified && (
            <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
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
            {profile.phone_verified ? (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Teléfono verificado
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                Teléfono no verificado
              </span>
            )}
            {profile.is_public && (
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                Perfil público
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="flex flex-wrap gap-2 border-b border-paper-outline mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 relative ${
                isActive
                  ? 'border-b-2 border-coral text-coral'
                  : 'text-ink-muted hover:bg-paper-dim hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'medical' && conflictCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {conflictCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── CONTENIDO ─── */}
      <div className="bg-paper rounded-2xl shadow-sm border border-paper-outline p-6">
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
          <>
            <MedicalForm onSave={reloadProfile} />
            <div className="mt-6">
              <MedicalConflictsCard />
            </div>
          </>
        )}
        {activeTab === 'notifications' && (
          <NotificationsForm prefs={notification_preferences} onSave={reloadProfile} />
        )}
        {activeTab === 'avatar' && (
          <AvatarForm currentUrl={profile.avatar_url} onSave={reloadProfile} />
        )}
        {activeTab === 'documents' && (
          <DocumentsForm />
        )}
        {activeTab === 'searches' && (
          <SavedSearchesForm />
        )}
      </div>
    </div>
  );
}