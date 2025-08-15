import { getTrips, getPOIs } from '@/lib/store';
import { TripCard } from '@/components/TripCard';

function filterByPOISlug(slug: string | null) {
  const all = getTrips();
  if (!slug) return all;
  const poi = getPOIs().find(p => p.slug === slug);
  if (!poi) return [];
  return all.filter(t => t.poiIds.includes(poi.id));
}

export default function TripsPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const poiSlug = searchParams['poi'] ?? null;
  const trips = filterByPOISlug(poiSlug);
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Trips {poiSlug ? `including ${poiSlug.replace('-', ' ')}`:''}</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {trips.map(t => (
          <TripCard
            key={t.id}
            slug={t.slug}
            title={t.title}
            image={t.images[0]}
            durationMin={t.durationMin}
            priceType={t.priceType}
            priceAmount={t.priceAmount}
            currency={t.currency}
            ratingAvg={t.ratingAvg}
            ratingCount={t.ratingCount}
            vehicleType={t.vehicleType}
            languages={t.languages}
          />
        ))}
        {trips.length === 0 && <p>No trips found.</p>}
      </div>
    </div>
  );
}
