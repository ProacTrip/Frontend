'use client';

import dynamic from 'next/dynamic';
import BusquedaAISkeleton from './components/BusquedaAISkeleton';

// Client-only dynamic import — prevents hydration mismatches from browser
// extensions modifying the DOM (e.g., Grammarly adding data-heading-tag).
const BusquedaAIContent = dynamic(() => import('./BusquedaAIContent'), {
  ssr: false,
  loading: () => <BusquedaAISkeleton />,
});

export default function BusquedaAIClientWrapper() {
  return <BusquedaAIContent />;
}
