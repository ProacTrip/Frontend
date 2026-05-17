// ==========================================
// RATE LIMIT STORE — Módulo reactivo para monitoreo de rate limits
// ==========================================
//
// Tracking por endpoint: cada llamada a update() almacena la info
// del endpoint correspondiente sin sobreescribir otros endpoints.
// current retorna el más restrictivo (menor remaining/limit).
// Las suscripciones notifican con la info más restrictiva del momento.
//
// Uso desde componentes:
//   - Suscribirse vía rateLimitStore.subscribe() para reaccionar a cambios
//   - rateLimitStore.current para leer el estado más restrictivo
//   - rateLimitStore.isBlocked / secondsUntilUnblock para estado de 429

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
  /** Per-endpoint tracking: endpoint → RateLimitInfo */
  private endpoints = new Map<string, RateLimitInfo>();
  private listeners = new Set<RateLimitListener>();
  private _blockedUntil = 0;

  /**
   * Actualiza la info de rate limit para un endpoint específico.
   * No sobreescribe otros endpoints — cada uno mantiene su propio estado.
   * Notifica a los listeners con la info más restrictiva del momento.
   */
  update(info: RateLimitInfo): void {
    this.endpoints.set(info.endpoint, info);
    this.pruneStale();
    const mostRestrictive = this.computeMostRestrictive();
    for (const fn of this.listeners) fn(mostRestrictive);
  }

  /** Marca un bloqueo global por 429 con duración en segundos */
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

  /**
   * Retorna la info más restrictiva entre todos los endpoints trackeados.
   * Criterio: menor ratio remaining/limit. En empate, menor remaining absoluto.
   * null si no hay ningún endpoint trackeado.
   */
  get current(): RateLimitInfo | null {
    this.pruneStale();
    return this.computeMostRestrictive();
  }

  /** Suscribirse a cambios. Retorna función para cancelar suscripción. */
  subscribe(fn: RateLimitListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Limpia todo el estado (útil para testing o reset manual) */
  reset(): void {
    this.endpoints.clear();
    this._blockedUntil = 0;
    for (const fn of this.listeners) fn(null);
  }

  // ==========================================
  // INTERNAL
  // ==========================================

  /**
   * Elimina entradas cuyo reset timestamp ya pasó
   * (la ventana de rate limit expiró, esos datos son obsoletos).
   */
  private pruneStale(): void {
    const nowSec = Math.floor(Date.now() / 1000);
    for (const [endpoint, info] of this.endpoints) {
      if (info.reset <= nowSec) {
        this.endpoints.delete(endpoint);
      }
    }
  }

  /**
   * Encuentra el endpoint más restrictivo.
   * Criterio: menor ratio remaining/limit (más cerca de agotarse).
   * Si hay empate, el de menor remaining absoluto.
   */
  private computeMostRestrictive(): RateLimitInfo | null {
    let best: RateLimitInfo | null = null;
    let bestRatio = Infinity;
    let bestRemaining = Infinity;

    for (const info of this.endpoints.values()) {
      const ratio = info.limit > 0 ? info.remaining / info.limit : 0;
      if (
        ratio < bestRatio ||
        (ratio === bestRatio && info.remaining < bestRemaining)
      ) {
        bestRatio = ratio;
        bestRemaining = info.remaining;
        best = info;
      }
    }

    return best;
  }
}

export const rateLimitStore = new RateLimitStore();
