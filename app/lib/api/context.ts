const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface LocationData {
  country: string;
  country_code: string;
  city: string;
  state: string;
  zipcode?: string;
  timezone: string;
  currency: string;
  language: string;
  latitude: string | number;
  longitude: string | number;
}

export interface WeatherData {
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  icon_url: string;
  humidity: number;
  wind_speed: number;
}

export interface ContextResponse {
  location: LocationData;
  weather: WeatherData;
}

export async function getContext(lang?: string): Promise<ContextResponse> {
  const url = new URL(`${API_URL}/v1/context`);
  if (lang) url.searchParams.set('lang', lang);

  const res = await fetch(url.toString(), {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Context fetch failed: ${res.status}`);
  }

  const data = await res.json();

  console.log('[Context] Location:', data.location);
  console.log('[Context] Weather:', data.weather);

  return data;
}
