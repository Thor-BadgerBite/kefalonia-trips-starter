'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Vehicle } from '@/lib/types';

interface TransferBookingFormProps {
  provider: any;
  fromRegion: any;
  toRegion: any;
  availableVehicles: Vehicle[];
  defaultDate: string;
  defaultTime: string;
  defaultPassengers: number;
  estimatedPrice: number;
}

export default function TransferBookingForm({
  provider,
  fromRegion,
  toRegion,
  availableVehicles,
  defaultDate,
  defaultTime,
  defaultPassengers,
  estimatedPrice,
}: TransferBookingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [pickupTime, setPickupTime] = useState(defaultTime);
  const [numPassengers, setNumPassengers] = useState(defaultPassengers);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validation
      if (!customerName || !customerEmail || !customerPhone) {
        throw new Error('Please fill in all required fields');
      }

      if (!bookingDate || !pickupTime) {
        throw new Error('Please select date and time');
      }

      if (!pickupAddress || !dropoffAddress) {
        throw new Error('Please provide pickup and dropoff addresses');
      }

      if (!agreedToTerms) {
        throw new Error('Please agree to the terms and conditions');
      }

      // Create transfer booking note
      const transferNote = `Transfer from ${fromRegion.name} to ${toRegion.name}.\nPickup: ${pickupAddress}\nDropoff: ${dropoffAddress}${flightNumber ? `\nFlight: ${flightNumber}` : ''}`;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          provider_id: provider.id,
          trip_id: null, // This is a transfer, not a trip
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          booking_date: bookingDate,
          start_time: pickupTime,
          end_time: null, // Transfer end time not predetermined
          duration_minutes: 60, // Estimate 1 hour
          num_guests: numPassengers,
          total_price: estimatedPrice,
          currency: 'EUR',
          status: 'pending',
          special_requests: transferNote + (specialRequests ? `\n\nAdditional requests: ${specialRequests}` : ''),
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Send confirmation emails (non-blocking)
      fetch('/api/send-booking-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      }).catch((err) => console.error('Failed to send emails:', err));

      // Redirect to confirmation page
      router.push(`/booking-confirmation?booking=${booking.booking_number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+30 123 456 7890"
              />
            </div>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Transfer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Time *
              </label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passengers *
              </label>
              <input
                type="number"
                value={numPassengers}
                onChange={(e) => setNumPassengers(parseInt(e.target.value))}
                min="1"
                max="50"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exact Pickup Address *
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Hotel Ionian Blue, Argostoli"
              />
              <p className="text-xs text-gray-500 mt-1">
                Full address in {fromRegion?.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exact Dropoff Address *
              </label>
              <input
                type="text"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Kefalonia Airport, Terminal"
              />
              <p className="text-xs text-gray-500 mt-1">
                Full address in {toRegion?.name}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flight Number (Optional)
            </label>
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., BA123 - For airport pickups/dropoffs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Helps driver track flight delays
            </p>
          </div>
        </div>

        {/* Special Requests */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Special Requests (Optional)</h3>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Child seats, luggage quantity, accessibility needs, etc."
          />
        </div>

        {/* Price Summary */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Price</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Estimated Total:</span>
              <span className="text-blue-600">€{estimatedPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Final price confirmed by provider after reviewing exact addresses
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t pt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300"
              required
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                terms and conditions
              </a>{' '}
              and{' '}
              <a href="/cancellation-policy" className="text-blue-600 hover:underline">
                cancellation policy
              </a>
              . I understand that the final price may vary based on exact pickup/dropoff
              locations and will be confirmed by the provider.
            </span>
          </label>
        </div>

        {/* Provider Contact */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Provider Contact</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>{provider.name}</strong>
            </p>
            {provider.phone && (
              <p>
                Phone: <a href={`tel:${provider.phone}`}>{provider.phone}</a>
              </p>
            )}
            {provider.email && (
              <p>
                Email:{' '}
                <a href={`mailto:${provider.email}`} className="hover:underline">
                  {provider.email}
                </a>
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !agreedToTerms}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isSubmitting
            ? 'Processing...'
            : `Request Transfer - €${estimatedPrice.toFixed(2)}`}
        </button>

        <p className="text-xs text-center text-gray-500">
          Your transfer request will be sent to the provider for confirmation. You will
          receive a confirmation email with final details and payment instructions.
        </p>
      </form>
    </div>
  );
}
