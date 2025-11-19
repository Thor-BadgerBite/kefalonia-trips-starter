'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WorkingHours } from '@/lib/types';

interface WorkingHoursManagerProps {
  providerId: string;
  initialWorkingHours: WorkingHours[];
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const QUICK_PRESETS = [
  { label: 'Full Day (9-17)', start: '09:00', end: '17:00' },
  { label: 'Morning (9-13)', start: '09:00', end: '13:00' },
  { label: 'Afternoon (13-17)', start: '13:00', end: '17:00' },
  { label: 'Evening (15-20)', start: '15:00', end: '20:00' },
  { label: 'Extended (8-20)', start: '08:00', end: '20:00' },
];

export default function WorkingHoursManager({
  providerId,
  initialWorkingHours,
}: WorkingHoursManagerProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(initialWorkingHours);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '17:00',
    label: '',
  });

  // Group working hours by day
  const hoursByDay = DAYS.map((day) => ({
    ...day,
    hours: workingHours.filter((wh) => wh.day_of_week === day.value && wh.active),
  }));

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDay === null) {
      setError('Please select a day');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('provider_working_hours')
        .insert({
          provider_id: providerId,
          day_of_week: selectedDay,
          start_time: formData.startTime,
          end_time: formData.endTime,
          label: formData.label || null,
          active: true,
        });

      if (insertError) throw insertError;

      // Refresh working hours
      const { data } = await supabase
        .from('provider_working_hours')
        .select('*')
        .eq('provider_id', providerId)
        .order('day_of_week')
        .order('start_time');

      setWorkingHours(data || []);
      setShowAddForm(false);
      setFormData({ startTime: '09:00', endTime: '17:00', label: '' });
      setSelectedDay(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add working hours');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('provider_working_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWorkingHours(workingHours.filter((wh) => wh.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete working hours');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('provider_working_hours')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      setWorkingHours(
        workingHours.map((wh) =>
          wh.id === id ? { ...wh, active: !currentActive } : wh
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update working hours');
    }
  };

  const applyPreset = (preset: { start: string; end: string }) => {
    setFormData({
      ...formData,
      startTime: preset.start,
      endTime: preset.end,
    });
  };

  const applyToAllDays = async () => {
    if (
      !confirm(
        `Apply ${formData.startTime}-${formData.endTime} to all days of the week?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const slots = DAYS.map((day) => ({
        provider_id: providerId,
        day_of_week: day.value,
        start_time: formData.startTime,
        end_time: formData.endTime,
        label: formData.label || `${day.label} ${formData.label}`.trim(),
        active: true,
      }));

      const { error: insertError } = await supabase
        .from('provider_working_hours')
        .insert(slots);

      if (insertError) throw insertError;

      // Refresh working hours
      const { data } = await supabase
        .from('provider_working_hours')
        .select('*')
        .eq('provider_id', providerId)
        .order('day_of_week')
        .order('start_time');

      setWorkingHours(data || []);
      setShowAddForm(false);
      setFormData({ startTime: '09:00', endTime: '17:00', label: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply to all days');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How Working Hours Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Set multiple time slots per day (e.g., morning and afternoon shifts)</li>
          <li>• Only trips/transfers during your working hours will show in searches</li>
          <li>• You can temporarily disable a time slot without deleting it</li>
          <li>• Use quick presets or set custom times</li>
        </ul>
      </div>

      {/* Add Form */}
      {showAddForm ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Working Hours</h2>

          <form onSubmit={handleAddSlot} className="space-y-4">
            {/* Day Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Day
              </label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setSelectedDay(day.value)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                      selectedDay === day.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {day.label.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
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
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Label (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label (Optional)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Morning Shift, Afternoon Tours"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || selectedDay === null}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Adding...' : 'Add Time Slot'}
              </button>
              <button
                type="button"
                onClick={applyToAllDays}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Apply to All Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedDay(null);
                  setFormData({ startTime: '09:00', endTime: '17:00', label: '' });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Working Hours
        </button>
      )}

      {/* Working Hours by Day */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {hoursByDay.map((day) => (
            <div key={day.value} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{day.label}</h3>

                  {day.hours.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No working hours set</p>
                  ) : (
                    <div className="space-y-2">
                      {day.hours.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </span>
                              {slot.label && (
                                <span className="text-sm text-gray-600 italic">
                                  ({slot.label})
                                </span>
                              )}
                              {!slot.active && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                  Disabled
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(slot.id, slot.active)}
                              className={`text-xs px-3 py-1 rounded ${
                                slot.active
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {slot.active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Days with Working Hours</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {hoursByDay.filter((d) => d.hours.length > 0).length} / 7
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600">Total Time Slots</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            {workingHours.filter((wh) => wh.active).length}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Active Slots</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {workingHours.filter((wh) => wh.active).length}
          </div>
        </div>
      </div>
    </div>
  );
}
