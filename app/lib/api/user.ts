// app/lib/api/user.ts
// Lógica de red para el módulo User Profile
// Reutiliza apiFetch de auth.ts

import { apiFetch } from './auth';
import type {
  ProfileResponse,
  UpdateProfileBody,
  LocaleUpdate,
  UpdateTravelPreferencesBody,
  MedicalProfile,
  UpdateMedicalProfileBody,
  UpdateNotificationPreferenceBody,
  AvatarUploadUrl,
  DefaultAvatar,
} from '@/app/lib/types/user';

// ─────────────────────────────────────────────────────────────
// Helper para extraer errores del backend
// Marco devuelve: { error: { code, message } }
// ─────────────────────────────────────────────────────────────

async function extractError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    const data = JSON.parse(text);
    return data?.error?.message ?? 'Error desconocido';
  } catch {
    return `Error ${res.status}: ${res.statusText}`;
  }
}

// ─────────────────────────────────────────────────────────────
// PERFIL PRINCIPAL
// ─────────────────────────────────────────────────────────────

export async function getProfile(): Promise<ProfileResponse> {
  const res = await apiFetch('/v1/user/profile');
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateProfile(data: UpdateProfileBody): Promise<void> {
  const res = await apiFetch('/v1/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

// ─────────────────────────────────────────────────────────────
// LOCALIZACIÓN
// ─────────────────────────────────────────────────────────────

export async function updateLocale(data: LocaleUpdate): Promise<void> {
  const res = await apiFetch('/v1/user/profile/locale', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

// ─────────────────────────────────────────────────────────────
// PREFERENCIAS DE VIAJE
// ─────────────────────────────────────────────────────────────

export async function updateTravelPreferences(
  data: UpdateTravelPreferencesBody
): Promise<void> {
  const res = await apiFetch('/v1/user/profile/travel-preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

// ─────────────────────────────────────────────────────────────
// PERFIL MÉDICO
// ─────────────────────────────────────────────────────────────

export async function getMedicalProfile(): Promise<MedicalProfile | null> {
  const res = await apiFetch('/v1/user/profile/medical');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateMedicalProfile(
  data: UpdateMedicalProfileBody
): Promise<void> {
  const res = await apiFetch('/v1/user/profile/medical', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

// ─────────────────────────────────────────────────────────────
// NOTIFICACIONES
// ─────────────────────────────────────────────────────────────

export async function updateNotificationPreference(
  data: UpdateNotificationPreferenceBody
): Promise<void> {
  const res = await apiFetch('/v1/user/profile/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await extractError(res));
}

// ─────────────────────────────────────────────────────────────
// AVATARES
// ─────────────────────────────────────────────────────────────

export async function getUploadAvatarUrl(file: File): Promise<AvatarUploadUrl> {
  const res = await apiFetch('/v1/user/profile/avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function uploadAvatarToR2(upload_url: string, file: File): Promise<void> {
  const res = await fetch(upload_url, {
    method: 'PUT',
    body: file,
  });
  if (!res.ok) throw new Error(`Error al subir imagen: ${res.status}`);
}

export async function confirmAvatarUpload(storage_key: string): Promise<string> {
  const res = await apiFetch('/v1/user/profile/avatar/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storage_key }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  return data.avatar_url;
}

export async function listDefaultAvatars(): Promise<DefaultAvatar[]> {
  const res = await apiFetch('/v1/user/profile/avatars/default');
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  return data.avatars;
}

export async function selectDefaultAvatar(avatar_name: string): Promise<string> {
  const res = await apiFetch('/v1/user/profile/avatar/default', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar_name }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await res.json();
  return data.avatar_url;
}