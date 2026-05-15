/**
 * ProacTrip Color System — Stitch Coral Travel Platform tokens
 * adapted to Geist fonts. Tailwind v4 @theme-compatible.
 *
 * Usage: Import this in globals.css @theme block.
 * Existing brand colors (--color-brand: #c54141) preserved for global chrome.
 * Search page uses paper palette.
 *
 * Palette: Paper (background hierarchy), Ink (text hierarchy),
 * Coral (primary actions), Olive (secondary), Mustard (accents)
 */

export const colors = {
  // ── Paper (background surfaces) ──
  paper: '#FEF9F0',              // page background, replaces bg-gray-50
  'paper-dim': '#F7F2E7',        // card surfaces, sections
  'paper-container': '#EFE9DA',  // elevated surfaces, sidebar
  'paper-outline': '#E0D8C5',    // borders, dividers

  // ── Ink (text hierarchy) ──
  ink: '#15140F',                // primary text, headings
  'ink-muted': '#5C5954',        // secondary text, labels
  'ink-faint': '#8B8781',        // placeholder, disabled text

  // ── Coral (primary brand actions) ──
  coral: '#ED6F5C',              // primary buttons, active states, links
  'coral-hover': '#D65B4A',      // hover state
  'coral-container': '#FDE8E5',  // subtle backgrounds, badges
  'coral-on-container': '#A53A2C', // text on coral backgrounds

  // ── Olive (secondary actions) ──
  olive: '#5C6238',              // secondary buttons, filters
  'olive-hover': '#4A4F2C',
  'olive-container': '#E8EBD6',

  // ── Mustard (accents) ──
  mustard: '#E9B94A',            // decorative accents, highlights, stars
  'mustard-container': '#FDF4DC',

  // ── Semantic ──
  success: '#2E7D32',
  'success-container': '#E8F5E9',
  warning: '#E6A817',            // non_matching banner, rate limit
  'warning-container': '#FFF8E1',
  error: '#BA1A1A',
  'error-container': '#FFEBEE',

  // ── Rating badges ──
  'rating-excellent': '#2E7D32',  // 9.0+
  'rating-great': '#5C6238',      // 8.0-8.9
  'rating-good': '#E6A817',       // 7.0-7.9
  'rating-fair': '#ED6F5C',       // <7.0
} as const;

export type ColorToken = keyof typeof colors;
