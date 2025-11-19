'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ReviewTripPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const bookingNumber = searchParams?.get('booking');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingCleanliness, setRatingCleanliness] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingAccuracy, setRatingAccuracy] = useState(0);

  useEffect(() => {
    if (bookingNumber) {
      loadBooking();
    } else {
      setError('No booking number provided');
      setLoading(false);
    }
  }, [bookingNumber]);

  async function loadBooking() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trip_id(id, title, slug, images),
          provider:provider_id(id, name, slug)
        `)
        .eq('booking_number', bookingNumber)
        .single();

      if (error || !data) {
        setError('Booking not found');
        setLoading(false);
        return;
      }

      // Check if already reviewed
      if (data.reviewed) {
        setError('You have already reviewed this trip');
        setLoading(false);
        return;
      }

      // Check if booking is completed
      if (data.status !== 'completed') {
        setError('You can only review completed trips');
        setLoading(false);
        return;
      }

      setBooking(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading booking:', err);
      setError('Failed to load booking');
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (rating === 0) {
        throw new Error('Please select a rating');
      }

      if (!comment.trim()) {
        throw new Error('Please write a review');
      }

      // Create review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          booking_id: booking.id,
          trip_id: booking.trip_id,
          provider_id: booking.provider_id,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
          rating_communication: ratingCommunication || null,
          rating_cleanliness: ratingCleanliness || null,
          rating_value: ratingValue || null,
          rating_accuracy: ratingAccuracy || null,
          status: 'published',
          verified_booking: true,
        });

      if (reviewError) throw reviewError;

      // Mark booking as reviewed
      await supabase
        .from('bookings')
        .update({ reviewed: true })
        .eq('id', booking.id);

      // Redirect to success message
      router.push(`/review-success?trip=${booking.trip.slug}`);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Review</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tripTitle = booking.trip?.title || 'Transfer Service';
  const tripImage = booking.trip?.images?.[0];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
            <h1 className="text-2xl font-bold">Share Your Experience</h1>
            <p className="text-blue-100 mt-1">Help others discover great trips</p>
          </div>

          {/* Trip Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              {tripImage && (
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={tripImage} alt={tripTitle} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-lg">{tripTitle}</h2>
                <p className="text-sm text-gray-600">with {booking.provider.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(booking.booking_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Fair'}
                  {rating === 1 && 'Poor'}
                </p>
              )}
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details of your own experience at this place"
                rows={5}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 characters</p>
            </div>

            {/* Detailed Ratings */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Detailed Ratings (optional)</h3>
              <div className="space-y-4">
                <RatingCategory
                  label="Communication"
                  value={ratingCommunication}
                  onChange={setRatingCommunication}
                />
                <RatingCategory
                  label="Cleanliness"
                  value={ratingCleanliness}
                  onChange={setRatingCleanliness}
                />
                <RatingCategory
                  label="Value for Money"
                  value={ratingValue}
                  onChange={setRatingValue}
                />
                <RatingCategory
                  label="Accuracy"
                  value={ratingAccuracy}
                  onChange={setRatingAccuracy}
                  description="Did the trip match the description?"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || rating === 0 || !comment.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function RatingCategory({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="transition-transform hover:scale-110"
            >
              <svg
                className={`w-5 h-5 ${
                  star <= value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}
