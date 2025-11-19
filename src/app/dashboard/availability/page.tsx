import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AvailabilityCalendar from '@/components/availability/AvailabilityCalendar';

export const metadata = {
  title: 'Availability Calendar | Kefalonia Trips',
  description: 'Manage your availability and bookings',
};

export default async function AvailabilityPage() {
  const supabase = createServerSupabaseClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get provider profile
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!provider) {
    redirect('/auth/login');
  }

  // Get all vehicles for this provider
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('active', true)
    .order('model');

  // Get upcoming bookings (next 30 days)
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const future = futureDate.toISOString().split('T')[0];

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      *,
      trip:trip_id(id, title, slug),
      vehicle:vehicle_id(id, model, type)
    `
    )
    .eq('provider_id', provider.id)
    .gte('booking_date', today)
    .lte('booking_date', future)
    .in('status', ['pending', 'confirmed'])
    .order('booking_date');

  // Get availability blocks (next 30 days)
  const { data: availabilityBlocks } = await supabase
    .from('availability')
    .select(
      `
      *,
      vehicle:vehicle_id(id, model, type)
    `
    )
    .eq('provider_id', provider.id)
    .gte('date', today)
    .lte('date', future)
    .order('date');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Availability Calendar</h1>
        <p className="text-gray-600 mt-2">
          Manage your schedule, view bookings, and block unavailable time slots
        </p>
      </div>

      <AvailabilityCalendar
        providerId={provider.id}
        vehicles={vehicles || []}
        initialBookings={bookings || []}
        initialAvailability={availabilityBlocks || []}
      />
    </div>
  );
}
