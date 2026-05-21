import { describe, it, expect } from 'vitest';
import {
  LocationDataSchema,
  WeatherDataSchema,
  EnvironmentResponseSchema,
} from '../environment-schema';

const validLocation = {
  country: 'Spain',
  country_code: 'ES',
  city: 'Madrid',
  state: 'Community of Madrid',
  zipcode: '28001',
  timezone: 'Europe/Madrid',
  currency: 'EUR',
  language: 'es-ES',
  latitude: 40.4168,
  longitude: -3.7038,
};

const validWeather = {
  temp: 22,
  feels_like: 20,
  description: 'clear sky',
  icon: '01d',
  icon_url: 'https://openweathermap.org/img/wn/01d@2x.png',
  humidity: 45,
  wind_speed: 3.5,
};

describe('EnvironmentResponseSchema', () => {
  it('accepts a valid EnvironmentResponse', () => {
    const result = EnvironmentResponseSchema.safeParse({
      location: validLocation,
      weather: validWeather,
    });

    expect(result.success).toBe(true);
  });

  it('accepts weather: null', () => {
    const result = EnvironmentResponseSchema.safeParse({
      location: validLocation,
      weather: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects missing location.latitude', () => {
    const { latitude, ...incompleteLocation } = validLocation;
    const result = EnvironmentResponseSchema.safeParse({
      location: incompleteLocation,
      weather: validWeather,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const pathIssues = result.error.issues.map((i) => i.path.join('.'));
      expect(pathIssues).toContain('location.latitude');
    }
  });

  it('rejects wrong type for weather.temp (string instead of number)', () => {
    const result = EnvironmentResponseSchema.safeParse({
      location: validLocation,
      weather: { ...validWeather, temp: '22' },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const tempIssue = result.error.issues.find(
        (i) => i.path.join('.') === 'weather.temp'
      );
      expect(tempIssue).toBeDefined();
    }
  });

  it('rejects missing required location field (city)', () => {
    const { city, ...incompleteLocation } = validLocation;
    const result = EnvironmentResponseSchema.safeParse({
      location: incompleteLocation,
      weather: validWeather,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const pathIssues = result.error.issues.map((i) => i.path.join('.'));
      expect(pathIssues).toContain('location.city');
    }
  });
});

describe('LocationDataSchema', () => {
  it('accepts valid location data', () => {
    const result = LocationDataSchema.safeParse(validLocation);
    expect(result.success).toBe(true);
  });

  it('rejects missing country', () => {
    const { country, ...rest } = validLocation;
    const result = LocationDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric latitude', () => {
    const result = LocationDataSchema.safeParse({
      ...validLocation,
      latitude: '40.4168',
    });
    expect(result.success).toBe(false);
  });
});

describe('WeatherDataSchema', () => {
  it('accepts valid weather data', () => {
    const result = WeatherDataSchema.safeParse(validWeather);
    expect(result.success).toBe(true);
  });

  it('rejects non-numeric temp', () => {
    const result = WeatherDataSchema.safeParse({
      ...validWeather,
      temp: '22',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing description', () => {
    const { description, ...rest } = validWeather;
    const result = WeatherDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
