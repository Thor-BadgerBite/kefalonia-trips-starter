'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Vehicle, Booking, Availability } from '@/lib/types';

interface AvailabilityCalendarProps {
  providerId: string;
  vehicles: Vehicle[];
  initialBookings: Booking[];
  initialAvailability: Availability[];
}

interface BlockFormData {
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export default function AvailabilityCalendar({
  providerId,
  vehicles,
  initialBookings,
  initialAvailability,
}: AvailabilityCalendarProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [availability, setAvailability] = useState<Availability[]>(initialAvailability);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const [blockForm, setBlockForm] = useState<BlockFormData>({
    vehicleId: vehicles[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    reason: 'maintenance',
  });

  // Generate calendar days (current month + next month)
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, []);

  // Get bookings and blocks for a specific date
  const getDateSchedule = (date: string) => {
    const dateBookings = bookings.filter((b) => b.booking_date === date);
    const dateBlocks = availability.filter((a) => a.date === date && !a.is_available);
    return { bookings: dateBookings, blocks: dateBlocks };
  };

  // Get schedule for selected date
  const selectedDateSchedule = useMemo(() => {
    const schedule = getDateSchedule(selectedDate);

    if (selectedVehicle === 'all') {
      return schedule;
    }

    return {
      bookings: schedule.bookings.filter((b) => b.vehicle_id === selectedVehicle),
      blocks: schedule.blocks.filter(
        (a) => a.vehicle_id === selectedVehicle || a.vehicle_id === null
      ),
    };
  }, [selectedDate, selectedVehicle, bookings, availability]);

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('availability').insert({
        provider_id: providerId,
        vehicle_id: blockForm.vehicleId,
        date: blockForm.date,
        start_time: blockForm.startTime,
        end_time: blockForm.endTime,
        is_available: false,
        reason: blockForm.reason,
      });

      if (insertError) throw insertError;

      // Refresh availability
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const future = futureDate.toISOString().split('T')[0];

      const { data } = await supabase
        .from('availability')
        .select(
          `
          *,
          vehicle:vehicle_id(id, model, type)
        `
        )
        .eq('provider_id', providerId)
        .gte('date', today)
        .lte('date', future)
        .order('date');

      setAvailability(data || []);
      setShowBlockForm(false);
      setBlockForm({
        vehicleId: vehicles[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        reason: 'maintenance',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block time slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      const { error } = await supabase.from('availability').delete().eq('id', blockId);

      if (error) throw error;

      setAvailability(availability.filter((a) => a.id !== blockId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock time slot');
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const getDateColor = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const schedule = getDateSchedule(dateStr);
    const today = new Date().toISOString().split('T')[0];

    if (dateStr < today) return 'bg-gray-100 text-gray-400';
    if (schedule.bookings.length > 0) return 'bg-green-100 text-green-800 font-semibold';
    if (schedule.blocks.length > 0) return 'bg-red-100 text-red-800';
    return 'bg-white text-gray-900 hover:bg-blue-50';
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Calendar</h2>
            <div className="flex gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Bookings</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>Blocked</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}

            {calendarDays.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayOfWeek = date.getDay();
              const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

              // Add empty cells for first week padding
              if (date.getDate() === 1 && adjustedDay > 0) {
                return [
                  ...Array(adjustedDay)
                    .fill(null)
                    .map((_, i) => <div key={`empty-${i}`} />),
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square p-2 rounded-lg border transition-colors text-center ${
                      selectedDate === dateStr ? 'ring-2 ring-blue-500' : ''
                    } ${getDateColor(date)}`}
                  >
                    <div className="text-sm">{date.getDate()}</div>
                    <div className="text-xs mt-1">
                      {getDateSchedule(dateStr).bookings.length > 0 && (
                        <div className="text-green-700">
                          {getDateSchedule(dateStr).bookings.length} 📅
                        </div>
                      )}
                    </div>
                  </button>,
                ];
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square p-2 rounded-lg border transition-colors text-center ${
                    selectedDate === dateStr ? 'ring-2 ring-blue-500' : ''
                  } ${getDateColor(date)}`}
                >
                  <div className="text-sm">{date.getDate()}</div>
                  <div className="text-xs mt-1">
                    {getDateSchedule(dateStr).bookings.length > 0 && (
                      <div className="text-green-700">
                        {getDateSchedule(dateStr).bookings.length} 📅
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Schedule */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>

              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setBlockForm({ ...blockForm, date: selectedDate });
                setShowBlockForm(true);
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              + Block Time Slot
            </button>

            {/* Bookings */}
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">
                Bookings ({selectedDateSchedule.bookings.length})
              </h3>
              <div className="space-y-2">
                {selectedDateSchedule.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm"
                  >
                    <div className="font-medium text-green-900">
                      {booking.trip?.title || 'Transfer'}
                    </div>
                    <div className="text-green-700 mt-1">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </div>
                    <div className="text-green-600 text-xs mt-1">
                      {booking.vehicle?.model || 'No vehicle assigned'}
                    </div>
                    <div className="text-green-600 text-xs">
                      {booking.num_guests} guests • €{booking.total_price}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          booking.status === 'confirmed'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
                {selectedDateSchedule.bookings.length === 0 && (
                  <p className="text-gray-500 text-sm">No bookings for this date</p>
                )}
              </div>
            </div>

            {/* Blocked Slots */}
            <div>
              <h3 className="font-semibold text-sm text-gray-600 mb-2">
                Blocked Slots ({selectedDateSchedule.blocks.length})
              </h3>
              <div className="space-y-2">
                {selectedDateSchedule.blocks
                  .filter((block) => block.reason !== 'booking')
                  .map((block) => (
                    <div
                      key={block.id}
                      className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-red-900 capitalize">
                            {block.reason || 'Blocked'}
                          </div>
                          <div className="text-red-700 mt-1">
                            {formatTime(block.start_time)} - {formatTime(block.end_time)}
                          </div>
                          <div className="text-red-600 text-xs mt-1">
                            {block.vehicle
                              ? `${block.vehicle.model}`
                              : 'All vehicles'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblock(block.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Unblock
                        </button>
                      </div>
                    </div>
                  ))}
                {selectedDateSchedule.blocks.filter((b) => b.reason !== 'booking')
                  .length === 0 && (
                  <p className="text-gray-500 text-sm">No blocked slots</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block Time Form Modal */}
      {showBlockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Block Time Slot</h2>

            <form onSubmit={handleBlockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle
                </label>
                <select
                  value={blockForm.vehicleId}
                  onChange={(e) => setBlockForm({ ...blockForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={blockForm.date}
                  onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={blockForm.startTime}
                    onChange={(e) =>
                      setBlockForm({ ...blockForm, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="personal">Personal Use</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Blocking...' : 'Block Time Slot'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Active Vehicles</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{vehicles.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Total Bookings</div>
          <div className="text-2xl font-bold text-green-900 mt-1">{bookings.length}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-600">Pending Bookings</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">
            {bookings.filter((b) => b.status === 'pending').length}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">Blocked Slots</div>
          <div className="text-2xl font-bold text-red-900 mt-1">
            {availability.filter((a) => !a.is_available && a.reason !== 'booking').length}
          </div>
        </div>
      </div>
    </div>
  );
}
