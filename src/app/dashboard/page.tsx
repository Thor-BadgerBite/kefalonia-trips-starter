import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get provider data
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get trip count
  const { count: tripCount } = await supabase
    .from('trips')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', provider?.id);

  // Get pending bookings count
  const { count: pendingBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', provider?.id)
    .eq('status', 'pending');

  // Get today's bookings
  const today = new Date().toISOString().split('T')[0];
  const { count: todayBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', provider?.id)
    .eq('booking_date', today);

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('*, trips(title)')
    .eq('provider_id', provider?.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {provider?.name}!</h1>
        <p className="text-gray-600">Here's what's happening with your trips today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">My Trips</p>
              <p className="text-3xl font-bold">{tripCount || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
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
          </div>
          <Link
            href="/dashboard/trips/create"
            className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            Create new trip →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
              <p className="text-3xl font-bold text-orange-600">{pendingBookings || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-orange-600"
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
            </div>
          </div>
          {pendingBookings && pendingBookings > 0 ? (
            <Link
              href="/dashboard/bookings?status=pending"
              className="text-sm text-orange-600 hover:text-orange-700 mt-4 inline-block"
            >
              Review requests →
            </Link>
          ) : (
            <p className="text-sm text-gray-500 mt-4">All caught up!</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Bookings</p>
              <p className="text-3xl font-bold text-green-600">{todayBookings || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <Link
            href="/dashboard/availability"
            className="text-sm text-green-600 hover:text-green-700 mt-4 inline-block"
          >
            View calendar →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rating</p>
              <p className="text-3xl font-bold">{provider?.rating_avg.toFixed(1) || '0.0'}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">{provider?.rating_count || 0} reviews</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Bookings</h2>
          <Link
            href="/dashboard/bookings"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y">
          {recentBookings && recentBookings.length > 0 ? (
            recentBookings.map((booking: any) => (
              <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{booking.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    {booking.trips?.title} • {booking.party_size} people
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold">€{booking.price_total}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'pending'
                        ? 'bg-orange-100 text-orange-700'
                        : booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : booking.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <p>No bookings yet. Create your first trip to get started!</p>
              <Link
                href="/dashboard/trips/create"
                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Trip
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/trips/create"
          className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
        >
          <h3 className="text-xl font-semibold mb-2">Create New Trip</h3>
          <p className="text-blue-100">Design a custom trip for your customers</p>
        </Link>
        <Link
          href="/dashboard/vehicles"
          className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
        >
          <h3 className="text-xl font-semibold mb-2">Manage Fleet</h3>
          <p className="text-green-100">Add and update your vehicles</p>
        </Link>
        <Link
          href="/dashboard/availability"
          className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
        >
          <h3 className="text-xl font-semibold mb-2">Set Availability</h3>
          <p className="text-purple-100">Block dates or set your schedule</p>
        </Link>
      </div>
    </div>
  );
}
