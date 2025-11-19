import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Payment Canceled | Kefalonia Trips',
  description: 'Your payment was canceled',
};

export default async function PaymentCanceledPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const bookingNumber = searchParams?.booking;

  if (!bookingNumber) {
    redirect('/');
  }

  const supabase = createServerSupabaseClient();

  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      trip:trip_id(title, slug),
      provider:provider_id(name, slug)
    `)
    .eq('booking_number', bookingNumber)
    .single();

  if (!booking) {
    redirect('/');
  }

  const tripTitle = booking.trip?.title || 'Transfer Service';
  const tripSlug = booking.trip?.slug;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Canceled Header */}
          <div className="bg-gradient-to-r from-gray-600 to-gray-500 text-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white bg-opacity-20 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Canceled</h1>
            <p className="text-gray-100 text-lg">
              Your payment was not completed
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3 text-yellow-800">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium">Your booking is still reserved</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Booking #{booking.booking_number} is on hold for the next 24 hours. You can complete payment anytime during this period.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
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
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-2xl font-bold text-gray-900">
                      €{booking.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What Happened */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What happened?</h3>
              <p className="text-sm text-blue-800">
                You either clicked the back button, closed the payment window, or the payment timed out.
                Don't worry - your booking details are saved and you can try again anytime.
              </p>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="font-semibold mb-3">What would you like to do?</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Try payment again</p>
                    <p className="text-sm text-gray-600">
                      Complete your booking by making the payment now
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Check your email</p>
                    <p className="text-sm text-gray-600">
                      We sent you a confirmation with a payment link to {booking.customer_email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Browse other trips</p>
                    <p className="text-sm text-gray-600">
                      Explore more amazing experiences in Kefalonia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => window.location.href = `/api/create-checkout-session?bookingId=${booking.id}`}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-center inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Complete Payment
              </button>
              {tripSlug && (
                <Link
                  href={`/trip/${tripSlug}`}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-center"
                >
                  View Trip Details
                </Link>
              )}
              <Link
                href="/"
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
