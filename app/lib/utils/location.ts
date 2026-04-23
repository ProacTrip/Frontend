import { TIMEZONE_CURRENCY_MAP } from '../constants/currencies';


//Interface para los datos de ubicación del usuario
export interface UserLocationData 
{
  timezone: string;
  currency: string;
  language: string;
  location?: {              // Datos de API externa
    city: string;
    region: string;
    country: string;
    country_name: string;
    latitude: number;
    longitude: number;
    postal: string;
  };
}

//detecta el timezone del navegadaor
export function detectTimezone(): string {
  try 
  {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } 
  catch (error) 
  {
    console.warn('[Location] Error detectando timezone:', error);
    return 'UTC';
  }
}

//detecta el idoma del navegador
export function detectLanguage(): string {
  try 
  {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    return lang.split('-')[0].toLowerCase();
  } 
  catch (error) 
  {
    console.warn('[Location] Error detectando idioma:', error);
    return 'en';
  }
}

//Obtiene la moneda basándose en el timezone
export function getCurrencyFromTimezone(timezone: string): string {
  return TIMEZONE_CURRENCY_MAP[timezone] || 'USD';
}

//Detecta ubicacion usando API externa (ipapi) con fallback API nativa si falla
export async function getUserLocation(): Promise<UserLocationData> {
  try 
  {
    console.log('[Location] Detectando con API externa...');
    
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // Timeout 3 segundos
    });

    if (response.ok) 
    {
      const data = await response.json();
      console.log('[Location] API externa exitosa');

      return {
        timezone: data.timezone || detectTimezone(),
        currency: data.currency || 'USD',
        language: data.languages?.split(',')[0]?.split('-')[0]?.toLowerCase() || detectLanguage(),
        location: {
          city: data.city || '',
          region: data.region || '',
          country: data.country_code || '',
          country_name: data.country_name || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          postal: data.postal || '',
        }
      };
    }
  } 
  catch (error) 
  {
    console.warn('[Location] API falló, usando fallback');
  }

  // Fallback: APIs nativas
  const timezone = detectTimezone();
  return {
    timezone,
    currency: getCurrencyFromTimezone(timezone),
    language: detectLanguage(),
  };
}

//formatea la informacion de ubicacion
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

/**
 * Lee la ubicación guardada del usuario (del localStorage)
 * y devuelve moneda, país e idioma para las APIs.
 * Fallback: EUR / ES / es
 */
export function getUserPreferences() {
  if (typeof window === 'undefined') {
    return { currency: 'EUR', gl: 'ES', hl: 'es' };
  }
  
  try {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      const data = JSON.parse(saved);
      return {
        currency: data.currency || 'EUR',
        gl: data.location?.country || 'ES',
        hl: data.language || 'es'
      };
    }
  } catch (e) {
    console.warn('[Location] Error leyendo preferencias:', e);
  }
  
  return { currency: 'EUR', gl: 'ES', hl: 'es' };
}