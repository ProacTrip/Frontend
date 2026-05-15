import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Detalle del hotel' };

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink" suppressHydrationWarning>
          Detalle del hotel
        </h1>
        <p className="text-ink-muted mt-2">
          {/* TODO: Implement hotel detail page using POST /v1/search/hotel-details
              with id={id}, check_in/out from searchParams, and display all fields:
              external_reviews, nearby_places, health_and_safety, sustainability, etc.
              See docs/Backend/docs/search_hotels_api.md § Hotel Details */}
        </p>
      </div>
    </div>
  );
}
