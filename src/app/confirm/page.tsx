import Link from 'next/link';
import { getTripBySlug } from '@/lib/store';

export default function ConfirmPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const tripSlug = searchParams['trip'];
  const date = searchParams['date'];
  const time = searchParams['time'];
  const party = searchParams['party'];

  const trip = tripSlug ? getTripBySlug(tripSlug) : null;

  return (
    <div className="max-w-2xl mx-auto grid gap-6 py-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Booking Request Received!</h1>
        <p className="text-gray-600">This is a Phase 1 demo. In production, you would receive a confirmation email and SMS.</p>
      </div>

      {/* Booking Details Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 grid gap-4">
        <h2 className="text-xl font-semibold border-b pb-3">Booking Details</h2>

        {trip && (
          <div className="grid gap-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Trip</span>
              <span className="font-medium">{trip.title}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">{date || 'Not specified'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Start Time</span>
              <span className="font-medium">{time || 'Not specified'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Party Size</span>
              <span className="font-medium">{party || '2'} people</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{Math.round(trip.durationMin / 60)}h {trip.durationMin % 60 > 0 ? `${trip.durationMin % 60}min` : ''}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Price</span>
              <span className="font-semibold text-lg text-blue-600">
                {trip.priceType === 'per_person'
                  ? `€${trip.priceAmount * parseInt(party || '2')}`
                  : `€${trip.priceAmount}`}
              </span>
            </div>
          </div>
        )}

        {!trip && (
          <p className="text-center text-gray-500 py-4">No trip information available</p>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 rounded-2xl p-6 grid gap-3">
        <h3 className="font-semibold text-lg">What happens next?</h3>
        <ul className="grid gap-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span>The provider will review your request and confirm availability</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span>You'll receive a confirmation email with pickup details and provider contact</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span>Payment will be processed once the booking is confirmed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span>You can contact the provider directly for any special requests</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Link href="/" className="px-6 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition">
          Back to Home
        </Link>
        <Link href="/trips" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
          Browse More Trips
        </Link>
      </div>

      {/* Demo Note */}
      <div className="text-center text-xs text-gray-500 border-t pt-6 mt-4">
        <p>🚀 This is a Phase 1 MVP Demo</p>
        <p>In production: Real-time availability, SMS/email notifications, secure payments via Stripe Connect</p>
      </div>
    </div>
  );
}
