import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BookingManagement from '@/components/bookings/BookingManagement';

export const metadata = {
  title: 'Bookings | Kefalonia Trips',
  description: 'Manage your trip bookings',
};

export default async function BookingsPage() {
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

  // Get all bookings for this provider
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      *,
      trip:trip_id(id, title, slug, duration_minutes),
      vehicle:vehicle_id(id, model, type)
    `
    )
    .eq('provider_id', provider.id)
    .order('booking_date', { ascending: true })
    .order('start_time', { ascending: true });

  // Get provider's vehicles for assignment
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('active', true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-2">Manage your trip and transfer bookings</p>
      </div>

      <BookingManagement
        providerId={provider.id}
        initialBookings={bookings || []}
        vehicles={vehicles || []}
      />
    </div>
  );
}
