'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Vehicle } from '@/lib/types';

interface TripBookingFormProps {
  trip: any;
  provider: any;
  availableVehicles: Vehicle[];
  defaultDate: string;
  defaultTime: string;
  defaultGuests: number;
}

export default function TripBookingForm({
  trip,
  provider,
  availableVehicles,
  defaultDate,
  defaultTime,
  defaultGuests,
}: TripBookingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  const [numGuests, setNumGuests] = useState(defaultGuests);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Calculate total price
  const calculateTotalPrice = () => {
    if (trip.price_type === 'per_person') {
      return trip.price_amount * numGuests;
    }
    return trip.price_amount;
  };

  // Calculate end time based on trip duration
  const calculateEndTime = () => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + trip.duration_minutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validation
      if (!customerName || !customerEmail || !customerPhone) {
        throw new Error('Please fill in all required fields');
      }

      if (!bookingDate || !startTime) {
        throw new Error('Please select date and time');
      }

      if (!agreedToTerms) {
        throw new Error('Please agree to the terms and conditions');
      }

      const totalPrice = calculateTotalPrice();
      const endTime = calculateEndTime();

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          provider_id: trip.provider_id,
          trip_id: trip.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: trip.duration_minutes,
          num_guests: numGuests,
          total_price: totalPrice,
          currency: trip.currency || 'EUR',
          status: 'pending',
          special_requests: specialRequests || null,
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

  const totalPrice = calculateTotalPrice();

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
              <p className="text-xs text-gray-500 mt-1">
                Confirmation will be sent to this email
              </p>
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

        {/* Trip Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Trip Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Guests *
              </label>
              <input
                type="number"
                value={numGuests}
                onChange={(e) => setNumGuests(parseInt(e.target.value))}
                min="1"
                max={trip.capacity || 50}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {startTime && (
            <div className="mt-2 text-sm text-gray-600">
              Estimated end time: {calculateEndTime()}
            </div>
          )}
        </div>

        {/* Special Requests */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Special Requests (Optional)</h3>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any special requirements, accessibility needs, dietary restrictions, etc."
          />
        </div>

        {/* Price Summary */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Price Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Trip price ({trip.price_type}):
              </span>
              <span className="font-medium">€{trip.price_amount}</span>
            </div>
            {trip.price_type === 'per_person' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">× {numGuests}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">€{totalPrice.toFixed(2)}</span>
            </div>
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
              . I understand that payment will be processed after the provider confirms
              availability.
            </span>
          </label>
        </div>

        {/* Contact Info */}
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
          {isSubmitting ? 'Processing...' : `Confirm Booking - €${totalPrice.toFixed(2)}`}
        </button>

        <p className="text-xs text-center text-gray-500">
          Your booking will be pending until the provider confirms availability. You will
          receive a confirmation email with payment instructions.
        </p>
      </form>
    </div>
  );
}
