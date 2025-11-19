'use client';

import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';

interface AnalyticsDashboardProps {
  provider: { id: string; name: string };
  bookings: any[];
  reviews: any[];
  trips: any[];
  startDate: string;
  endDate: string;
}

export default function AnalyticsDashboard({
  provider,
  bookings,
  reviews,
  trips,
  startDate,
  endDate,
}: AnalyticsDashboardProps) {
  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;

    const totalRevenue = bookings
      .filter(b => b.status === 'completed' && b.payment_status === 'paid')
      .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      totalRevenue,
      averageBookingValue,
      conversionRate,
      averageRating,
      totalReviews: reviews.length,
    };
  }, [bookings, reviews]);

  // Bookings over time
  const bookingsOverTime = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayBookings = bookings.filter(b => {
        const bookingDate = startOfDay(parseISO(b.created_at));
        return bookingDate.getTime() === dayStart.getTime();
      });

      return {
        date: format(day, 'MMM dd'),
        count: dayBookings.length,
        revenue: dayBookings
          .filter(b => b.status === 'completed' && b.payment_status === 'paid')
          .reduce((sum, b) => sum + parseFloat(b.total_price), 0),
      };
    });
  }, [bookings, startDate, endDate]);

  // Top performing trips
  const topTrips = useMemo(() => {
    const tripStats = trips.map(trip => {
      const tripBookings = bookings.filter(b => b.trip_id === trip.id);
      const completedTripBookings = tripBookings.filter(b => b.status === 'completed');
      const revenue = completedTripBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

      return {
        ...trip,
        bookingCount: tripBookings.length,
        revenue,
      };
    });

    return tripStats.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [trips, bookings]);

  // Revenue by status
  const revenueByStatus = useMemo(() => {
    return [
      {
        status: 'Completed',
        count: metrics.completedBookings,
        revenue: metrics.totalRevenue,
        color: 'bg-green-500',
      },
      {
        status: 'Pending',
        count: metrics.pendingBookings,
        revenue: bookings
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + parseFloat(b.total_price), 0),
        color: 'bg-yellow-500',
      },
      {
        status: 'Cancelled',
        count: metrics.cancelledBookings,
        revenue: 0,
        color: 'bg-red-500',
      },
    ];
  }, [bookings, metrics]);

  const maxBookings = Math.max(...bookingsOverTime.map(d => d.count), 1);
  const maxRevenue = Math.max(...bookingsOverTime.map(d => d.revenue), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Last 30 days performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`€${metrics.totalRevenue.toFixed(2)}`}
          subtitle={`€${metrics.averageBookingValue.toFixed(2)} avg per booking`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-green-100 text-green-600"
        />

        <MetricCard
          title="Total Bookings"
          value={metrics.totalBookings.toString()}
          subtitle={`${metrics.completedBookings} completed`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="bg-blue-100 text-blue-600"
        />

        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          subtitle="Booking to completion"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="bg-purple-100 text-purple-600"
        />

        <MetricCard
          title="Average Rating"
          value={metrics.averageRating.toFixed(1)}
          subtitle={`${metrics.totalReviews} reviews`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bookings Over Time */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Bookings Over Time</h3>
          <div className="space-y-2">
            {bookingsOverTime.filter((_, i) => i % 3 === 0).map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-16 text-sm text-gray-600">{day.date}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${(day.count / maxBookings) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-sm font-medium text-right">{day.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <div className="space-y-2">
            {bookingsOverTime.filter((_, i) => i % 3 === 0).map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-16 text-sm text-gray-600">{day.date}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm font-medium text-right">€{day.revenue.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Status Breakdown */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Booking Status Breakdown</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {revenueByStatus.map((item) => (
            <div key={item.status} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="font-medium">{item.status}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Count</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-semibold">€{item.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Trips */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Trips</h3>
        {topTrips.length > 0 ? (
          <div className="space-y-4">
            {topTrips.map((trip, index) => (
              <div key={trip.id} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{trip.title}</h4>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600">
                    <span>{trip.bookingCount} bookings</span>
                    <span>•</span>
                    <span className="font-semibold text-green-600">€{trip.revenue.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Avg. Rating</div>
                  <div className="font-semibold">{trip.rating_avg.toFixed(1)} ⭐</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No trip data available yet</p>
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{review.customer_name}</div>
                    <div className="text-sm text-gray-600">
                      {format(parseISO(review.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
                    ))}
                  </div>
                </div>
                {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                <p className="text-sm text-gray-700 line-clamp-2">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600">{subtitle}</div>
    </div>
  );
}
