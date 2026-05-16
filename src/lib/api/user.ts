/**
 * User API — typed functions for USER_API.md endpoints
 */

import { api } from './client';
import type {
  GetProfileResponse,
  UserProfile,
  MedicalProfile,
  MedicalProfileUpdate,
  ListMedicalPendingResponse,
  AvatarUploadResponse,
  AvatarConfirmResponse,
  ListDefaultAvatarsResponse,
  SelectDefaultAvatarResponse,
  ListDocumentTypesResponse,
  UploadDocumentResponse,
  GetDocumentResponse,
  ListDocumentsResponse,
  SavedSearch,
  CreateSavedSearchResponse,
  ListSavedSearchesResponse,
  Wishlist,
  CreateWishlistResponse,
  GetWishlistResponse,
  AddWishlistItemResponse,
} from './types';

// ============================================================
// Profile
// ============================================================

/**
 * GET /v1/user/profile
 * Returns profile + travel preferences + notification preferences.
 */
export async function getProfile(): Promise<GetProfileResponse> {
  return api.get<GetProfileResponse>('/v1/user/profile');
}

/**
 * PUT /v1/user/profile
 * Partial update — only provided fields are updated.
 */
export async function updateProfile(fields: Partial<UserProfile>): Promise<{ message: string }> {
  return api.put('/v1/user/profile', fields);
}

/**
 * PUT /v1/user/profile/locale
 */
export async function updateLocale(fields: {
  timezone_name?: string;
  language_code?: string;
  currency_code?: string;
}): Promise<{ message: string }> {
  return api.put('/v1/user/profile/locale', fields);
}

/**
 * PUT /v1/user/profile/travel-preferences
 */
export async function updateTravelPreferences(fields: {
  preferred_class?: 'economy' | 'premium_economy' | 'business' | 'first';
  seat_preference?: 'window' | 'aisle' | 'middle' | 'no_preference';
  meal_preference?: string;
  special_assistance?: string[];
  preferred_airlines?: string[];
  preferred_hotels?: string[];
  avoid_layovers?: boolean;
  max_layover_duration?: number;
}): Promise<{ message: string }> {
  return api.put('/v1/user/profile/travel-preferences', fields);
}

/**
 * GET /v1/user/profile/medical
 */
export async function getMedicalProfile(): Promise<MedicalProfile> {
  return api.get<MedicalProfile>('/v1/user/profile/medical');
}

/**
 * PUT /v1/user/profile/medical
 * All text fields are encrypted server-side.
 */
export async function updateMedicalProfile(fields: MedicalProfileUpdate): Promise<{ message: string }> {
  return api.put('/v1/user/profile/medical', fields);
}

/**
 * GET /v1/user/profile/medical/pending
 */
export async function listMedicalPending(): Promise<ListMedicalPendingResponse> {
  return api.get<ListMedicalPendingResponse>('/v1/user/profile/medical/pending');
}

/**
 * POST /v1/user/profile/medical/pending/resolve
 */
export async function resolveMedicalPending(
  pendingUpdateId: string,
  action: 'accept' | 'reject',
  customValue?: string
): Promise<{ message: string }> {
  return api.post('/v1/user/profile/medical/pending/resolve', {
    pending_update_id: pendingUpdateId,
    action,
    ...(customValue ? { custom_value: customValue } : {}),
  });
}

/**
 * PUT /v1/user/profile/notifications
 * Upserts a single notification preference.
 */
export async function updateNotificationPreference(params: {
  channel: 'email' | 'sms' | 'websocket';
  notification_type: string;
  enabled: boolean;
}): Promise<{ message: string }> {
  return api.put('/v1/user/profile/notifications', params);
}

// ============================================================
// Avatars
// ============================================================

/**
 * POST /v1/user/profile/avatar
 * Returns a presigned PUT URL for uploading directly to R2.
 */
export async function uploadAvatar(params: {
  file_name: string;
  mime_type: string;
  file_size?: number;
  ttl_minutes?: number;
}): Promise<AvatarUploadResponse> {
  return api.post<AvatarUploadResponse>('/v1/user/profile/avatar', params);
}

/**
 * POST /v1/user/profile/avatar/confirm
 * Activates the avatar after the R2 PUT succeeds.
 */
export async function confirmAvatar(storageKey: string): Promise<AvatarConfirmResponse> {
  return api.post<AvatarConfirmResponse>('/v1/user/profile/avatar/confirm', {
    storage_key: storageKey,
  });
}

/**
 * GET /v1/user/profile/avatars/default
 */
export async function listDefaultAvatars(ttlMinutes?: number): Promise<ListDefaultAvatarsResponse> {
  const query = ttlMinutes ? `?ttl_minutes=${ttlMinutes}` : '';
  return api.get<ListDefaultAvatarsResponse>(`/v1/user/profile/avatars/default${query}`);
}

/**
 * POST /v1/user/profile/avatar/default
 */
export async function selectDefaultAvatar(avatarName: string): Promise<SelectDefaultAvatarResponse> {
  return api.post<SelectDefaultAvatarResponse>('/v1/user/profile/avatar/default', {
    avatar_name: avatarName,
  });
}

// ============================================================
// Documents
// ============================================================

/**
 * GET /v1/user/documents/types
 */
