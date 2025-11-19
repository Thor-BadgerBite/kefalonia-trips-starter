import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function TripsListPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Get provider
  const { data: provider } = await supabase
    .from('providers')
    .select('id, name')
    .eq('user_id', user.id)
    .single();

  if (!provider) redirect('/dashboard');

  // Get provider's trips with POI count
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      *,
      trip_pois(count)
    `)
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-gray-600 mt-1">Manage your custom trip offerings</p>
        </div>
        <Link
          href="/dashboard/trips/create"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Trip
        </Link>
      </div>

      {trips && trips.length > 0 ? (
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
              <div key={trip.id} className="bg-white rounded-xl shadow hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{trip.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            trip.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {trip.active ? 'Active' : 'Inactive'}
                        </span>
                        {trip.featured && (
                          <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                            ⭐ Featured
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {trip.description || 'No description'}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="font-medium">{poiCount} stops</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            {Math.floor(trip.duration_minutes / 60)}h{' '}
                            {trip.duration_minutes % 60}m
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>Up to {trip.seats_max} seats</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-semibold text-blue-600">{priceLabel}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{trip.rating_avg.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-gray-500">({trip.rating_count} reviews)</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500 capitalize">{trip.vehicle_type}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/trip/${trip.slug}`}
                        target="_blank"
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-center"
                      >
                        View Public Page
                      </Link>
                      <Link
                        href={`/dashboard/trips/${trip.id}/edit`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 text-center"
                      >
                        Edit Trip
                      </Link>
                      <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                        {trip.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">No trips yet</h3>
            <p className="text-gray-600">
              Create your first custom trip to start receiving bookings from tourists.
            </p>
            <Link
              href="/dashboard/trips/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Create Your First Trip
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
