'use client';

interface RatingBadgeProps {
  /** Overall rating score, 0–10 scale (e.g., 8.7) */
  rating: number;
  /** Total number of reviews */
  totalReviews?: number;
  /** Visual variant */
  variant?: 'card' | 'detail';
}

/** Maps a rating score to a color token. */
function getRatingColor(score: number): string {
  if (score >= 9) return 'bg-rating-excellent';
  if (score >= 8) return 'bg-rating-great';
  if (score >= 7) return 'bg-rating-good';
  return 'bg-rating-fair';
}

/** Maps a rating score to a human-readable label in Spanish. */
function getRatingLabel(score: number): string {
  if (score >= 9) return 'Excepcional';
  if (score >= 8) return 'Muy bien';
  if (score >= 7) return 'Bien';
  return 'Agradable';
}

/** Formats review count compactly: 1234 → "1,2 mil"; 567 → "567". */
function formatReviewCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    if (count % 1000 >= 100) {
      return `${k.toFixed(1).replace('.', ',')} mil`;
    }
    return `${Math.round(k)} mil`;
  }
  return count.toLocaleString('de-DE');
}

export default function RatingBadge({ rating, totalReviews, variant = 'card' }: RatingBadgeProps) {
  // Round to one decimal place for display
  const score = Math.round(rating * 10) / 10;
  const label = getRatingLabel(score);
  const colorClass = getRatingColor(score);

  if (variant === 'detail') {
    return (
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-bold text-white ${colorClass}`}
        >
          {score.toFixed(1)}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-ink">{label}</span>
          {totalReviews !== undefined && totalReviews > 0 && (
            <span className="text-xs text-ink-muted">
              {formatReviewCount(totalReviews)} comentarios
            </span>
          )}
        </div>
      </div>
    );
  }

  // card variant — compact
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold text-white ${colorClass}`}
      >
        {score.toFixed(1)}
      </span>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {totalReviews !== undefined && totalReviews > 0 && (
        <span className="text-xs text-ink-faint">
          · {formatReviewCount(totalReviews)} comentarios
        </span>
      )}
    </div>
  );
}
