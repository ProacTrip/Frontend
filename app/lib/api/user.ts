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
  EntityType,
  CreateFavoriteBody,
  FavoritesResponse,
  AddFavoriteResponse,
  DocumentsResponse,
  DocumentTypesResponse,
  DocumentUploadResponse,
  SavedSearchesResponse,
  CreateSavedSearchBody,
  CreateSavedSearchResponse,
  UpdateSavedSearchBody,
  ToggleAlertResponse,
  MedicalPendingResponse,
  ResolveConflictBody,
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

// ─────────────────────────────────────────────────────────────
// FAVORITOS
// ─────────────────────────────────────────────────────────────

export async function listFavorites(entityType?: EntityType): Promise<FavoritesResponse> {
  let url = '/v1/user/favorites';
  if (entityType) {
    url += `?entity_type=${encodeURIComponent(entityType)}`;
  }

  const res = await apiFetch(url);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function addFavorite(body: CreateFavoriteBody): Promise<AddFavoriteResponse> {
  const res = await apiFetch('/v1/user/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteFavorite(favoriteId: string): Promise<{ message: string }> {
  const res = await apiFetch(`/v1/user/favorites/${favoriteId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// DOCUMENTOS
// ─────────────────────────────────────────────────────────────

export async function listDocuments(
  status?: string,
  documentType?: string
): Promise<DocumentsResponse> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (documentType) params.set('document_type', documentType);
  const qs = params.toString();
  const url = qs ? `/v1/user/documents?${qs}` : '/v1/user/documents';
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function getDocumentTypes(): Promise<DocumentTypesResponse> {
  const res = await apiFetch('/v1/user/documents/types');
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/v1/user/documents`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data?.error?.message ?? `Error ${res.status}`);
    } catch (e: any) {
      if (e instanceof Error && e.message !== `Error ${res.status}`) throw e;
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
  }
  return res.json();
}

export async function deleteDocument(
  documentId: string
): Promise<{ message: string }> {
  const res = await apiFetch(`/v1/user/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// BÚSQUEDAS GUARDADAS
// ─────────────────────────────────────────────────────────────

export async function listSavedSearches(): Promise<SavedSearchesResponse> {
  const res = await apiFetch('/v1/user/saved-searches');
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function createSavedSearch(
  body: CreateSavedSearchBody
): Promise<CreateSavedSearchResponse> {
  const res = await apiFetch('/v1/user/saved-searches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function updateSavedSearch(
  searchId: string,
  body: UpdateSavedSearchBody
): Promise<{ message: string }> {
  const res = await apiFetch(`/v1/user/saved-searches/${searchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function deleteSavedSearch(
  searchId: string
): Promise<{ message: string }> {
  const res = await apiFetch(`/v1/user/saved-searches/${searchId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function toggleAlert(
  searchId: string,
  enabled: boolean
): Promise<ToggleAlertResponse> {
  const res = await apiFetch(`/v1/user/saved-searches/${searchId}/alert`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// CONFLICTOS MÉDICOS
// ─────────────────────────────────────────────────────────────

export async function listMedicalPending(): Promise<MedicalPendingResponse> {
  const res = await apiFetch('/v1/user/profile/medical/pending');
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}

export async function resolveMedicalConflict(
  body: ResolveConflictBody
): Promise<{ message: string }> {
  const res = await apiFetch('/v1/user/profile/medical/pending/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await extractError(res));
  return res.json();
}