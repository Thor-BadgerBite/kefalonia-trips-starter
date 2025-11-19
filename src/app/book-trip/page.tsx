import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripBookingForm from '@/components/booking/TripBookingForm';

export const metadata = {
  title: 'Book Trip | Kefalonia Trips',
  description: 'Complete your trip booking',
};

export default async function BookTripPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createServerSupabaseClient();

  const tripId = searchParams['trip'];
  const date = searchParams['date'] || '';
  const time = searchParams['time'] || '09:00';
  const guests = searchParams['guests'] || '2';

  if (!tripId) {
    redirect('/trips');
  }

  // Get trip details
  const { data: trip } = await supabase
    .from('trips')
    .select(
      `
      *,
      provider:provider_id(id, name, slug, phone, email, languages),
      trip_pois(
        *,
        poi:poi_id(*)
      )
    `
    )
    .eq('id', tripId)
    .single();

  if (!trip) {
    redirect('/trips');
  }

  // Get available vehicles for this provider
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('provider_id', trip.provider_id)
    .eq('active', true)
    .gte('capacity', parseInt(guests));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-600 mt-2">
            You're one step away from an amazing Kefalonia experience!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <TripBookingForm
              trip={trip}
              provider={trip.provider}
              availableVehicles={vehicles || []}
              defaultDate={date}
              defaultTime={time}
              defaultGuests={parseInt(guests)}
            />
          </div>

          {/* Trip Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Trip Summary</h2>

              {trip.images?.[0] && (
                <img
                  src={trip.images[0]}
                  alt={trip.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{trip.title}</h3>
                  <p className="text-sm text-gray-600">by {trip.provider.name}</p>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {Math.floor(trip.duration_minutes / 60)}h{' '}
                      {trip.duration_minutes % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stops:</span>
                    <span className="font-medium">
                      {trip.trip_pois?.length || 0} locations
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Languages:</span>
                    <span className="font-medium">
                      {trip.provider.languages?.join(', ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price per {trip.price_type}:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      €{trip.price_amount}
                    </span>
                  </div>
                </div>
              </div>

              {trip.includes && trip.includes.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-medium text-sm mb-2">Included:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {trip.includes.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {trip.exclusions && trip.exclusions.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <h4 className="font-medium text-sm mb-2">Not Included:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {trip.exclusions.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-600">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
