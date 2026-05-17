// app/lib/types/document.ts
//
// Tipos para el módulo de documentos de viaje (pasaporte, visa, seguro, etc.).
// Alineado con los 7 endpoints del backend REST /v1/user/documents/*.

// ==========================================
// OCR STATUS (pipeline asíncrono)
// ==========================================
export type OcrStatus =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'failed';

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
// LIST ITEM (GET /v1/user/documents)
// ==========================================
export interface DocumentListItem {
  id: string;
  file_name: string;
  document_type: string;
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  is_verified: boolean;
  created_at: string;
}

// ==========================================
// FULL DETAIL (GET /v1/user/documents/:id)
// ==========================================
export interface DocumentDetail {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  detected_mime_type: string | null;
  document_type: string;
  storage_key: string;
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  extracted_data: Record<string, unknown> | null;
  failure_reason: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  valid_from: string | null;
  valid_until: string | null;
  document_number: string | null;
  issuing_country: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// UPLOAD RESPONSE (POST /v1/user/documents)
// ==========================================
export interface DocumentUploadResponse {
  document_id: string;
  status: OcrStatus;
  events_url: string;
  message: string;
}

// ==========================================
// SSE EVENT (GET /v1/user/documents/:id/events)
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
// LIST RESPONSE (GET /v1/user/documents)
// ==========================================
export interface DocumentListResponse {
  documents: DocumentListItem[];
}
