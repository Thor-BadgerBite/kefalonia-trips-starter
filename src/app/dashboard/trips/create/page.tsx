'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { POIMapSelector } from '@/components/trip-creation/POIMapSelector';
import { TripItineraryBuilder } from '@/components/trip-creation/TripItineraryBuilder';
import type { POI, POIStopType, TripPOI } from '@/lib/types';

export default function CreateTripPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pois, setPOIs] = useState<POI[]>([]);
  const [stopTypes, setStopTypes] = useState<POIStopType[]>([]);
  const [selectedPOIs, setSelectedPOIs] = useState<POI[]>([]);
  const [itinerary, setItinerary] = useState<Partial<TripPOI>[]>([]);

  // Trip basic info
  const [tripName, setTripName] = useState('');
  const [tripDescription, setTripDescription] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'per_person' | 'hourly'>('per_person');
  const [priceAmount, setPriceAmount] = useState('');
  const [vehicleType, setVehicleType] = useState<'sedan' | 'minivan' | 'minibus'>('minivan');
  const [seatsMax, setSeatsMax] = useState('');
  const [languages, setLanguages] = useState<string[]>(['en', 'el']);
  const [includes, setIncludes] = useState('');
  const [exclusions, setExclusions] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Load POIs
    const { data: poisData } = await supabase
      .from('pois')
      .select('*')
      .eq('active', true)
      .order('featured', { ascending: false });

    if (poisData) {
      setPOIs(poisData.map(poi => ({
        id: poi.id,
        slug: poi.slug,
        name: poi.name,
        lat: poi.lat,
        lon: poi.lon,
        categories: poi.categories || [],
        images: poi.images || [],
        shortDesc: poi.short_desc || ''
      })));
    }

    // Load stop types
    const { data: stopTypesData } = await supabase
      .from('poi_stop_types')
      .select('*')
      .order('name');

    if (stopTypesData) {
      setStopTypes(stopTypesData.map(st => ({
        id: st.id,
        name: st.name,
        slug: st.slug,
        icon: st.icon,
        description: st.description || '',
        is_custom: st.is_custom || false
      })));
    }

    setLoading(false);
  }

  function handlePOISelect(poi: POI) {
    const isSelected = selectedPOIs.some(p => p.id === poi.id);

    if (isSelected) {
      // Remove POI
      setSelectedPOIs(selectedPOIs.filter(p => p.id !== poi.id));
      setItinerary(itinerary.filter(stop => stop.poi_id !== poi.id));
    } else {
      // Add POI
      setSelectedPOIs([...selectedPOIs, poi]);
      setItinerary([
        ...itinerary,
        {
          poi_id: poi.id,
          order_index: itinerary.length,
          duration_at_poi: 30, // default 30 minutes
          stop_type_id: null,
          custom_stop_name: null,
          stop_description: null,
          stop_images: null,
          provider_tips: null,
          notes: null,
          poi
        }
      ]);
    }
  }

  function handleRemovePOI(poiId: string) {
    setSelectedPOIs(selectedPOIs.filter(p => p.id !== poiId));
    setItinerary(itinerary.filter(stop => stop.poi_id !== poiId));
  }

  function calculateTotalTime() {
    // Sum stop durations
    const stopTime = itinerary.reduce((sum, stop) => sum + (stop.duration_at_poi || 0), 0);

    // Rough estimate: 40 km/h average, 1.3x for road factor
    let driveTime = 0;
    for (let i = 0; i < itinerary.length - 1; i++) {
      const poi1 = selectedPOIs.find(p => p.id === itinerary[i].poi_id);
      const poi2 = selectedPOIs.find(p => p.id === itinerary[i + 1].poi_id);

      if (poi1 && poi2) {
        const distance = calculateDistance(poi1.lat, poi1.lon, poi2.lat, poi2.lon);
        driveTime += Math.ceil((distance * 1.3 / 40) * 60); // minutes
      }
    }

    return stopTime + driveTime;
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function handleSave() {
    // Validation
    if (!tripName.trim()) {
      alert('Please enter a trip name');
      return;
    }

    if (itinerary.length === 0) {
      alert('Please add at least one POI to your trip');
      return;
    }

    if (!priceAmount || parseFloat(priceAmount) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    if (!seatsMax || parseInt(seatsMax) <= 0) {
      alert('Please enter maximum seats');
      return;
    }

    setSaving(true);

    try {
      // Get current user and provider
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in');
        return;
      }

      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!provider) {
        alert('Provider account not found');
        return;
      }

      // Create slug from trip name
      const slug = tripName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);

      // Calculate total duration
      const totalDuration = calculateTotalTime();

      // Create trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          provider_id: provider.id,
          slug,
          title: tripName,
          description: tripDescription || null,
          duration_minutes: totalDuration,
          price_type: priceType,
          price_amount: parseFloat(priceAmount),
          currency: 'EUR',
          seats_max: parseInt(seatsMax),
          vehicle_type: vehicleType,
          languages,
          includes: includes.split('\n').filter(i => i.trim()),
          exclusions: exclusions.split('\n').filter(e => e.trim()),
          active: true
        })
        .select()
        .single();

      if (tripError || !trip) {
        throw tripError || new Error('Failed to create trip');
      }

      // Create trip-POI relationships
      const tripPOIsData = itinerary.map(stop => ({
        trip_id: trip.id,
        poi_id: stop.poi_id,
        order_index: stop.order_index,
        duration_at_poi: stop.duration_at_poi,
        stop_type_id: stop.stop_type_id,
        custom_stop_name: stop.custom_stop_name,
        stop_description: stop.stop_description,
        stop_images: stop.stop_images,
        provider_tips: stop.provider_tips,
        notes: stop.notes
      }));

      const { error: tripPOIsError } = await supabase
        .from('trip_pois')
        .insert(tripPOIsData);

      if (tripPOIsError) {
        throw tripPOIsError;
      }

      // Success!
      router.push(`/dashboard/trips?created=${trip.id}`);
    } catch (error: any) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip: ' + error.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Create New Trip</h1>
        <p className="text-gray-600">Build a custom trip itinerary for your customers</p>
      </div>

      {/* Basic Trip Info */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Trip Details</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Trip Name *</label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="e.g., North Coast Highlights Tour"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Vehicle Type *</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="sedan">Sedan (4 seats)</option>
              <option value="minivan">Minivan (6-8 seats)</option>
              <option value="minibus">Minibus (9+ seats)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={tripDescription}
            onChange={(e) => setTripDescription(e.target.value)}
            placeholder="Describe what makes this trip special..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price Type *</label>
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="per_person">Per Person</option>
              <option value="fixed">Fixed (total)</option>
              <option value="hourly">Per Hour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price Amount (€) *</label>
            <input
              type="number"
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Seats *</label>
            <input
              type="number"
              value={seatsMax}
              onChange={(e) => setSeatsMax(e.target.value)}
              placeholder="0"
              min="1"
              max="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">What's Included (one per line)</label>
            <textarea
              value={includes}
              onChange={(e) => setIncludes(e.target.value)}
              placeholder="Pickup & drop-off&#10;Bottled water&#10;Professional guide"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Not Included (one per line)</label>
            <textarea
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              placeholder="Lunch&#10;Entrance fees&#10;Tips"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* POI Selection Map */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Select POIs on Map</h2>
        <POIMapSelector
          pois={pois}
          selectedPOIs={selectedPOIs}
          onPOISelect={handlePOISelect}
        />
      </div>

      {/* Itinerary Builder */}
      <div className="bg-white rounded-xl shadow p-6">
        <TripItineraryBuilder
          selectedPOIs={selectedPOIs}
          stopTypes={stopTypes}
          itinerary={itinerary}
          onItineraryChange={setItinerary}
          onRemovePOI={handleRemovePOI}
        />
      </div>

      {/* Trip Summary & Save */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Trip Summary</h2>
        <div className="grid md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Stops</p>
            <p className="text-2xl font-bold">{itinerary.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Est. Duration</p>
            <p className="text-2xl font-bold">{Math.round(calculateTotalTime() / 60)}h {calculateTotalTime() % 60}m</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Price</p>
            <p className="text-2xl font-bold">€{priceAmount || '0'}</p>
            <p className="text-xs text-gray-500">{priceType === 'per_person' ? '/ person' : priceType === 'hourly' ? '/ hour' : 'total'}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Capacity</p>
            <p className="text-2xl font-bold">{seatsMax || '0'}</p>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !tripName || itinerary.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating Trip...' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
