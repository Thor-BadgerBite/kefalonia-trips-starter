import MapCanvas from '@/components/MapCanvas';
import { getPOIs, getTrips } from '@/lib/store';
import { TripCard } from '@/components/TripCard';

export default function HomePage() {
  const pois = getPOIs();
  const trips = getTrips().slice(0,3);
  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Explore Kefalonia</h1>
        <p className="text-gray-600 mb-4">Tap a landmark on the map to see trips that include it.</p>
        <MapCanvas pois={pois.map(p=>({lat:p.lat, lon:p.lon, name:p.name, slug:p.slug}))} />
      </section>
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Featured trips</h2>
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
        </div>
      </section>
    </div>
  );
}
