// app/lib/types/document.ts
//
// Tipos para el módulo de documentos de viaje (pasaporte, visa, seguro, etc.).
// Alineado con USER_API.md (May 2026): paths con /profile/, DTOs corregidos.

// ==========================================
// OCR STATUS (pipeline asíncrono)
// ==========================================
export type OcrStatus =
  | 'queued'          // ← renamed from 'uploaded'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'failed';

// ==========================================
// VERIFICATION STATUS (admin dashboard)
// ==========================================
export type VerificationStatus =
  | 'verified'
  | 'unverified'
  | 'rejected'
  | 'manual_review'
  | 'suspicious';

// ==========================================
// DOCUMENT TYPE (catálogo del backend)
// ==========================================
export interface DocumentType {
  code: string;
  name: string;
  description: string;
  is_identity: boolean;
  requires_ocr: boolean;
}

// ==========================================
// LIST ITEM (GET /v1/user/profile/documents)
// ==========================================
export interface DocumentListItem {
  id: string;
  file_name: string;
  document_type: string | null;
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  verification_status: VerificationStatus;  // ← was: is_verified: boolean
  created_at: string;
}

// ==========================================
// FULL DETAIL (GET /v1/user/profile/documents/:id)
// ==========================================
export interface DocumentDetail {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number | null;                     // ← omitzero: nil cuando no se envió en upload
  mime_type: string | null;                     // ← omitzero: nil cuando no se envió en upload
  detected_mime_type: string | null;
  detected_size_bytes: number | null;           // ← omitzero: nil hasta que el validador procesa
  document_type: string | null;                 // ← omitzero: nil hasta que OCR completa
  storage_key: string;
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  extracted_data: Record<string, unknown> | null;  // ← valid_from, valid_until, document_number, issuing_country live HERE now
  failure_reason: string | null;
  verification_status: VerificationStatus;     // ← was: is_verified: boolean
  verified_at: string | null;                  // ← optional (admin-only, may be null for user module)
  verified_by: string | null;                  // ← optional
  created_at: string;
  updated_at: string;
}

// ==========================================
// UPLOAD RESPONSE (POST /v1/user/profile/documents)
// ==========================================
export interface DocumentUploadResponse {
  document_id: string;
  status: OcrStatus;
  events_url: string;
  message: string;
}

// ==========================================
// DOWNLOAD URL RESPONSE (GET .../download-url)
// ==========================================
export interface DocumentDownloadUrlResponse {
  download_url: string;
  expires_at: string;
  file_name: string;
}

// ==========================================
// SSE EVENT
// ==========================================
export interface DocumentEvent {
  status: OcrStatus;
  sub_state?: string;
  document_type?: string;
  ocr_confidence?: number;
  message?: string;
  failure_reason?: string;
  detail?: string;
}

// ==========================================
// LIST RESPONSE (GET /v1/user/profile/documents)
// ==========================================
export interface DocumentListResponse {
  documents: DocumentListItem[];
}
