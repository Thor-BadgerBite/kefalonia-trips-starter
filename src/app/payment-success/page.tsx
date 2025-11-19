import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Payment Successful | Kefalonia Trips',
  description: 'Your payment was successful',
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const bookingNumber = searchParams?.booking;
  const sessionId = searchParams?.session_id;
  const bookingType = searchParams?.type || 'trip';

  if (!bookingNumber && !sessionId) {
    redirect('/');
  }

  const supabase = createServerSupabaseClient();

  // Handle package bookings
  if (bookingType === 'package') {
    const { data: packageBooking } = await supabase
      .from('package_bookings')
      .select(`
        *,
        package:package_id(name, slug),
        provider:provider_id(name, slug, phone, email)
      `)
      .eq(bookingNumber ? 'booking_number' : 'stripe_session_id', bookingNumber || sessionId)
      .single();

    if (!packageBooking) {
      redirect('/');
    }

    // Get trips in this package
    const { data: packageTrips } = await supabase
      .from('package_trips')
      .select(`
        trip:trip_id(title, slug)
      `)
      .eq('package_id', packageBooking.package_id)
      .order('trip_order');

    const trips = packageTrips?.map((pt) => pt.trip) || [];

    return renderPackageSuccess(packageBooking, trips);
  }

  // Handle regular trip bookings
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      trip:trip_id(title, slug, images),
      provider:provider_id(name, slug, phone, email),
      payment:payment_id(*)
    `)
    .eq('booking_number', bookingNumber!)
    .single();

  if (!booking) {
    redirect('/');
  }

  const tripTitle = booking.trip?.title || 'Transfer Service';
  const tripImage = booking.trip?.images?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-opacity-20 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100 text-lg">
              Your booking has been confirmed and paid
            </p>
          </div>

          {/* Booking Details */}
          <div className="p-8 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-green-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Confirmation sent to your email</p>
                  <p className="text-sm text-green-700">{booking.customer_email}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Number</span>
                  <span className="font-semibold">{booking.booking_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trip</span>
                  <span className="font-semibold">{tripTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-semibold">{booking.provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold">
                    {new Date(booking.booking_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {booking.start_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time</span>
                    <span className="font-semibold">{booking.start_time}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-semibold">{booking.num_guests}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="text-2xl font-bold text-green-600">
                      €{booking.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div>
              <h3 className="font-semibold mb-3">What's Next?</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Check your email</p>
                    <p className="text-sm text-gray-600">
                      We've sent a confirmation with all the details to {booking.customer_email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Provider will contact you</p>
                    <p className="text-sm text-gray-600">
                      {booking.provider.name} will reach out to confirm pickup location and final details
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Enjoy your trip!</p>
                    <p className="text-sm text-gray-600">
                      Get ready for an amazing experience in Kefalonia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Contact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Need to contact the provider?</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{booking.provider.email}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{booking.provider.phone}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-center"
              >
                Back to Home
              </Link>
              <Link
                href={`/trip/${booking.trip?.slug}`}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-center"
              >
                View Trip Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderPackageSuccess(packageBooking: any, trips: any[]) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-opacity-20 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Package Booking Confirmed!</h1>
            <p className="text-green-100 text-lg">
              Your package has been confirmed and paid
            </p>
          </div>

          {/* Booking Details */}
          <div className="p-8 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-green-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Confirmation sent to your email</p>
                  <p className="text-sm text-green-700">{packageBooking.customer_email}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Package Booking Details</h2>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Number</span>
                  <span className="font-semibold">{packageBooking.booking_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Package</span>
                  <span className="font-semibold">{packageBooking.package.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-semibold">{packageBooking.provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-semibold">
                    {new Date(packageBooking.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-semibold">{packageBooking.num_guests}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="text-2xl font-bold text-green-600">
                      €{packageBooking.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Included Trips */}
            <div>
              <h3 className="font-semibold mb-3">Included Trips ({trips.length})</h3>
              <div className="space-y-2">
                {trips.map((trip: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{trip.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Next */}
            <div>
              <h3 className="font-semibold mb-3">What's Next?</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Check your email</p>
                    <p className="text-sm text-gray-600">
                      We've sent a confirmation with all the details to {packageBooking.customer_email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Provider will contact you</p>
                    <p className="text-sm text-gray-600">
                      {packageBooking.provider.name} will reach out to confirm schedule and final details
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Enjoy your package experience!</p>
                    <p className="text-sm text-gray-600">
                      Get ready for an amazing multi-day adventure in Kefalonia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Contact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Need to contact the provider?</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{packageBooking.provider.email}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{packageBooking.provider.phone}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-center"
              >
                Back to Home
              </Link>
              <Link
                href={`/packages/${packageBooking.package.slug}`}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-center"
              >
                View Package Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
