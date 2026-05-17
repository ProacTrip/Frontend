// app/lib/types/saved-search.ts
//
// Type definitions for saved searches module.
// Covers the full SavedSearch entity, create/update bodies, and response wrappers.

export interface SavedSearch {
  id: string;
  name: string | null;
  parameters: Record<string, unknown>;
  filters: Record<string, unknown> | null;
  alert_enabled: boolean;
  last_executed_at: string | null;
  result_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedSearchBody {
  name?: string;
  parameters: Record<string, unknown>;
  filters?: Record<string, unknown>;
  alert_enabled?: boolean;
}

export interface UpdateSavedSearchBody {
  name?: string;
  parameters?: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

export interface SavedSearchListResponse {
  searches: SavedSearch[];
}

export interface ToggleAlertResponse {
  search_id: string;
  alert_enabled: boolean;
  message: string;
}
