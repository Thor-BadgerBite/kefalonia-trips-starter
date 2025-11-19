'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CustomTripRequest, Vehicle } from '@/lib/types';

interface CustomRequestsManagerProps {
  providerId: string;
  providerHourlyRate: number;
  availableRequests: CustomTripRequest[];
  myQuotes: any[];
  vehicles: Vehicle[];
}

export default function CustomRequestsManager({
  providerId,
  providerHourlyRate,
  availableRequests,
  myQuotes,
  vehicles,
}: CustomRequestsManagerProps) {
  const supabase = createClient();

  const [selectedRequest, setSelectedRequest] = useState<CustomTripRequest | null>(null);
  const [requestPOIs, setRequestPOIs] = useState<any[]>([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [providerNotes, setProviderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleViewRequest = async (request: CustomTripRequest) => {
    setSelectedRequest(request);

    // Fetch POIs for this request
    const { data } = await supabase
      .from('custom_trip_request_pois')
      .select(`
        *,
        poi:poi_id(*)
      `)
      .eq('request_id', request.id)
      .order('order_index');

    setRequestPOIs(data || []);

    // Check if I already quoted this
    const existingQuote = myQuotes.find((q) => q.request_id === request.id);
    if (existingQuote) {
      setQuotePrice(existingQuote.quoted_price.toString());
      setSelectedVehicle(existingQuote.vehicle_id || '');
      setProviderNotes(existingQuote.provider_notes || '');
    } else {
      // Set default to estimated cost
      setQuotePrice(request.total_estimated_cost?.toFixed(2) || '');
      setSelectedVehicle('');
      setProviderNotes('');
    }
  };

  const handleSubmitQuote = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    setError('');

    try {
      const price = parseFloat(quotePrice);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      const { error: quoteError } = await supabase
        .from('custom_trip_quotes')
        .upsert({
          request_id: selectedRequest.id,
          provider_id: providerId,
          quoted_price: price,
          estimated_price: selectedRequest.total_estimated_cost,
          vehicle_id: selectedVehicle || null,
          provider_notes: providerNotes || null,
          status: 'sent',
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

      if (quoteError) throw quoteError;

      // Refresh quotes
      const { data: newQuotes } = await supabase
        .from('custom_trip_quotes')
        .select(`
          *,
          request:request_id(*)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false});

      alert('Quote submitted successfully! The client will receive it via email.');
      setShowQuoteForm(false);
      setSelectedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Requests I haven't quoted yet
  const unquotedRequests = availableRequests.filter(
    (req) => !myQuotes.some((q) => q.request_id === req.id)
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">New Requests</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {unquotedRequests.length}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600">My Quotes</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{myQuotes.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600">Hourly Rate</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            €{providerHourlyRate}/hr
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button className="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              New Requests ({unquotedRequests.length})
            </button>
            <button className="px-6 py-3 text-gray-600 hover:text-gray-900">
              My Quotes ({myQuotes.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {unquotedRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No new custom trip requests at the moment
            </div>
          ) : (
            <div className="space-y-4">
              {unquotedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {request.request_number}
                        </h3>
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Date:</span>{' '}
                          <span className="font-medium">
                            {new Date(request.trip_date + 'T00:00:00').toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>{' '}
                          <span className="font-medium">{request.start_time}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Guests:</span>{' '}
                          <span className="font-medium">{request.num_guests}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>{' '}
                          <span className="font-medium">
                            {Math.floor((request.total_duration_minutes || 0) / 60)}h{' '}
                            {(request.total_duration_minutes || 0) % 60}m
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <span className="text-gray-600">Estimated Cost:</span>{' '}
                        <span className="text-lg font-bold text-blue-600">
                          €{request.total_estimated_cost?.toFixed(2) || 'N/A'}
                        </span>
                      </div>

                      {request.special_requests && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          "{request.special_requests}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        handleViewRequest(request);
                        setShowQuoteForm(true);
                      }}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      View & Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {selectedRequest.request_number}
              </h2>
              <p className="text-gray-600">
                {selectedRequest.customer_name} • {selectedRequest.num_guests} guests •{' '}
                {new Date(selectedRequest.trip_date + 'T00:00:00').toLocaleDateString()}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Itinerary */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Requested Itinerary</h3>
                <div className="space-y-2">
                  {requestPOIs.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                    >
                      <div className="font-bold text-gray-700 bg-white rounded-full w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{stop.poi.name}</div>
                        <div className="text-sm text-gray-600">
                          {stop.duration_at_poi} minutes
                        </div>
                        {stop.notes && (
                          <div className="text-sm text-gray-500 italic mt-1">
                            Note: {stop.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">System Estimate Breakdown</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span>{selectedRequest.total_distance_km?.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Transfer Cost:</span>
                    <span>
                      €
                      {((selectedRequest.total_distance_km || 0) * 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Waiting Time (€{providerHourlyRate}/hr):
                    </span>
                    <span>
                      €
                      {(
                        ((selectedRequest.total_duration_minutes || 0) / 60) *
                        providerHourlyRate
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total Estimate:</span>
                    <span className="text-blue-600">
                      €{selectedRequest.total_estimated_cost?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quote Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Your Quote</h3>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Price (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter your price"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    System estimate: €{selectedRequest.total_estimated_cost?.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assign Vehicle (optional)
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Not assigned yet</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} ({vehicle.type}, {vehicle.capacity} pax)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes for Client (optional)
                  </label>
                  <textarea
                    value={providerNotes}
                    onChange={(e) => setProviderNotes(e.target.value)}
                    rows={3}
                    placeholder="Any additional information or special offers..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={handleSubmitQuote}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quote'}
              </button>
              <button
                onClick={() => {
                  setShowQuoteForm(false);
                  setSelectedRequest(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
