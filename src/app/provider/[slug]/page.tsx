import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { RatingStars } from '@/components/RatingStars';
import TripReviews from '@/components/reviews/TripReviews';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: provider } = await supabase
    .from('providers')
    .select('name, bio')
    .eq('slug', params.slug)
    .single();

  if (!provider) {
    return {
      title: 'Provider Not Found',
    };
  }

  return {
    title: `${provider.name} | Kefalonia Trips`,
    description: provider.bio || `Book trips and transfers with ${provider.name} in Kefalonia`,
  };
}

export default async function ProviderPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();

  // Get provider details
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', params.slug)
    .eq('active', true)
    .single();

  if (providerError || !provider) {
    notFound();
  }

  // Get provider's active trips
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      *,
      trip_pois(count)
    `)
    .eq('provider_id', provider.id)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('rating_avg', { ascending: false });

  // Get all reviews for this provider
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // Calculate overall provider rating
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Get provider stats
  const { data: completedBookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', provider.id)
    .eq('status', 'completed');

  const totalBookings = completedBookings || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Provider Logo/Avatar */}
            {provider.logo_url ? (
              <div className="w-32 h-32 rounded-full bg-white p-2 flex-shrink-0">
                <Image
                  src={provider.logo_url}
                  alt={provider.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0">
                <span className="text-6xl font-bold">
                  {provider.name.charAt(0)}
                </span>
              </div>
            )}

            {/* Provider Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{provider.name}</h1>
              {provider.business_type && (
                <p className="text-blue-100 text-lg capitalize mb-4">{provider.business_type}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-blue-100">({totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{typeof totalBookings === 'number' ? totalBookings : 0}+ trips completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>{trips?.length || 0} active trips</span>
                </div>
              </div>

              {/* Languages */}
              {provider.languages && provider.languages.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span>
                    Languages: {provider.languages.map((l: string) => l.toUpperCase()).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {provider.bio && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{provider.bio}</p>
              </div>
            )}

            {/* Trips Section */}
            {trips && trips.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Available Trips ({trips.length})</h2>
                <div className="grid gap-6">
                  {trips.map((trip: any) => {
                    const poiCount = trip.trip_pois?.[0]?.count || 0;
                    const priceLabel =
                      trip.price_type === 'per_person'
                        ? `€${trip.price_amount} / person`
                        : trip.price_type === 'hourly'
                        ? `€${trip.price_amount}/hour`
                        : `€${trip.price_amount} total`;

                    return (
                      <Link
                        key={trip.id}
                        href={`/trip/${trip.slug}`}
                        className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-4">
                          {trip.images && trip.images[0] && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={trip.images[0]}
                                alt={trip.title}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-2">{trip.title}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                              <span>{poiCount} stops</span>
                              <span>•</span>
                              <span>{Math.floor(trip.duration_minutes / 60)}h {trip.duration_minutes % 60}m</span>
                              <span>•</span>
                              <span className="font-semibold text-blue-600">{priceLabel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <RatingStars value={trip.rating_avg} count={trip.rating_count} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {reviews && reviews.length > 0 && (
              <TripReviews
                reviews={reviews}
                averageRating={averageRating}
                totalReviews={totalReviews}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-4 space-y-6">
              <h3 className="text-xl font-bold">Contact Information</h3>

              {/* Phone */}
              {provider.phone && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <a href={`tel:${provider.phone}`} className="text-blue-600 hover:underline font-medium">
                      {provider.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {provider.email && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline font-medium break-all">
                      {provider.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {provider.website && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Website</p>
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium break-all"
                    >
                      {provider.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}

              {/* Location */}
              {provider.address && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="text-gray-900">{provider.address}</p>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <div className="pt-4 border-t">
                <Link
                  href={`/#trips?provider=${provider.slug}`}
                  className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-center"
                >
                  View All Trips
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
