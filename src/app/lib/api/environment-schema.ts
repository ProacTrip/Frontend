// app/lib/api/environment-schema.ts
//
// Zod v4 runtime validation schemas for GET /v1/environment response.
// Runs in warn-only mode via safeParse — mismatched responses
// log a warning but never block rendering.
//
// Schema fields match the TypeScript interfaces in context.ts.
// Extra fields from the backend are silently stripped (default z.object behavior).

import { z } from 'zod';

export const LocationDataSchema = z.object({
  country: z.string(),
  country_code: z.string().length(2),
  city: z.string(),
  state: z.string(),
  zipcode: z.string(),
  timezone: z.string(),
  currency: z.string().length(3),
  language: z.string().min(2).max(5),
  latitude: z.number(),
  longitude: z.number(),
});

export const WeatherDataSchema = z.object({
  temp: z.number(),
  feels_like: z.number(),
  description: z.string(),
  icon: z.string(),
  icon_url: z.string().url(),
  humidity: z.number(),
  wind_speed: z.number(),
});

export const EnvironmentResponseSchema = z.object({
  location: LocationDataSchema,
  weather: WeatherDataSchema.nullable(),
});

/** Inferred type from the schema — matches EnvironmentResponse in context.ts. */
export type EnvironmentResponseValidated = z.output<typeof EnvironmentResponseSchema>;
