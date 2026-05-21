import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseCacheMaxAge,
  isEnvCacheValid,
  ENV_STORAGE_KEY,
  ENV_STORED_AT_KEY,
  ENV_TTL_KEY,
  ENV_CACHE_TTL_MS,
} from '../context';

describe('parseCacheMaxAge', () => {
  it('parses max-age=300 → 300000ms', () => {
    expect(parseCacheMaxAge('max-age=300')).toBe(300_000);
  });

  it('caps max-age=1200 to 600000ms (ENV_CACHE_TTL_MS)', () => {
    expect(parseCacheMaxAge('max-age=1200')).toBe(ENV_CACHE_TTL_MS);
  });

  it('returns ENV_CACHE_TTL_MS when header is null', () => {
    expect(parseCacheMaxAge(null)).toBe(ENV_CACHE_TTL_MS);
  });

  it('returns ENV_CACHE_TTL_MS when header is empty string', () => {
    expect(parseCacheMaxAge('')).toBe(ENV_CACHE_TTL_MS);
  });

  it('returns ENV_CACHE_TTL_MS for no-cache', () => {
    expect(parseCacheMaxAge('no-cache')).toBe(ENV_CACHE_TTL_MS);
  });

  it('returns ENV_CACHE_TTL_MS for no-store', () => {
    expect(parseCacheMaxAge('no-store')).toBe(ENV_CACHE_TTL_MS);
  });

  it('extracts max-age from complex header (stale-while-revalidate)', () => {
    expect(
      parseCacheMaxAge('max-age=300, stale-while-revalidate=600')
    ).toBe(300_000);
  });

  it('extracts max-age from header with public directive', () => {
    expect(parseCacheMaxAge('public, max-age=600')).toBe(ENV_CACHE_TTL_MS);
  });

  it('caps max-age=3600 to ENV_CACHE_TTL_MS', () => {
    expect(parseCacheMaxAge('max-age=3600')).toBe(ENV_CACHE_TTL_MS);
  });

  it('returns ENV_CACHE_TTL_MS for max-age=0', () => {
    expect(parseCacheMaxAge('max-age=0')).toBe(ENV_CACHE_TTL_MS);
  });

  it('handles negative max-age by capping', () => {
    expect(parseCacheMaxAge('max-age=-5')).toBe(ENV_CACHE_TTL_MS);
  });
});

describe('isEnvCacheValid', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when no stored_at timestamp', () => {
    expect(isEnvCacheValid()).toBe(false);
  });

  it('returns true when cache is fresh (< TTL)', () => {
    localStorage.setItem(ENV_STORED_AT_KEY, new Date().toISOString());
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify({ location: {} }));
    expect(isEnvCacheValid()).toBe(true);
  });

  it('returns false when cache is expired (> TTL)', () => {
    // Set stored_at to 11 minutes ago
    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    localStorage.setItem(ENV_STORED_AT_KEY, elevenMinutesAgo);
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify({ location: {} }));
    expect(isEnvCacheValid()).toBe(false);
  });

  it('respects dynamic TTL from ENV_TTL_KEY (5 min TTL, 6 min old = expired)', () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    // Set dynamic TTL to 5 minutes
    localStorage.setItem(ENV_TTL_KEY, String(5 * 60 * 1000));
    localStorage.setItem(ENV_STORED_AT_KEY, sixMinutesAgo);
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify({ location: {} }));
    expect(isEnvCacheValid()).toBe(false);
  });

  it('respects dynamic TTL from ENV_TTL_KEY (5 min TTL, 3 min old = valid)', () => {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    localStorage.setItem(ENV_TTL_KEY, String(5 * 60 * 1000));
    localStorage.setItem(ENV_STORED_AT_KEY, threeMinutesAgo);
    localStorage.setItem(ENV_STORAGE_KEY, JSON.stringify({ location: {} }));
    expect(isEnvCacheValid()).toBe(true);
  });
});
