'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { TransferRegion, TransferPricelist } from '@/lib/types';

export default function TransferSearchPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<TransferRegion[]>([]);
  const [fromRegion, setFromRegion] = useState('');
  const [toRegion, setToRegion] = useState('');
  const [passengers, setPassengers] = useState('2');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadRegions();
  }, []);

  async function loadRegions() {
    const { data } = await supabase
      .from('transfer_regions')
      .select('*')
      .eq('active', true)
      .order('name');

    if (data) {
      setRegions(data);
    }
  }

  async function handleSearch() {
    if (!fromRegion || !toRegion) {
      alert('Please select both pickup and dropoff locations');
      return;
    }

    if (fromRegion === toRegion) {
      alert('Pickup and dropoff must be different locations');
      return;
    }

    setLoading(true);
    setSearched(true);

    // Search for transfer prices
    const { data, error } = await supabase
      .from('transfer_pricelists')
      .select(`
        *,
        from_region:from_region_id(id, name),
        to_region:to_region_id(id, name),
        provider:provider_id(id, name, slug, rating_avg, rating_count, phone, languages)
      `)
      .eq('from_region_id', fromRegion)
      .eq('to_region_id', toRegion)
      .eq('active', true)
      .gte('max_passengers', parseInt(passengers) || 1)
      .order('price_amount', { ascending: true });

    if (error) {
      console.error('Search error:', error);
      alert('Failed to search transfers');
    } else {
      setResults(data || []);
    }

    setLoading(false);
  }

  function calculateTotalPrice(transfer: any) {
    const pax = parseInt(passengers) || 1;
    if (transfer.price_type === 'per_person') {
      return transfer.price_amount * pax;
    }
    return transfer.price_amount;
  }

  const airportRegion = regions.find(r => r.area_type === 'airport');
  const accommodationRegions = regions.filter(r => r.area_type === 'accommodation' || r.area_type === 'village');
  const otherRegions = regions.filter(r => r.area_type !== 'airport' && r.area_type !== 'accommodation' && r.area_type !== 'village');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Kefalonia Transfers</h1>
            <p className="text-xl text-gray-600">Book reliable airport transfers and inter-city transportation</p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-8">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Pickup Location</label>
                <select
                  value={fromRegion}
                  onChange={(e) => setFromRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                >
                  <option value="">Select pickup...</option>
                  {airportRegion && (
                    <optgroup label="✈️ Airport">
                      <option value={airportRegion.id}>{airportRegion.name}</option>
                    </optgroup>
                  )}
                  <optgroup label="🏨 Accommodation Areas">
                    {accommodationRegions.map(region => (
                      <option key={region.id} value={region.id}>{region.name}</option>
                    ))}
                  </optgroup>
                  {otherRegions.length > 0 && (
                    <optgroup label="📍 Other Locations">
                      {otherRegions.map(region => (
                        <option key={region.id} value={region.id}>{region.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Dropoff Location</label>
                <select
                  value={toRegion}
                  onChange={(e) => setToRegion(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                >
                  <option value="">Select dropoff...</option>
                  {airportRegion && (
                    <optgroup label="✈️ Airport">
                      <option value={airportRegion.id}>{airportRegion.name}</option>
                    </optgroup>
                  )}
                  <optgroup label="🏨 Accommodation Areas">
                    {accommodationRegions.map(region => (
                      <option key={region.id} value={region.id}>{region.name}</option>
                    ))}
                  </optgroup>
                  {otherRegions.length > 0 && (
                    <optgroup label="📍 Other Locations">
                      {otherRegions.map(region => (
                        <option key={region.id} value={region.id}>{region.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Passengers</label>
                <input
                  type="number"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-white text-blue-600 font-bold py-4 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Transfers'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {searched && (
          <>
            {results.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    Found {results.length} transfer{results.length !== 1 ? 's' : ''}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Sort by:</span>
                    <select className="px-3 py-1 border border-gray-300 rounded-lg">
                      <option>Lowest Price</option>
                      <option>Highest Rated</option>
                      <option>Most Reviews</option>
                    </select>
                  </div>
                </div>

                {results.map((transfer: any) => {
                  const totalPrice = calculateTotalPrice(transfer);
                  const priceLabel =
                    transfer.price_type === 'per_person'
                      ? `€${transfer.price_amount} × ${passengers} = €${totalPrice}`
                      : `€${totalPrice} total`;

                  return (
                    <div key={transfer.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition">
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-6">
                          {/* Provider Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                                {transfer.provider.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold">{transfer.provider.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center">
                                    <span className="text-yellow-500">★</span>
                                    <span className="text-sm font-medium ml-1">
                                      {transfer.provider.rating_avg.toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    ({transfer.provider.rating_count} reviews)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Vehicle</p>
                                <p className="font-medium capitalize">{transfer.vehicle_type}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Max Passengers</p>
                                <p className="font-medium">{transfer.max_passengers || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Languages</p>
                                <div className="flex gap-1">
                                  {transfer.provider.languages?.slice(0, 3).map((lang: string) => (
                                    <span key={lang} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                      {lang.toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-600">Contact</p>
                                <p className="font-medium text-sm">{transfer.provider.phone || 'N/A'}</p>
                              </div>
                            </div>

                            {transfer.notes && (
                              <p className="text-sm text-gray-600 mt-3 italic">{transfer.notes}</p>
                            )}
                          </div>

                          {/* Pricing & CTA */}
                          <div className="flex flex-col items-end gap-3">
                            <div className="text-right">
                              <p className="text-3xl font-bold text-blue-600">€{totalPrice}</p>
                              <p className="text-sm text-gray-500">{priceLabel}</p>
                            </div>

                            <Link
                              href={`/book-transfer?provider=${transfer.provider.id}&from=${fromRegion}&to=${toRegion}&pax=${passengers}&price=${totalPrice}`}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-center"
                            >
                              Book Now
                            </Link>

                            <Link
                              href={`/providers/${transfer.provider.slug}`}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              View provider profile →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold">No transfers found</h3>
                  <p className="text-gray-600">
                    No providers offer this route yet. Try a different route or check back later.
                  </p>
                  <button
                    onClick={() => {
                      setSearched(false);
                      setResults([]);
                    }}
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Try Another Search
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Why Book Transfers with Us?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Best Prices</h4>
                    <p className="text-sm text-gray-600">Compare prices from multiple providers and choose the best deal</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Verified Providers</h4>
                    <p className="text-sm text-gray-600">All drivers are licensed and verified for your safety</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">24/7 Availability</h4>
                    <p className="text-sm text-gray-600">Book transfers anytime, including late-night airport arrivals</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Rated Drivers</h4>
                    <p className="text-sm text-gray-600">Read reviews from previous customers before you book</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Home */}
      <div className="text-center pb-12">
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
