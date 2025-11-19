'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { POI } from '@/lib/types';

interface CustomTripBuilderProps {
  availablePOIs: POI[];
  availableProviders: any[];
}

interface SelectedStop {
  poi: POI;
  duration_at_poi: number;
  notes: string;
}

export default function CustomTripBuilder({
  availablePOIs,
  availableProviders,
}: CustomTripBuilderProps) {
  const supabase = createClient();

  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);
  const [tripDate, setTripDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [numGuests, setNumGuests] = useState(2);
  const [vehicleType, setVehicleType] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate haversine distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate trip statistics
  const tripStats = useMemo(() => {
    if (selectedStops.length === 0) {
      return { duration: 0, distance: 0, drivingTime: 0, stopTime: 0 };
    }

    let totalDistance = 0;
    let totalStopTime = 0;

    selectedStops.forEach((stop, index) => {
      totalStopTime += stop.duration_at_poi;

      if (index > 0) {
        const prevStop = selectedStops[index - 1];
        const distance = calculateDistance(
          prevStop.poi.lat,
          prevStop.poi.lon,
          stop.poi.lat,
          stop.poi.lon
        );
        totalDistance += distance * 1.3; // Road factor
      }
    });

    const drivingTime = Math.ceil((totalDistance / 40) * 60); // 40 km/h avg, in minutes
    const totalDuration = totalStopTime + drivingTime;

    return {
      duration: totalDuration,
      distance: totalDistance,
      drivingTime,
      stopTime: totalStopTime,
    };
  }, [selectedStops]);

  // Calculate cost estimates per provider
  const costEstimates = useMemo(() => {
    if (selectedStops.length === 0) return [];

    return availableProviders.map((provider) => {
      const transferCost = tripStats.distance * 2.0; // €2 per km estimate
      const waitingCost = (tripStats.stopTime / 60) * (provider.hourly_waiting_rate || 0);
      const totalCost = transferCost + waitingCost;

      return {
        providerId: provider.id,
        providerName: provider.name,
        providerSlug: provider.slug,
        rating: provider.rating_avg,
        ratingCount: provider.rating_count,
        hourlyRate: provider.hourly_waiting_rate || 0,
        transferCost,
        waitingCost,
        totalCost,
      };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [selectedStops, tripStats, availableProviders]);

  const togglePOI = (poi: POI) => {
    const isSelected = selectedStops.some((s) => s.poi.id === poi.id);

    if (isSelected) {
      setSelectedStops(selectedStops.filter((s) => s.poi.id !== poi.id));
    } else {
      setSelectedStops([
        ...selectedStops,
        { poi, duration_at_poi: 30, notes: '' },
      ]);
    }
  };

  const updateStopDuration = (poiId: string, duration: number) => {
    setSelectedStops(
      selectedStops.map((s) =>
        s.poi.id === poiId ? { ...s, duration_at_poi: duration } : s
      )
    );
  };

  const updateStopNotes = (poiId: string, notes: string) => {
    setSelectedStops(
      selectedStops.map((s) => (s.poi.id === poiId ? { ...s, notes } : s))
    );
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...selectedStops];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]];
    setSelectedStops(newStops);
  };

  const removeStop = (poiId: string) => {
    setSelectedStops(selectedStops.filter((s) => s.poi.id !== poiId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (selectedStops.length < 2) {
        throw new Error('Please select at least 2 stops for your trip');
      }

      if (!customerName || !customerEmail || !customerPhone) {
        throw new Error('Please fill in all contact information');
      }

      if (!tripDate || !startTime) {
        throw new Error('Please select trip date and start time');
      }

      // Create custom trip request
      const { data: request, error: requestError } = await supabase
        .from('custom_trip_requests')
        .insert({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          trip_date: tripDate,
          start_time: startTime,
          num_guests: numGuests,
          vehicle_type: vehicleType || null,
          special_requests: specialRequests || null,
          total_estimated_cost: costEstimates[0]?.totalCost || null,
          total_duration_minutes: tripStats.duration,
          total_distance_km: tripStats.distance,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Insert POIs
      const poisToInsert = selectedStops.map((stop, index) => ({
        request_id: request.id,
        poi_id: stop.poi.id,
        order_index: index,
        duration_at_poi: stop.duration_at_poi,
        notes: stop.notes || null,
      }));

      const { error: poisError } = await supabase
        .from('custom_trip_request_pois')
        .insert(poisToInsert);

      if (poisError) throw poisError;

      setSuccess(
        `Trip request submitted! Your request number is ${request.request_number}. Providers will send you quotes via email.`
      );

      // Reset form
      setSelectedStops([]);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSpecialRequests('');
      setVehicleType('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit trip request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* POI Selection */}
      <div className="lg:col-span-2 space-y-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Click on locations below to add them to your trip</li>
            <li>Arrange stops in your preferred order</li>
            <li>Set how long you want to spend at each location</li>
            <li>See instant price estimates from providers</li>
            <li>Submit your request and receive quotes via email</li>
          </ol>
        </div>

        {/* Available POIs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Select Your Stops</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availablePOIs.map((poi) => {
              const isSelected = selectedStops.some((s) => s.poi.id === poi.id);
              return (
                <button
                  key={poi.id}
                  onClick={() => togglePOI(poi)}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{poi.name}</div>
                  <div className="text-xs mt-1 text-gray-500">{poi.shortDesc}</div>
                  {isSelected && (
                    <div className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded inline-block">
                      ✓ Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Stops */}
        {selectedStops.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Your Itinerary ({selectedStops.length} stops)
            </h2>
            <div className="space-y-3">
              {selectedStops.map((stop, index) => (
                <div
                  key={stop.poi.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveStop(index, 'up')}
                        disabled={index === 0}
                        className="px-2 py-1 bg-gray-200 rounded text-xs disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <div className="text-center font-bold text-gray-700">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => moveStop(index, 'down')}
                        disabled={index === selectedStops.length - 1}
                        className="px-2 py-1 bg-gray-200 rounded text-xs disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {stop.poi.name}
                          </h3>
                          <p className="text-sm text-gray-600">{stop.poi.shortDesc}</p>
                        </div>
                        <button
                          onClick={() => removeStop(stop.poi.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time at this stop: {stop.duration_at_poi} minutes
                          </label>
                          <input
                            type="range"
                            min="15"
                            max="180"
                            step="15"
                            value={stop.duration_at_poi}
                            onChange={(e) =>
                              updateStopDuration(
                                stop.poi.id,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>15 min</span>
                            <span>1 hr</span>
                            <span>2 hrs</span>
                            <span>3 hrs</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (optional)
                          </label>
                          <input
                            type="text"
                            value={stop.notes}
                            onChange={(e) => updateStopNotes(stop.poi.id, e.target.value)}
                            placeholder="e.g., Want to swim here, looking for photo spot"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary & Booking */}
      <div className="space-y-6">
        {/* Trip Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
          <h2 className="text-xl font-semibold mb-4">Trip Summary</h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Stops:</span>
              <span className="font-medium">{selectedStops.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Duration:</span>
              <span className="font-medium">
                {Math.floor(tripStats.duration / 60)}h {tripStats.duration % 60}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Driving Time:</span>
              <span className="font-medium">{tripStats.drivingTime} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stop Time:</span>
              <span className="font-medium">{tripStats.stopTime} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium">{tripStats.distance.toFixed(1)} km</span>
            </div>
          </div>

          {costEstimates.length > 0 && (
            <>
              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold mb-3">Estimated Costs</h3>
                <div className="space-y-2">
                  {costEstimates.slice(0, 3).map((est) => (
                    <div
                      key={est.providerId}
                      className="bg-gray-50 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{est.providerName}</span>
                        <span className="text-blue-600 font-bold">
                          €{est.totalCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>Transfer: €{est.transferCost.toFixed(2)}</div>
                        <div>
                          Waiting (€{est.hourlyRate}/hr): €
                          {est.waitingCost.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {est.rating.toFixed(1)} ({est.ratingCount})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These are estimates. Final quotes will be sent by providers.
                </p>
              </div>
            </>
          )}

          {selectedStops.length >= 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Your Details</h3>

              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trip Date *</label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Guests *</label>
                <input
                  type="number"
                  value={numGuests}
                  onChange={(e) => setNumGuests(parseInt(e.target.value))}
                  min="1"
                  max="50"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Preferred Vehicle
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">No preference</option>
                  <option value="sedan">Sedan</option>
                  <option value="minivan">Minivan</option>
                  <option value="minibus">Minibus</option>
                  <option value="luxury">Luxury Car</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Special Requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  placeholder="Any special requirements or requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || selectedStops.length < 2}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Submitting...' : 'Request Quotes'}
              </button>
            </form>
          )}

          {selectedStops.length < 2 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              Select at least 2 stops to build your trip
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
