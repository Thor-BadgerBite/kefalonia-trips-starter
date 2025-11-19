'use client';

import { useState } from 'react';
import type { POI, POIStopType, TripPOI } from '@/lib/types';

interface TripItineraryBuilderProps {
  selectedPOIs: POI[];
  stopTypes: POIStopType[];
  itinerary: Partial<TripPOI>[];
  onItineraryChange: (itinerary: Partial<TripPOI>[]) => void;
  onRemovePOI: (poiId: string) => void;
}

export function TripItineraryBuilder({
  selectedPOIs,
  stopTypes,
  itinerary,
  onItineraryChange,
  onRemovePOI
}: TripItineraryBuilderProps) {
  const [editingStopId, setEditingStopId] = useState<string | null>(null);

  const updateStop = (poiId: string, updates: Partial<TripPOI>) => {
    const newItinerary = itinerary.map(stop =>
      stop.poi_id === poiId ? { ...stop, ...updates } : stop
    );
    onItineraryChange(newItinerary);
  };

  const moveStop = (poiId: string, direction: 'up' | 'down') => {
    const currentIndex = itinerary.findIndex(stop => stop.poi_id === poiId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= itinerary.length) return;

    const newItinerary = [...itinerary];
    [newItinerary[currentIndex], newItinerary[newIndex]] = [newItinerary[newIndex], newItinerary[currentIndex]];

    // Update order_index
    newItinerary.forEach((stop, idx) => {
      stop.order_index = idx;
    });

    onItineraryChange(newItinerary);
  };

  const calculateTotalTime = () => {
    return itinerary.reduce((total, stop) => {
      return total + (stop.duration_at_poi || 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trip Itinerary ({itinerary.length} stops)</h3>
        <div className="text-sm text-gray-600">
          Total stop time: <span className="font-semibold">{calculateTotalTime()} min</span>
        </div>
      </div>

      {itinerary.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-gray-600">Click POIs on the map to start building your itinerary</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itinerary.map((stop, index) => {
            const poi = selectedPOIs.find(p => p.id === stop.poi_id);
            if (!poi) return null;

            const selectedStopType = stopTypes.find(st => st.id === stop.stop_type_id);
            const isEditing = editingStopId === poi.id;

            return (
              <div key={poi.id} className="bg-white rounded-lg shadow border p-4">
                <div className="flex items-start gap-4">
                  {/* Order Number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>

                  {/* POI Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{poi.name}</h4>
                        <p className="text-sm text-gray-600">{poi.shortDesc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Move buttons */}
                        <button
                          onClick={() => moveStop(poi.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveStop(poi.id, 'down')}
                          disabled={index === itinerary.length - 1}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onRemovePOI(poi.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Stop Configuration */}
                    {!isEditing ? (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{selectedStopType?.icon || '📍'}</span>
                          <span className="font-medium">
                            {stop.custom_stop_name || selectedStopType?.name || 'Not configured'}
                          </span>
                        </div>
                        <span className="text-gray-600">•</span>
                        <span className="font-medium text-blue-600">
                          {stop.duration_at_poi ? `${stop.duration_at_poi} min` : 'No duration set'}
                        </span>
                        <button
                          onClick={() => setEditingStopId(poi.id)}
                          className="ml-auto text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit stop details
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 border-t pt-3">
                        {/* Stop Type */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Stop Type</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {stopTypes.map(type => (
                              <button
                                key={type.id}
                                onClick={() => updateStop(poi.id, { stop_type_id: type.id })}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                                  stop.stop_type_id === type.id
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                <span className="text-xl">{type.icon}</span>
                                <span className="text-sm font-medium">{type.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Name */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Custom Stop Name (optional)
                          </label>
                          <input
                            type="text"
                            value={stop.custom_stop_name || ''}
                            onChange={(e) => updateStop(poi.id, { custom_stop_name: e.target.value })}
                            placeholder={`e.g., "Myrtos Photo Shoot"`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-medium mb-2">Duration at Stop</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={stop.duration_at_poi || ''}
                              onChange={(e) => updateStop(poi.id, { duration_at_poi: parseInt(e.target.value) || 0 })}
                              min="0"
                              step="5"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600">minutes</span>
                            <div className="flex gap-1 ml-auto">
                              <button
                                onClick={() => updateStop(poi.id, { duration_at_poi: 15 })}
                                className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                              >
                                15 min
                              </button>
                              <button
                                onClick={() => updateStop(poi.id, { duration_at_poi: 30 })}
                                className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                              >
                                30 min
                              </button>
                              <button
                                onClick={() => updateStop(poi.id, { duration_at_poi: 60 })}
                                className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                              >
                                1 hr
                              </button>
                              <button
                                onClick={() => updateStop(poi.id, { duration_at_poi: 90 })}
                                className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                              >
                                1.5 hrs
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Stop Description
                          </label>
                          <textarea
                            value={stop.stop_description || ''}
                            onChange={(e) => updateStop(poi.id, { stop_description: e.target.value })}
                            placeholder="What will customers do here? Any special tips?"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                        </div>

                        {/* Provider Tips */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Provider Tips (optional)
                          </label>
                          <input
                            type="text"
                            value={stop.provider_tips || ''}
                            onChange={(e) => updateStop(poi.id, { provider_tips: e.target.value })}
                            placeholder="e.g., Best time for photos is before 11am"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => setEditingStopId(null)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
