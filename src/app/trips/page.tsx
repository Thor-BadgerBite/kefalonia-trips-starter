import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TripCard } from '@/components/TripCard';
import TripSearchFilters from '@/components/trips/TripSearchFilters';

export default async function TripsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createServerSupabaseClient();

  // Get filter params
  const poiSlug = searchParams['poi'] ?? null;
  const date = searchParams['date'] ?? null;
  const startTime = searchParams['time'] ?? null;
  const guests = searchParams['guests'] ?? null;

  // Build query
  let query = supabase
    .from('trips')
    .select(
      `
      *,
      provider:provider_id(id, name, slug, rating_avg, rating_count),
      trip_pois(
        poi:poi_id(id, name, slug)
      )
    `
    )
    .eq('active', true);

  // Filter by POI if specified
  if (poiSlug) {
    const { data: poi } = await supabase
      .from('pois')
      .select('id')
      .eq('slug', poiSlug)
      .single();

    if (poi) {
      const { data: tripIds } = await supabase
        .from('trip_pois')
        .select('trip_id')
        .eq('poi_id', poi.id);

      if (tripIds) {
        query = query.in(
          'id',
          tripIds.map((t) => t.trip_id)
        );
      }
    }
  }

  // Filter by passenger capacity
  if (guests) {
    query = query.gte('capacity', parseInt(guests));
  }

  const { data: allTrips } = await query;

  // Filter by availability if date and time provided
  let availableTrips = allTrips || [];
  if (date && startTime && allTrips) {
    const availableProviders = await Promise.all(
      allTrips.map(async (trip) => {
        // Calculate end time based on trip duration
        const [hours, minutes] = startTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + trip.duration_minutes;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        // Check if provider has available vehicle
        const { data, error } = await supabase.rpc('provider_has_available_vehicle', {
          p_provider_id: trip.provider_id,
          p_date: date,
          p_start_time: startTime,
          p_end_time: endTime,
          p_min_capacity: guests ? parseInt(guests) : 1,
        });

        return { tripId: trip.id, available: data && !error };
      })
    );

    const availableMap = new Map(
      availableProviders.map((p) => [p.tripId, p.available])
    );
    availableTrips = allTrips.filter((trip) => availableMap.get(trip.id));
  }

  const trips = availableTrips;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Browse Trips {poiSlug ? `including ${poiSlug.replace('-', ' ')}` : ''}
        </h1>
        <p className="text-gray-600 mt-2">
          Discover amazing experiences across Kefalonia
        </p>
      </div>

      {/* Search Filters */}
      <TripSearchFilters
        defaultDate={date || ''}
        defaultTime={startTime || ''}
        defaultGuests={guests || ''}
        defaultPoi={poiSlug || ''}
      />

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} found
            {date && startTime && ' for your selected date and time'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              slug={trip.slug}
              title={trip.title}
              image={trip.images?.[0] || '/placeholder-trip.jpg'}
              durationMin={trip.duration_minutes}
              priceType={trip.price_type}
              priceAmount={trip.price_amount}
              currency={trip.currency}
              ratingAvg={trip.provider?.rating_avg || 0}
              ratingCount={trip.provider?.rating_count || 0}
              vehicleType={trip.vehicle_type}
              languages={['en', 'el']}
            />
          ))}
        </div>

        {trips.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No trips found</p>
            {date && startTime && (
              <p className="text-gray-500 text-sm">
                Try selecting a different date or time
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
