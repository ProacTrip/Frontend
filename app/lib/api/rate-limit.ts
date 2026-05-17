// ==========================================
// RATE LIMIT STORE — Módulo reactivo para monitoreo de rate limits
// ==========================================
//
// apiFetch escribe aquí los headers RateLimit-* de cada respuesta.
// Los componentes se suscriben vía useRateLimit() para mostrar:
//   - Advertencia "quedan pocas peticiones" cuando remaining < 20%
//   - Countdown de bloqueo cuando ocurre un 429
//   - Auto-re-enable del botón de submit cuando expira el Retry-After

export interface RateLimitInfo {
  /** Límite total de peticiones en la ventana actual */
  limit: number;
  /** Peticiones restantes en la ventana actual */
  remaining: number;
  /** Timestamp Unix (segundos) cuando se resetea la ventana */
  reset: number;
  /** Endpoint que devolvió estos headers */
  endpoint: string;
  /** Timestamp local de cuándo se registró esta info */
  timestamp: number;
}

type RateLimitListener = (info: RateLimitInfo | null) => void;

class RateLimitStore {
  private info: RateLimitInfo | null = null;
  private listeners = new Set<RateLimitListener>();
  private _blockedUntil = 0;

  /** Actualiza la info de rate limit (llamado desde apiFetch en cada respuesta exitosa) */
  update(info: RateLimitInfo): void {
    this.info = info;
    for (const fn of this.listeners) fn(info);
  }

  /** Marca un bloqueo por 429 con duración en segundos */
  block(retryAfterSeconds: number): void {
    this._blockedUntil = Date.now() + retryAfterSeconds * 1000;
  }

  get isBlocked(): boolean {
    return Date.now() < this._blockedUntil;
  }

  get secondsUntilUnblock(): number {
    if (!this.isBlocked) return 0;
    return Math.max(0, Math.ceil((this._blockedUntil - Date.now()) / 1000));
  }

  /** Suscribirse a cambios. Retorna función para cancelar suscripción. */
  subscribe(fn: RateLimitListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  get current(): RateLimitInfo | null {
    return this.info;
  }

  /** Limpia el estado (útil para testing o reset manual) */
  reset(): void {
    this.info = null;
    this._blockedUntil = 0;
  }
}

export const rateLimitStore = new RateLimitStore();
