import Link from 'next/link';
import { getProviderBySlug, getTrips } from '@/lib/store';
import { RatingStars } from '@/components/RatingStars';
import { TripCard } from '@/components/TripCard';

export default function ProviderProfilePage({ params }: { params: { slug: string } }) {
  const provider = getProviderBySlug(params.slug);
  if (!provider) return <div className="text-center py-12">Provider not found.</div>;

  // Get all trips by this provider
  const providerTrips = getTrips().filter(t => t.providerId === provider.id);

  return (
    <div className="grid gap-8">
      {/* Provider Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Provider Logo/Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            {provider.name.charAt(0)}
          </div>

          {/* Provider Info */}
          <div className="flex-1 grid gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-2">{provider.name}</h1>
              <RatingStars value={provider.ratingAvg} count={provider.ratingCount} />
            </div>

            {/* Languages */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Languages:</span>
              <div className="flex gap-2">
                {provider.languages.map(lang => (
                  <span key={lang} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {lang.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-600">Total Trips:</span>
                <span className="ml-2 font-semibold">{providerTrips.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Reviews:</span>
                <span className="ml-2 font-semibold">{provider.ratingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet/Vehicles */}
      <section className="grid gap-4">
        <h2 className="text-2xl font-bold">Our Fleet</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {provider.vehicles.map((vehicle, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow p-6 grid gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{vehicle.type}</h3>
                <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  {vehicle.seats} seats
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map(feature => (
                  <span key={feature} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    ✓ {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Provider's Trips */}
      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Trips by {provider.name}</h2>
          <span className="text-sm text-gray-600">{providerTrips.length} trips available</span>
        </div>

        {providerTrips.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providerTrips.map(trip => (
              <TripCard
                key={trip.id}
                slug={trip.slug}
                title={trip.title}
                image={trip.images[0]}
                durationMin={trip.durationMin}
                priceType={trip.priceType}
                priceAmount={trip.priceAmount}
                currency={trip.currency}
                ratingAvg={trip.ratingAvg}
                ratingCount={trip.ratingCount}
                vehicleType={trip.vehicleType}
                languages={trip.languages}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600">This provider hasn't created any trips yet.</p>
          </div>
        )}
      </section>

      {/* Why Book With Us */}
      <section className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 grid gap-4">
        <h2 className="text-2xl font-bold">Why book with {provider.name}?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              ★
            </div>
            <div>
              <h4 className="font-semibold mb-1">Highly Rated</h4>
              <p className="text-sm text-gray-700">
                {provider.ratingAvg} stars from {provider.ratingCount} verified reviews
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-semibold mb-1">Experienced Guides</h4>
              <p className="text-sm text-gray-700">
                Local expertise and multilingual support
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              🚐
            </div>
            <div>
              <h4 className="font-semibold mb-1">Modern Fleet</h4>
              <p className="text-sm text-gray-700">
                Comfortable, air-conditioned vehicles
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              💎
            </div>
            <div>
              <h4 className="font-semibold mb-1">Custom Trips</h4>
              <p className="text-sm text-gray-700">
                Flexible itineraries tailored to your interests
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Link
          href="/trips"
          className="px-6 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition"
        >
          ← Browse All Trips
        </Link>
      </div>
    </div>
  );
}
