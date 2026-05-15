---
name: nextjs-v2
description: >
  Frontend-v2 project standards for Next.js 16, React 19, Tailwind v4, Framer Motion.
  Auto-load when working with /home/aurelio/Proactrip/frontend-v2.
type: project
version: 1.0.0
tags: [next.js 16, react 19, tailwind v4, framer-motion, bun, turbopack]
---

# ProacTrip frontend-v2 — Project Skill

## Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 16.2.3 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| PostCSS plugin | @tailwindcss/postcss | ^4 |
| Animation | Framer Motion | ^12.38.0 |
| Icons | lucide-react | ^1.8.0 |
| Lottie | @dotlottie/react-player | ^1.6.19 |
| Runtime | Bun | latest |
| Dev Server | Turbopack | bundled with Next.js 16 |
| Language | TypeScript | ^5 |
| Linter | ESLint | ^9 (eslint-config-next 16.2.3) |

## Fonts

Geist and Geist Mono via `next/font/google` with CSS variables:

```tsx
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap', preload: false });
```

Use Tailwind utility classes: `font-geist-sans`, `font-geist-mono`.

## API Client

### `apiFetch` in `src/lib/api/client.ts`

- **Auth**: cookie-based only, `credentials: 'include'` on every request
- **NEVER** send `Authorization` headers — the HttpOnly cookies handle it
- **Base URL**: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:8080`)
- All endpoints prefixed with `/v1/`

```ts
import { api } from '@/lib/api/client';
const data = await api.get<ResponseType>('/v1/search/hotels?query=Paris');
```

### Error Handling (RFC 9457)

Backend returns RFC 9457 Problem Details:

```ts
export interface ApiError {
  code: string;
  message: string;
  status: number;
  retryAfter?: number;
  traceId?: string;
}
```

Error code constants are in the API client. Error boundaries use this format. Always check `error.code` for specific handling (rate limits, auth expiry, etc).

## Component Patterns

### Client/Server Split

- **Server Components by default** — no `'use client'` needed
- Add `'use client'` directive for interactive components (state, effects, event handlers, framer-motion, hooks)
- Route groups `(site)` for shared layouts without affecting URL

### Key Conventions

- Framer Motion: `motion.article`, `motion.div`, `AnimatePresence` for enter/exit animations
- Lucide icons: import individually, `size={16}` or `size={12}`, stroke-based
- Use `useSearchParams` for URL-search-param state — MUST wrap in `<Suspense>` boundary
- `next/image` for optimized images with `remotePatterns` in `next.config.ts`

### Null Safety (MANDATORY)

API responses can have null fields even when TypeScript types claim otherwise. **Always** defend:

```tsx
// Arrays — use ?? [] fallback
(hotel.amenities ?? []).length

// Nested objects — use optional chaining + null check
if (!price?.per_night?.amount) return null;

