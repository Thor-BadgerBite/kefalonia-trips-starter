'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ProviderSettingsProps {
  provider: any;
}

export default function ProviderSettings({ provider }: ProviderSettingsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [hourlyWaitingRate, setHourlyWaitingRate] = useState(
    provider.hourly_waiting_rate?.toString() || '0'
  );
  const [acceptsCustomTrips, setAcceptsCustomTrips] = useState(
    provider.accepts_custom_trips ?? true
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const rate = parseFloat(hourlyWaitingRate);
      if (isNaN(rate) || rate < 0) {
        throw new Error('Please enter a valid hourly rate (0 or higher)');
      }

      const { error: updateError } = await supabase
        .from('providers')
        .update({
          hourly_waiting_rate: rate,
          accepts_custom_trips: acceptsCustomTrips,
        })
        .eq('id', provider.id);

      if (updateError) throw updateError;

      setSuccess('Settings saved successfully!');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Custom Trip Settings</h2>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hourly Waiting Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hourly Waiting Rate (€/hour)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={hourlyWaitingRate}
            onChange={(e) => setHourlyWaitingRate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-600 mt-2">
            This rate is used to calculate waiting time costs when clients build custom trips.
            For example, if a client wants to spend 2 hours at various POIs, you'll charge €
            {(parseFloat(hourlyWaitingRate) * 2 || 0).toFixed(2)} for waiting time.
          </p>
        </div>

        {/* Accept Custom Trips Toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptsCustomTrips}
              onChange={(e) => setAcceptsCustomTrips(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <div>
              <div className="font-medium">Accept Custom Trip Requests</div>
              <div className="text-sm text-gray-600">
                When enabled, you'll receive custom trip requests from clients and can submit
                quotes. Disable this if you only want to offer pre-designed trips.
              </div>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How Custom Trips Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Clients select their own POIs and stoppage times</li>
            <li>• System estimates cost based on distance + your hourly waiting rate</li>
            <li>• You receive requests in "Custom Requests" dashboard</li>
            <li>• You can adjust the estimate and submit your quote</li>
            <li>• Client receives quotes from all providers via email</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
