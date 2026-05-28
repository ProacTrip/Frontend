'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, TrendingUp, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiscoveryCardProps {
  destination: string;
  country: string;
  region: string;
  tags: string[];
  budgetTier: string;
  score: number;
  reasons: string[];
  bestMonths?: number[];
  source: string;
  index: number;
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function scoreColor(score: number): string {
  if (score >= 8) return 'bg-green-500';
  if (score >= 6) return 'bg-amber-500';
  return 'bg-red-400';
}

export default function DiscoveryCard({
  destination,
  country,
  region,
  tags,
  budgetTier,
  score,
  reasons,
  bestMonths,
  index,
}: DiscoveryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.05,
      }}
      className="rounded-2xl border border-[#e8e8e8] bg-white p-5 hover:border-[#0A0A0A] transition-colors"
    >
      <div className="flex items-start justify-between gap-4 max-md:flex-col max-md:gap-2">
        <div className="flex-1 min-w-0">
          {/* Destination header */}
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[#767676] flex-shrink-0" />
            <h3 className="text-base font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A] truncate">
              {destination}
            </h3>
            <span className="text-xs text-[#6A7282]">{country}</span>
          </div>

          <p className="text-xs text-[#767676] mb-2">{region}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3 max-md:text-[12px]">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] rounded-full bg-[#F5F5F5] text-[#6A7282] border border-[#e8e8e8]"
              >
                {tag}
              </span>
            ))}
            {budgetTier && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#0A0A0A] text-white">
                {budgetTier}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 max-md:self-start">
          <div className={`w-10 h-10 rounded-full ${scoreColor(score)} flex items-center justify-center`}>
            <span className="text-white text-xs font-bold">{score.toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-[#767676]">Score</span>
        </div>
      </div>

      {/* Best months */}
      {bestMonths && bestMonths.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-[#767676] flex-shrink-0" />
          <span className="text-[10px] text-[#6A7282]">
            Mejores meses:{' '}
            {bestMonths.map((m) => MONTH_NAMES[m - 1]).join(', ')}
          </span>
        </div>
      )}

      {/* Reasons (expandable) */}
      {reasons.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[#6A7282] hover:text-[#0A0A0A] transition-colors max-md:w-full max-md:justify-center"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {expanded ? 'Ocultar razones' : `${reasons.length} razones`}
          </button>

          {expanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 space-y-1"
            >
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-[#6A7282]">
                  <Star className="w-3 h-3 text-[#767676] flex-shrink-0 mt-0.5" />
                  {reason}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      )}
    </motion.div>
  );
}
