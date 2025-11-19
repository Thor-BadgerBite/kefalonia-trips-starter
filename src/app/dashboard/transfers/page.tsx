'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TransferPricelist, TransferRegion } from '@/lib/types';

export default function TransfersPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState<TransferRegion[]>([]);
  const [pricelists, setPricelists] = useState<TransferPricelist[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);

  // Bulk upload form
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [fromRegion, setFromRegion] = useState('');
  const [toRegions, setToRegions] = useState<string[]>([]);
  const [vehicleType, setVehicleType] = useState<'sedan' | 'minivan' | 'minibus'>('sedan');
  const [priceType, setPriceType] = useState<'per_route' | 'per_person' | 'per_hour'>('per_route');
  const [priceAmount, setPriceAmount] = useState('');
  const [maxPassengers, setMaxPassengers] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // Get provider ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (provider) {
      setProviderId(provider.id);

      // Load regions
      const { data: regionsData } = await supabase
        .from('transfer_regions')
        .select('*')
        .eq('active', true)
        .order('name');

      if (regionsData) {
        setRegions(regionsData);
      }

      // Load provider's pricelists
      const { data: pricelistsData } = await supabase
        .from('transfer_pricelists')
        .select(`
          *,
          from_region:from_region_id(id, name, slug),
          to_region:to_region_id(id, name, slug)
        `)
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });

      if (pricelistsData) {
        setPricelists(pricelistsData as any);
      }
    }

    setLoading(false);
  }

  async function handleBulkAdd() {
    if (!providerId || !fromRegion || toRegions.length === 0 || !priceAmount) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);

    try {
      const entries = toRegions.map(toRegionId => ({
        provider_id: providerId,
        from_region_id: fromRegion,
        to_region_id: toRegionId,
        vehicle_type: vehicleType,
        price_type: priceType,
        price_amount: parseFloat(priceAmount),
        currency: 'EUR',
        max_passengers: maxPassengers ? parseInt(maxPassengers) : null,
        active: true
      }));

      const { error } = await supabase
        .from('transfer_pricelists')
        .insert(entries);

      if (error) throw error;

      // Reload data
      await loadData();

      // Reset form
      setShowBulkForm(false);
      setFromRegion('');
      setToRegions([]);
      setPriceAmount('');
      setMaxPassengers('');

      alert(`Added ${toRegions.length} transfer routes successfully!`);
    } catch (error: any) {
      console.error('Error adding transfers:', error);
      alert('Failed to add transfers: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transfer price?')) return;

    const { error } = await supabase
      .from('transfer_pricelists')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      setPricelists(pricelists.filter(p => p.id !== id));
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const { error } = await supabase
      .from('transfer_pricelists')
      .update({ active: !currentActive })
      .eq('id', id);

    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      setPricelists(pricelists.map(p =>
        p.id === id ? { ...p, active: !currentActive } : p
      ));
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

  const airportRegion = regions.find(r => r.area_type === 'airport');
  const accommodationRegions = regions.filter(r => r.area_type === 'accommodation' || r.area_type === 'village');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfer Pricelists</h1>
          <p className="text-gray-600 mt-1">Manage your point-to-point transfer rates</p>
        </div>
        <button
          onClick={() => setShowBulkForm(!showBulkForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          {showBulkForm ? 'Cancel' : '+ Add Transfer Prices'}
        </button>
      </div>

      {/* Bulk Add Form */}
      {showBulkForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold">Add Transfer Prices (Bulk)</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">From Location *</label>
              <select
                value={fromRegion}
                onChange={(e) => setFromRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="">Select starting point</option>
                {airportRegion && (
                  <optgroup label="Airport">
                    <option value={airportRegion.id}>{airportRegion.name}</option>
                  </optgroup>
                )}
                <optgroup label="Accommodation Areas">
                  {accommodationRegions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                To Locations * (Select multiple)
              </label>
              <select
                multiple
                value={toRegions}
                onChange={(e) => setToRegions(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent h-48"
              >
                {regions.filter(r => r.id !== fromRegion).map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name} ({region.area_type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple destinations</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Type *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="sedan">Sedan</option>
                <option value="minivan">Minivan</option>
                <option value="minibus">Minibus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price Type *</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="per_route">Per Route (total)</option>
                <option value="per_person">Per Person</option>
                <option value="per_hour">Per Hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price (€) *</label>
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
              <label className="block text-sm font-medium mb-2">Max Passengers</label>
              <input
                type="number"
                value={maxPassengers}
                onChange={(e) => setMaxPassengers(e.target.value)}
                placeholder="4"
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600">
              This will create <span className="font-semibold text-blue-600">{toRegions.length}</span> transfer prices
            </p>
            <button
              onClick={handleBulkAdd}
              disabled={saving || !fromRegion || toRegions.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Adding...' : 'Add Prices'}
            </button>
          </div>
        </div>
      )}

      {/* Pricelists Table */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Your Transfer Prices ({pricelists.length})</h2>
        </div>

        {pricelists.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Pax</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pricelists.map((price: any) => (
                  <tr key={price.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{price.from_region?.name}</td>
                    <td className="px-6 py-4 text-sm">{price.to_region?.name}</td>
                    <td className="px-6 py-4 text-sm capitalize">{price.vehicle_type}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                      €{price.price_amount}
                      <span className="text-xs text-gray-500 ml-1">
                        {price.price_type === 'per_person' ? '/person' :
                         price.price_type === 'per_hour' ? '/hour' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{price.max_passengers || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        price.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {price.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => toggleActive(price.id, price.active)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {price.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(price.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">No transfer prices yet</h3>
              <p className="text-gray-600 text-sm">
                Add your transfer rates to appear in client searches when they need airport pickups or inter-city transfers.
              </p>
              <button
                onClick={() => setShowBulkForm(true)}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Add Your First Prices
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold mb-3">💡 Transfer Pricing Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• <strong>Airport transfers</strong> are the most common - make sure to add rates from Airport to popular areas</li>
          <li>• <strong>Per-route pricing</strong> is simplest for fixed transfers (recommended)</li>
          <li>• <strong>Per-person pricing</strong> works well if you offer shared transfers</li>
          <li>• <strong>Set competitive prices</strong> - check what taxis typically charge in Kefalonia</li>
          <li>• <strong>Be available</strong> - transfers need quick confirmation, especially airport pickups</li>
        </ul>
      </div>
    </div>
  );
}