// Nullable props — accept null in interface
amenities: string[] | null;
```

## TypeScript Patterns

- `strict: true` (tsconfig.json)
- No `any` type — use `unknown` if truly unknown
- Path alias: `@/` → `./src/*`
- Types in `src/lib/types/` with explicit interfaces
- Union types for state: `'matching' | 'non_matching_only'`
- `as const` for color token objects

## Styling

### Tailwind v4 with @theme

Tailwind v4 uses `@theme` block in CSS instead of `tailwind.config.ts`:

```css
@import 'tailwindcss';

@theme {
  --color-paper: #FEF9F0;
  --color-paper-dim: #F7F2E7;
  /* ...all color tokens from src/config/colors.ts */
  --font-geist-sans: 'Geist', sans-serif;
  --font-geist-mono: 'Geist Mono', monospace;
}
```

### Paper Palette Colors

All colors defined in `src/config/colors.ts`. Key groups:

| Group | Tokens | Usage |
|-------|--------|-------|
| Paper | `paper`, `paper-dim`, `paper-container`, `paper-outline` | Backgrounds, cards, borders |
| Ink | `ink`, `ink-muted`, `ink-faint` | Text hierarchy |
| Coral | `coral`, `coral-hover`, `coral-container` | Primary actions, brand |
| Olive | `olive`, `olive-hover`, `olive-container` | Secondary actions |
| Mustard | `mustard`, `mustard-container` | Accents, stars |
| Semantic | `success`, `warning`, `error` + containers | Status indicators |
| Rating | `rating-excellent`, `rating-great`, `rating-good`, `rating-fair` | Score badges |

Tailwind classes: `bg-paper`, `text-ink-muted`, `border-paper-outline`, etc.

## Next.js 16 Specifics

### Turbopack Dev Server

```bash
bun --bun next dev --turbopack
```

### Metadata API

Server Components only. In `layout.tsx`:
```ts
export const metadata: Metadata = {
  title: { default: '...', template: '%s | ProacTrip' },
  description: '...',
};
export const viewport = { themeColor: '#c54141', width: 'device-width', initialScale: 1 };
```

### Image Optimization

Remote patterns configured in `next.config.ts`. Supported hosts: `googleusercontent.com`, `tripadvisor.com`, `bstatic.com`, `agoda.net`, `gstatic.com`. Formats: AVIF and WebP. Minimum cache TTL: 1 year.

### Route Groups

`(site)` — shared layout with Navbar for public pages.
`auth` — separate layout for auth pages (login, register, OAuth callback).

### Security Headers

Configured in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

## Common Gotchas

1. **Hydration mismatches from browser extensions**: Browser extensions (Grammarly, color pickers, translator add-ons) inject DOM attributes like `data-heading-tag="H1"` on heading elements. Always add `suppressHydrationWarning` to ALL `<h1>`, `<h2>`, `<h3>` tags. Without it, Next.js will throw hydration mismatch warnings in development and potentially break rendering in production.

2. **Null API fields**: The Go backend can return `null` for `amenities`, `images`, `nearby_places` when providers don't have data. Always use `?? []` for arrays and null guards for objects.

3. **Tailwind v4 `@theme`**: No `tailwind.config.ts`. All theme values in `globals.css` `@theme` block. Do NOT create a tailwind config file.

4. **Framer Motion server rendering**: `motion.*` components MUST be inside `'use client'` components. Animation props like `whileHover`, `transition` are client-only.

5. **`useSearchParams`**: Needs `<Suspense>` boundary in Next.js 16. Without it, the page will fail to build.

6. **API pagination may return overlapping results**: When loading more results via page_token, the API can return properties that were already in the previous page. ALWAYS deduplicate by `id` before appending to state:
   ```ts
   setResults((prev) => {
     const seen = new Set(prev.map((p) => p.id));
     const newOnes = response.properties.filter((p) => !seen.has(p.id));
     return [...prev, ...newOnes];
   });
   ```

## Patterns

### Internal routing for detail pages
Never use `booking_url` directly as a link target. The correct flow is:
1. User clicks hotel card → navigate to internal route `/hotels/{id}`
2. Search params (check_in, check_out, adults) are passed via URL query string
3. The detail page calls `POST /v1/search/hotel-details` with the id and search params
4. `booking_url` is an external affiliate link — display it as a secondary CTA, not the primary navigation

### Vacation Rentals toggle
The search supports both hotels and vacation rentals via `vacation_rentals: boolean` in the API. To switch modes:
- Use a segmented tab toggle at the top of FilterSidebar
- When switching modes, reset mode-specific filters (hotel_classes, property_types, amenities, bedrooms, bathrooms)
- In VR mode, show different filter options: bedrooms/bathrooms instead of hotel_classes
- Pass `vacation_rentals` to the searchHotels API call (NOT hardcoded to `false`)

## File Conventions

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (fonts, AuthProvider, metadata)
│   ├── (site)/             # Route group with Navbar layout
│   │   ├── layout.tsx
│   │   └── page.tsx        # Home page
│   └── auth/               # Auth route group
├── components/
│   ├── hotels/             # Hotel-specific components
│   ├── layout/             # Navbar, Footer
│   └── ui/                 # Reusable UI primitives
├── config/
│   └── colors.ts           # Paper palette color tokens
├── lib/
│   ├── api/                # API client + endpoint wrappers
│   ├── auth/               # Auth context, provider
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript interfaces
```

## Scripts

```bash
bun --bun next dev --turbopack   # dev server
bun --bun next build             # production build
tsc --noEmit                     # type checking
```
