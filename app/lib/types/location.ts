import type { LocationData, WeatherData } from './auth';

export interface UserContext {
  location: LocationData;
  weather: WeatherData;
}

export type { ContextResponse as Context, LocationData, WeatherData } from '@/app/lib/api/context';
