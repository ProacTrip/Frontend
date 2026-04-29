import { TIMEZONE_CURRENCY_MAP } from '../constants/currencies';
import { getContext, type ContextResponse } from '@/app/lib/api/context';

export interface UserLocationData {
  timezone: string;
  currency: string;
  language: string;
  location?: {
    city: string;
    region: string;
    country: string;
    country_name: string;
    latitude: number;
    longitude: number;
    postal: string;
  };
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function detectLanguage(): string {
  try {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    return lang.split('-')[0].toLowerCase();
  } catch {
    return 'en';
  }
}

export function getCurrencyFromTimezone(timezone: string): string {
  return TIMEZONE_CURRENCY_MAP[timezone] || 'USD';
}

export async function fetchAndStoreContext(): Promise<ContextResponse | null> {
  try {
    const context = await getContext();

    localStorage.setItem('user_context', JSON.stringify(context));
    localStorage.setItem('user_location', JSON.stringify({
      currency: context.location.currency,
      gl: context.location.country_code,
      hl: context.location.language,
      timezone: context.location.timezone,
      country: context.location.country,
      city: context.location.city,
    }));

    return context;
  } catch (error) {
    console.error('[Context] Failed to fetch context:', error);
    return null;
  }
}

export function getStoredContext(): ContextResponse | null {
  try {
    const stored = localStorage.getItem('user_context');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function formatLocationDisplay(data: UserLocationData): string {
  const location = data.timezone.split('/')[1] || data.timezone;

  const languageNames: Record<string, string> = {
    'es': 'Español',
    'en': 'English',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
  };

  const languageName = languageNames[data.language] || data.language.toUpperCase();
  return `${location} - ${data.currency} - ${languageName}`;
}

export function getUserPreferences() {
  if (typeof window === 'undefined') {
    return { currency: 'EUR', gl: 'ES', hl: 'es' };
  }

  try {
    const stored = localStorage.getItem('user_location');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[Location] Error leyendo preferencias:', e);
  }

  return { currency: 'EUR', gl: 'ES', hl: 'es' };
}
