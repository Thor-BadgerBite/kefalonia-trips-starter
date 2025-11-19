import { createServerSupabaseClient } from '@/lib/supabase/server';
import CustomTripBuilder from '@/components/custom-trip/CustomTripBuilder';

export const metadata = {
  title: 'Build Your Custom Trip | Kefalonia Trips',
  description: 'Create your own personalized trip with custom POI selection',
};

export default async function CustomTripPage() {
  const supabase = createServerSupabaseClient();

  // Get all POIs
  const { data: pois } = await supabase
    .from('pois')
    .select('*')
    .order('name');

  // Get verified providers who accept custom trips
  const { data: providers } = await supabase
    .from('providers')
    .select('id, name, slug, rating_avg, rating_count, hourly_waiting_rate, accepts_custom_trips')
    .eq('verified', true)
    .eq('accepts_custom_trips', true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Build Your Custom Trip
          </h1>
          <p className="text-lg text-gray-600">
            Design your perfect Kefalonia experience - choose your stops, set your pace, get instant price estimates
          </p>
        </div>

        <CustomTripBuilder
          availablePOIs={pois || []}
          availableProviders={providers || []}
        />
      </div>
    </div>
  );
}
