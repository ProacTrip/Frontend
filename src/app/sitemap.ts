import type { MetadataRoute } from 'next';

// Static popular Spanish destinations — used when backend query is unavailable at build time
const POPULAR_HOTEL_DESTINATIONS = [
  'barcelona',
  'madrid',
  'sevilla',
  'valencia',
  'mallorca',
  'granada',
  'bilbao',
  'malaga',
  'alicante',
  'ibiza',
  'tenerife',
  'san-sebastian',
  'costa-del-sol',
  'marbella',
  'cordoba',
  'cadiz',
  'salamanca',
  'toledo',
  'santiago-de-compostela',
  'zaragoza',
];

const BASE_URL = 'https://proactrip.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const entries: MetadataRoute.Sitemap = [
    // Main hotel search page
    {
      url: `${BASE_URL}/hoteles`,
      lastModified: today,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    // Dynamic hotel detail URLs for popular destinations (REQ-HSEO-005)
    ...POPULAR_HOTEL_DESTINATIONS.map((slug) => ({
      url: `${BASE_URL}/hoteles/${slug}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  return entries;
}
