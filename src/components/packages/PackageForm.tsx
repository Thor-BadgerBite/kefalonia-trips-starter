'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Trip {
  id: string;
  title: string;
  slug: string;
  price_per_person: number;
  duration_hours: number;
}

interface PackageFormProps {
  providerId: string;
  availableTrips: Trip[];
  existingPackage?: any;
  onClose: () => void;
}

export default function PackageForm({
  providerId,
  availableTrips,
  existingPackage,
  onClose,
}: PackageFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: existingPackage?.name || '',
    slug: existingPackage?.slug || '',
    description: existingPackage?.description || '',
    package_price: existingPackage?.package_price || '',
    valid_from: existingPackage?.valid_from || '',
    valid_until: existingPackage?.valid_until || '',
    min_guests: existingPackage?.min_guests || 1,
    max_guests: existingPackage?.max_guests || '',
    max_bookings: existingPackage?.max_bookings || '',
    active: existingPackage?.active ?? true,
    featured: existingPackage?.featured ?? false,
  });

  useEffect(() => {
    if (existingPackage) {
      loadPackageTrips();
    }
  }, [existingPackage]);

  const loadPackageTrips = async () => {
    if (!existingPackage) return;

    const { data } = await supabase
      .from('package_trips')
      .select('trip_id')
      .eq('package_id', existingPackage.id)
      .order('trip_order');

    if (data) {
      setSelectedTripIds(data.map((pt) => pt.trip_id));
    }
  };

  const handleTripToggle = (tripId: string) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId)
        ? prev.filter((id) => id !== tripId)
        : [...prev, tripId]
    );
  };

  const calculateOriginalPrice = () => {
    return selectedTripIds.reduce((total, tripId) => {
      const trip = availableTrips.find((t) => t.id === tripId);
      return total + (trip?.price_per_person || 0);
    }, 0);
  };

  const calculateDiscount = () => {
    const original = calculateOriginalPrice();
    const packagePrice = parseFloat(formData.package_price) || 0;
    if (original === 0) return 0;
    return Math.round(((original - packagePrice) / original) * 100);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTripIds.length < 2) {
      alert('Please select at least 2 trips for the package');
      return;
    }

    const originalPrice = calculateOriginalPrice();
    const packagePrice = parseFloat(formData.package_price);

    if (packagePrice >= originalPrice) {
      alert(
        'Package price must be less than the original price to offer a discount'
      );
      return;
    }

    setLoading(true);

    try {
      const packageData = {
        provider_id: providerId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        original_price: originalPrice,
        package_price: packagePrice,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        min_guests: formData.min_guests,
        max_guests: formData.max_guests ? parseInt(formData.max_guests) : null,
        max_bookings: formData.max_bookings
          ? parseInt(formData.max_bookings)
          : null,
        active: formData.active,
        featured: formData.featured,
      };

      if (existingPackage) {
        // Update existing package
        const { error: packageError } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', existingPackage.id);

        if (packageError) throw packageError;

        // Delete existing package trips
        await supabase
          .from('package_trips')
          .delete()
          .eq('package_id', existingPackage.id);

        // Insert new package trips
        const packageTrips = selectedTripIds.map((tripId, index) => ({
          package_id: existingPackage.id,
          trip_id: tripId,
          trip_order: index,
        }));

        const { error: tripsError } = await supabase
          .from('package_trips')
          .insert(packageTrips);

        if (tripsError) throw tripsError;
      } else {
        // Create new package
        const { data: newPackage, error: packageError } = await supabase
          .from('packages')
          .insert(packageData)
          .select()
          .single();

        if (packageError || !newPackage) throw packageError;

        // Insert package trips
        const packageTrips = selectedTripIds.map((tripId, index) => ({
          package_id: newPackage.id,
          trip_id: tripId,
          trip_order: index,
        }));

        const { error: tripsError } = await supabase
          .from('package_trips')
          .insert(packageTrips);

        if (tripsError) throw tripsError;
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving package:', error);
      alert('Failed to save package: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedTrips = availableTrips.filter((t) =>
    selectedTripIds.includes(t.id)
  );
  const totalDuration = selectedTrips.reduce(
    (sum, t) => sum + t.duration_hours,
    0
  );
  const originalPrice = calculateOriginalPrice();
  const discount = calculateDiscount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {existingPackage ? 'Edit Package' : 'Create Package Deal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Package Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Package Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Island Explorer Package"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="island-explorer-package"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from name, can be customized
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe what makes this package special..."
              />
            </div>
          </div>

          {/* Trip Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Trips *</h3>
            <p className="text-sm text-gray-600">
              Choose at least 2 trips to include in this package
            </p>

            <div className="grid md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availableTrips.map((trip) => (
                <label
                  key={trip.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    selectedTripIds.includes(trip.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTripIds.includes(trip.id)}
                    onChange={() => handleTripToggle(trip.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">
                      {trip.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      €{trip.price_per_person.toFixed(2)} • {trip.duration_hours}
                      h
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {selectedTrips.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Selected Trips ({selectedTrips.length})
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {selectedTrips.map((trip, index) => (
                    <div key={trip.id}>
                      {index + 1}. {trip.title}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                  <span className="font-medium">Total Duration:</span>
                  <span>{totalDuration}h</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing *</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Original Price (sum of trips):</span>
                <span className="font-semibold">
                  €{originalPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-blue-700">
                Set your package price below to create a discount
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Price (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={originalPrice}
                value={formData.package_price}
                onChange={(e) =>
                  setFormData({ ...formData, package_price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
              {formData.package_price && (
                <div className="mt-2 text-sm">
                  {discount > 0 ? (
                    <span className="text-green-600 font-medium">
                      Customers save {discount}% (€
                      {(originalPrice - parseFloat(formData.package_price)).toFixed(
                        2
                      )}
                      )
                    </span>
                  ) : (
                    <span className="text-red-600">
                      Price must be less than €{originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Validity Period</h3>
            <p className="text-sm text-gray-600">
              Leave empty for ongoing availability
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_from: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.min_guests}
                  onChange={(e) =>
                    setFormData({ ...formData, min_guests: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Guests
                </label>
                <input
                  type="number"
                  min={formData.min_guests}
                  value={formData.max_guests}
                  onChange={(e) =>
                    setFormData({ ...formData, max_guests: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Bookings
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_bookings}
                  onChange={(e) =>
                    setFormData({ ...formData, max_bookings: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (visible to customers)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Featured on homepage
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedTripIds.length < 2}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Saving...'
                : existingPackage
                ? 'Update Package'
                : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
