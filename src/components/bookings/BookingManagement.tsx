'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Booking, Vehicle } from '@/lib/types';

interface BookingManagementProps {
  providerId: string;
  initialBookings: Booking[];
  vehicles: Vehicle[];
}

type TabType = 'upcoming' | 'pending' | 'completed' | 'cancelled';

export default function BookingManagement({
  providerId,
  initialBookings,
  vehicles,
}: BookingManagementProps) {
  const supabase = createClient();

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [assigningVehicle, setAssigningVehicle] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  // Filter bookings by status
  const filteredBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    switch (activeTab) {
      case 'pending':
        return bookings.filter((b) => b.status === 'pending');
      case 'upcoming':
        return bookings.filter(
          (b) => b.status === 'confirmed' && b.booking_date >= today
        );
      case 'completed':
        return bookings.filter(
          (b) => b.status === 'completed' || b.booking_date < today
        );
      case 'cancelled':
        return bookings.filter((b) =>
          ['cancelled', 'rejected'].includes(b.status)
        );
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      pending: bookings.filter((b) => b.status === 'pending').length,
      upcoming: bookings.filter((b) => b.status === 'confirmed' && b.booking_date >= today)
        .length,
      completed: bookings.filter(
        (b) => b.status === 'completed' || b.booking_date < today
      ).length,
      totalRevenue: bookings
        .filter((b) => ['confirmed', 'completed'].includes(b.status))
        .reduce((sum, b) => sum + b.total_price, 0),
    };
  }, [bookings]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setIsUpdating(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Update local state
      setBookings(
        bookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus as any } : b))
      );

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus as any });
      }

      alert(`Booking ${newStatus} successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignVehicle = async (bookingId: string) => {
    if (!selectedVehicleId) {
      alert('Please select a vehicle');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          vehicle_id: selectedVehicleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Update local state
      const assignedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
      setBookings(
        bookings.map((b) =>
          b.id === bookingId
            ? { ...b, vehicle_id: selectedVehicleId, vehicle: assignedVehicle }
            : b
        )
      );

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({
          ...selectedBooking,
          vehicle_id: selectedVehicleId,
          vehicle: assignedVehicle,
        });
      }

      setAssigningVehicle(false);
      setSelectedVehicleId('');
      alert('Vehicle assigned successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign vehicle');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    return time.substring(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600">Pending</div>
          <div className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Upcoming</div>
          <div className="text-3xl font-bold text-green-900 mt-1">{stats.upcoming}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600">Completed</div>
          <div className="text-3xl font-bold text-blue-900 mt-1">{stats.completed}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600">Total Revenue</div>
          <div className="text-3xl font-bold text-purple-900 mt-1">
            €{stats.totalRevenue.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'upcoming', label: 'Upcoming', count: stats.upcoming },
              { key: 'completed', label: 'Completed', count: stats.completed },
              {
                key: 'cancelled',
                label: 'Cancelled',
                count: bookings.filter((b) =>
                  ['cancelled', 'rejected'].includes(b.status)
                ).length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No {activeTab} bookings
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {booking.booking_number}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Trip:</span>{' '}
                          <span className="font-medium">
                            {booking.trip?.title || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>{' '}
                          <span className="font-medium">
                            {formatDate(booking.booking_date)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>{' '}
                          <span className="font-medium">
                            {formatTime(booking.start_time)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Guests:</span>{' '}
                          <span className="font-medium">{booking.num_guests}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Customer:</span>{' '}
                          <span className="font-medium">{booking.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>{' '}
                          <a
                            href={`tel:${booking.customer_phone}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {booking.customer_phone}
                          </a>
                        </div>
                        <div>
                          <span className="text-gray-600">Vehicle:</span>{' '}
                          <span className="font-medium">
                            {booking.vehicle?.model || 'Not assigned'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-lg font-bold text-blue-600">
                        €{booking.total_price}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailsModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                      >
                        View Details
                      </button>

                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:bg-gray-400"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'rejected')}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:bg-gray-400"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <>
                          {!booking.vehicle_id && (
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setAssigningVehicle(true);
                              }}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                            >
                              Assign Vehicle
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(booking.id, 'completed')}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            disabled={isUpdating}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium disabled:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedBooking.booking_number}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedBooking.customer_name}</div>
                  <div><strong>Email:</strong> <a href={`mailto:${selectedBooking.customer_email}`} className="text-blue-600">{selectedBooking.customer_email}</a></div>
                  <div><strong>Phone:</strong> <a href={`tel:${selectedBooking.customer_phone}`} className="text-blue-600">{selectedBooking.customer_phone}</a></div>
                </div>
              </div>

              {/* Trip Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Trip Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Trip:</strong> {selectedBooking.trip?.title || 'N/A'}</div>
                  <div><strong>Date:</strong> {formatDate(selectedBooking.booking_date)}</div>
                  <div><strong>Time:</strong> {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}</div>
                  <div><strong>Duration:</strong> {selectedBooking.duration_minutes} minutes</div>
                  <div><strong>Guests:</strong> {selectedBooking.num_guests}</div>
                  <div><strong>Vehicle:</strong> {selectedBooking.vehicle?.model || 'Not assigned'}</div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Special Requests</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                    {selectedBooking.special_requests}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Pricing</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-900">€{selectedBooking.total_price}</div>
                  <div className="text-sm text-blue-700 mt-1">{selectedBooking.currency}</div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Status</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-4 py-2 rounded-lg font-medium ${
                    selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {assigningVehicle && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Assign Vehicle</h2>
              <p className="text-sm text-gray-600 mt-1">
                Booking: {selectedBooking.booking_number}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles
                    .filter((v) => v.capacity >= selectedBooking.num_guests)
                    .map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} ({vehicle.type}, {vehicle.capacity} pax)
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => handleAssignVehicle(selectedBooking.id)}
                disabled={!selectedVehicleId || isUpdating}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isUpdating ? 'Assigning...' : 'Assign Vehicle'}
              </button>
              <button
                onClick={() => {
                  setAssigningVehicle(false);
                  setSelectedVehicleId('');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