export async function listDocumentTypes(): Promise<ListDocumentTypesResponse> {
  return api.get<ListDocumentTypesResponse>('/v1/user/documents/types');
}

/**
 * POST /v1/user/documents
 * Multipart upload directly to backend (NOT presigned URL).
 * Returns 202 Accepted with SSE events_url for real-time status.
 */
export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/user/documents`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw body.error || body;
  }

  return response.json();
}

/**
 * GET /v1/user/documents/:id/events
 * Returns the SSE URL for real-time document processing status.
 */
export function getDocumentEventsUrl(documentId: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/v1/user/documents/${documentId}/events`;
}

/**
 * GET /v1/user/documents/:id
 */
export async function getDocument(documentId: string): Promise<GetDocumentResponse> {
  return api.get<GetDocumentResponse>(`/v1/user/documents/${documentId}`);
}

/**
 * GET /v1/user/documents
 */
export async function listDocuments(): Promise<ListDocumentsResponse> {
  return api.get<ListDocumentsResponse>('/v1/user/documents');
}

/**
 * GET /v1/user/documents/:id/download
 * Returns the file blob for download.
 */
export async function downloadDocument(documentId: string): Promise<Blob> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/user/documents/${documentId}/download`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw body.error || body;
  }

  return response.blob();
}

/**
 * DELETE /v1/user/documents/:id
 */
export async function deleteDocument(documentId: string): Promise<{ message: string }> {
  return api.delete(`/v1/user/documents/${documentId}`);
}

/**
 * PUT /v1/user/documents/:id/verify
 * Admin-only: marks a document as verified.
 */
export async function verifyDocument(documentId: string): Promise<{ message: string }> {
  return api.put(`/v1/user/documents/${documentId}/verify`);
}

// ============================================================
// Saved Searches
// ============================================================

/**
 * POST /v1/user/saved-searches
 */
export async function createSavedSearch(params: {
  name?: string;
  parameters: Record<string, unknown>;
  filters?: Record<string, unknown>;
  alert_enabled?: boolean;
}): Promise<CreateSavedSearchResponse> {
  return api.post<CreateSavedSearchResponse>('/v1/user/saved-searches', params);
}

/**
 * GET /v1/user/saved-searches
 */
export async function listSavedSearches(): Promise<ListSavedSearchesResponse> {
  return api.get<ListSavedSearchesResponse>('/v1/user/saved-searches');
}

/**
 * DELETE /v1/user/saved-searches/:id
 */
export async function deleteSavedSearch(searchId: string): Promise<{ message: string }> {
  return api.delete(`/v1/user/saved-searches/${searchId}`);
}

/**
 * PUT /v1/user/saved-searches/:id/alert
 */
export async function toggleAlert(searchId: string): Promise<{ message: string; alert_enabled: boolean }> {
  return api.put(`/v1/user/saved-searches/${searchId}/alert`);
}

// ============================================================
// Wishlists
// ============================================================

/**
 * POST /v1/user/wishlists
 */
export async function createWishlist(params: {
  name: string;
  description?: string;
  is_public?: boolean;
}): Promise<CreateWishlistResponse> {
  return api.post<CreateWishlistResponse>('/v1/user/wishlists', params);
}

/**
 * GET /v1/user/wishlists
 */
export async function listWishlists(): Promise<{ wishlists: Wishlist[] }> {
  return api.get('/v1/user/wishlists');
}

/**
 * GET /v1/user/wishlists/:id
 */
export async function getWishlist(wishlistId: string): Promise<GetWishlistResponse> {
  return api.get<GetWishlistResponse>(`/v1/user/wishlists/${wishlistId}`);
}

/**
 * PATCH /v1/user/wishlists/:id
 */
export async function updateWishlist(
  wishlistId: string,
  fields: { name?: string; description?: string; is_public?: boolean }
): Promise<{ message: string }> {
  return api.patch(`/v1/user/wishlists/${wishlistId}`, fields);
}

/**
 * DELETE /v1/user/wishlists/:id
 */
export async function deleteWishlist(wishlistId: string): Promise<{ message: string }> {
  return api.delete(`/v1/user/wishlists/${wishlistId}`);
}

/**
 * POST /v1/user/wishlists/:id/items
 */
export async function addWishlistItem(
  wishlistId: string,
  params: {
    entity_id: string;
    entity_type: string;
    price_snapshot?: Record<string, unknown>;
    currency_code?: string;
    notes?: string;
  }
): Promise<AddWishlistItemResponse> {
  return api.post<AddWishlistItemResponse>(`/v1/user/wishlists/${wishlistId}/items`, params);
}

/**
 * DELETE /v1/user/wishlists/:wishlistId/items/:itemId
 */
export async function removeWishlistItem(
  wishlistId: string,
  itemId: string
): Promise<{ message: string }> {
  return api.delete(`/v1/user/wishlists/${wishlistId}/items/${itemId}`);
}

/**
 * PUT /v1/user/wishlists/:id/share
 */
export async function shareWishlist(wishlistId: string): Promise<{ message: string }> {
  return api.put(`/v1/user/wishlists/${wishlistId}/share`);
}

/**
 * PUT /v1/user/wishlists/:id/private
 */
export async function makeWishlistPrivate(wishlistId: string): Promise<{ message: string }> {
  return api.put(`/v1/user/wishlists/${wishlistId}/private`);
}
