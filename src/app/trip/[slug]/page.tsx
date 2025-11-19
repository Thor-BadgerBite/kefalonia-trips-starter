import Image from 'next/image';
import Link from 'next/link';
import { getTripBySlug, getProviderBySlug, getPOIs } from '@/lib/store';
import { RatingStars } from '@/components/RatingStars';
import { BookingSheet } from '@/components/BookingSheet';

export default function TripDetailPage({ params }: { params: { slug: string } }) {
  const trip = getTripBySlug(params.slug);
  if (!trip) return <div>Trip not found.</div>;

  const provider = getProviderBySlug(trip.providerId.replace('prov_', '').replace('_', '-'));
  const allPOIs = getPOIs();
  const tripPOIs = allPOIs.filter(p => trip.poiIds.includes(p.id));

  const priceLabel =
    trip.priceType === 'per_person' ? `€${trip.priceAmount} / person` :
    trip.priceType === 'hourly' ? `€${trip.priceAmount}/hour` :
    `€${trip.priceAmount} (total)`;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 grid gap-6">
        {/* Image Gallery */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-lg bg-gray-200">
          <Image src={trip.images[0]} alt={trip.title} fill className="object-cover" />
        </div>

        {/* Trip Header */}
        <div className="grid gap-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <RatingStars value={trip.ratingAvg} count={trip.ratingCount} />
          </div>

          {/* Trip Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Duration:</span>
              <span>{Math.round(trip.durationMin / 60)}h {trip.durationMin % 60 > 0 ? `${trip.durationMin % 60}min` : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Price:</span>
              <span className="text-lg font-semibold text-blue-600">{priceLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Vehicle:</span>
              <span className="px-3 py-1 rounded-full bg-gray-100">{trip.vehicleType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Max seats:</span>
              <span>{trip.seatsMax}</span>
            </div>
          </div>

          {/* Languages */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Languages:</span>
            <div className="flex gap-2">
              {trip.languages.map(lang => (
                <span key={lang} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {lang.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Itinerary - POIs */}
        <section className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Itinerary</h2>
          <div className="grid gap-3">
            {tripPOIs.map((poi, idx) => (
              <Link
                key={poi.id}
                href={`/poi/${poi.slug}`}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{poi.name}</h3>
                  <p className="text-sm text-gray-600">{poi.shortDesc}</p>
                  <div className="flex gap-2 mt-2">
                    {poi.categories.map(cat => (
                      <span key={cat} className="text-xs bg-white px-2 py-1 rounded">{cat}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* What's Included */}
        <section className="border-t pt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-700">✓ What's Included</h3>
            <ul className="grid gap-2">
              {trip.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-700">✗ Not Included</h3>
            <ul className="grid gap-2">
              {trip.exclusions.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Provider Info */}
        {provider && (
          <section className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Provided by</h3>
            <Link
              href={`/providers/${provider.slug}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                {provider.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{provider.name}</h4>
                <RatingStars value={provider.ratingAvg} count={provider.ratingCount} />
                <div className="flex gap-2 mt-2">
                  {provider.languages.map(lang => (
                    <span key={lang} className="text-xs bg-white px-2 py-1 rounded">
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-blue-600 font-medium text-sm">View profile →</span>
            </Link>
          </section>
        )}
      </div>

      {/* Booking Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <BookingSheet tripSlug={trip.slug} />
        </div>
      </div>
    </div>
  );
}
