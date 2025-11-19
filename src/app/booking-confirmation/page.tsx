import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Booking Confirmation | Kefalonia Trips',
  description: 'Your booking has been confirmed',
};

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const supabase = createServerSupabaseClient();
  const bookingNumber = searchParams['booking'];

  if (!bookingNumber) {
    redirect('/');
  }

  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select(
      `
      *,
      trip:trip_id(id, title, slug, images),
      provider:provider_id(id, name, slug, phone, email),
      vehicle:vehicle_id(id, model, type)
    `
    )
    .eq('booking_number', bookingNumber)
    .single();

  if (!booking) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your trip request has been submitted successfully
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600">Booking Number</p>
              <p className="text-2xl font-bold text-gray-900">{booking.booking_number}</p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Trip Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{booking.trip?.title}</h2>
              <p className="text-gray-600">Provided by {booking.provider.name}</p>
            </div>

            {booking.trip?.images?.[0] && (
              <img
                src={booking.trip.images[0]}
                alt={booking.trip.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">
                  {new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">
                  {booking.start_time} - {booking.end_time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Guests</p>
                <p className="font-medium">{booking.num_guests} people</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="font-medium text-lg text-blue-600">
                  €{booking.total_price}
                </p>
              </div>
            </div>

            {booking.special_requests && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Special Requests</p>
                <p className="text-gray-900">{booking.special_requests}</p>
              </div>
            )}
          </div>
        </div>

        {/* What's Next Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
          <ol className="space-y-3 text-sm text-blue-800">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>
                <strong>Confirmation Email Sent</strong> - Check your inbox at{' '}
                <strong>{booking.customer_email}</strong> for booking details
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>
                <strong>Provider Reviews Your Request</strong> - {booking.provider.name}{' '}
                will confirm availability within 24 hours
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>
                <strong>Payment Instructions</strong> - Once confirmed, you'll receive
                payment details and meeting point information
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>
                <strong>Enjoy Your Trip!</strong> - Meet your guide at the designated
                location and enjoy your Kefalonia adventure
              </span>
            </li>
          </ol>
        </div>

        {/* Provider Contact Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Need to Contact the Provider?</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-600">Provider:</span>{' '}
              <span className="font-medium">{booking.provider.name}</span>
            </p>
            {booking.provider.phone && (
              <p>
                <span className="text-gray-600">Phone:</span>{' '}
                <a
                  href={`tel:${booking.provider.phone}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {booking.provider.phone}
                </a>
              </p>
            )}
            {booking.provider.email && (
              <p>
                <span className="text-gray-600">Email:</span>{' '}
                <a
                  href={`mailto:${booking.provider.email}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {booking.provider.email}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700"
          >
            Back to Home
          </Link>
          <Link
            href="/trips"
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-50"
          >
            Browse More Trips
          </Link>
        </div>

        {/* Print/Save */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Print or Save Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}
