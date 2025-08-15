import Image from 'next/image';
import Link from 'next/link';
import { getPOIBySlug, getTripsByPOI } from '@/lib/store';
import { TripCard } from '@/components/TripCard';

export default function POIPage({ params }: { params: { slug: string } }) {
  const poi = getPOIBySlug(params.slug);
  if (!poi) return <div>POI not found.</div>;
  const trips = getTripsByPOI(poi.id);

  return (
    <div className="grid gap-6">
      <header className="grid md:grid-cols-2 gap-4 items-start">
        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow bg-gray-200">
          <Image src={poi.images[0]} alt={poi.name} fill className="object-cover" />
        </div>
        <div className="grid gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">{poi.name}</h1>
          <p className="text-gray-700">{poi.shortDesc}</p>
          <div className="flex gap-2 flex-wrap">
            {poi.categories.map(c => <span key={c} className="text-xs bg-gray-100 rounded px-2 py-1">{c}</span>)}
          </div>
          <Link href={`/trips?poi=${poi.slug}`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl w-fit">See trips</Link>
        </div>
      </header>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Trips that include {poi.name}</h2>
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
          {trips.length === 0 && <p>No trips yet that include this POI.</p>}
        </div>
      </section>
    </div>
  );
}
