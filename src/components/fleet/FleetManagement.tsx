'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Vehicle, VehicleFeature } from '@/lib/types';

interface FleetManagementProps {
  providerId: string;
  initialVehicles: Vehicle[];
  availableFeatures: VehicleFeature[];
}

interface VehicleFormData {
  type: string;
  model: string;
  capacity: number;
  year: number | null;
  color: string;
  license_plate: string;
  description: string;
  features: string[];
  image_urls: string[];
  primary_image_url: string;
}

export default function FleetManagement({
  providerId,
  initialVehicles,
  availableFeatures,
}: FleetManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const emptyForm: VehicleFormData = {
    type: 'sedan',
    model: '',
    capacity: 4,
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    description: '',
    features: [],
    image_urls: [],
    primary_image_url: '',
  };

  const [formData, setFormData] = useState<VehicleFormData>(emptyForm);
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      const updatedUrls = [...formData.image_urls, newImageUrl.trim()];
      setFormData({
        ...formData,
        image_urls: updatedUrls,
        primary_image_url: formData.primary_image_url || updatedUrls[0],
      });
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedUrls = formData.image_urls.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      image_urls: updatedUrls,
      primary_image_url:
        formData.primary_image_url === formData.image_urls[index]
          ? updatedUrls[0] || ''
          : formData.primary_image_url,
    });
  };

  const handleSetPrimaryImage = (url: string) => {
    setFormData({ ...formData, primary_image_url: url });
  };

  const handleFeatureToggle = (featureName: string) => {
    setFormData({
      ...formData,
      features: formData.features.includes(featureName)
        ? formData.features.filter((f) => f !== featureName)
        : [...formData.features, featureName],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (editingVehicle) {
        // Update existing vehicle
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            type: formData.type,
            model: formData.model,
            capacity: formData.capacity,
            year: formData.year,
            color: formData.color,
            license_plate: formData.license_plate,
            description: formData.description,
            features: formData.features,
            image_urls: formData.image_urls,
            primary_image_url: formData.primary_image_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingVehicle.id);

        if (updateError) throw updateError;

        // Refresh vehicles list
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        setVehicles(data || []);
        setEditingVehicle(null);
      } else {
        // Create new vehicle
        const { error: insertError } = await supabase.from('vehicles').insert({
          provider_id: providerId,
          type: formData.type,
          model: formData.model,
          capacity: formData.capacity,
          year: formData.year,
          color: formData.color,
          license_plate: formData.license_plate,
          description: formData.description,
          features: formData.features,
          image_urls: formData.image_urls,
          primary_image_url: formData.primary_image_url,
          active: true,
        });

        if (insertError) throw insertError;

        // Refresh vehicles list
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        setVehicles(data || []);
        setShowAddForm(false);
      }

      setFormData(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      type: vehicle.type,
      model: vehicle.model,
      capacity: vehicle.capacity,
      year: vehicle.year,
      color: vehicle.color || '',
      license_plate: vehicle.license_plate || '',
      description: vehicle.description || '',
      features: vehicle.features || [],
      image_urls: vehicle.image_urls || [],
      primary_image_url: vehicle.primary_image_url || '',
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (vehicleId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ active: !currentActive })
        .eq('id', vehicleId);

      if (error) throw error;

      // Refresh vehicles list
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      setVehicles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle');
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);

      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== vehicleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle');
    }
  };

  const cancelEdit = () => {
    setEditingVehicle(null);
    setShowAddForm(false);
    setFormData(emptyForm);
    setError('');
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="sedan">Sedan</option>
                  <option value="minivan">Minivan</option>
                  <option value="minibus">Minibus</option>
                  <option value="suv">SUV</option>
                  <option value="luxury">Luxury Car</option>
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Mercedes E-Class, Toyota Hiace"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passenger Capacity *
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) })
                  }
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  placeholder="2020"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Black, White, Silver"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* License Plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) =>
                    setFormData({ ...formData, license_plate: e.target.value })
                  }
                  placeholder="ABC-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe this vehicle, its condition, and any special notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Vehicle Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Photos
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (e.g., https://example.com/photo.jpg)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Photo
                  </button>
                </div>

                {formData.image_urls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Vehicle ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          style={{
                            borderColor:
                              url === formData.primary_image_url ? '#3b82f6' : '',
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(url)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 text-white text-xs rounded"
                          >
                            {url === formData.primary_image_url ? '★ Primary' : 'Set Primary'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-600 text-white text-xs rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features & Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableFeatures.map((feature) => (
                  <label
                    key={feature.id}
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature.name)}
                      onChange={() => handleFeatureToggle(feature.name)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-sm">{feature.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingVehicle
                  ? 'Update Vehicle'
                  : 'Add Vehicle'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
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
          + Add New Vehicle
        </button>
      )}

      {/* Vehicles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className={`bg-white border rounded-lg overflow-hidden ${
              vehicle.active ? 'border-gray-200' : 'border-gray-300 opacity-60'
            }`}
          >
            {vehicle.primary_image_url ? (
              <img
                src={vehicle.primary_image_url}
                alt={vehicle.model}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                No Photo
              </div>
            )}

            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{vehicle.model}</h3>
                  {!vehicle.active && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 capitalize">{vehicle.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Capacity:</span>{' '}
                  <span className="font-medium">{vehicle.capacity} pax</span>
                </div>
                {vehicle.year && (
                  <div>
                    <span className="text-gray-600">Year:</span>{' '}
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                )}
                {vehicle.color && (
                  <div>
                    <span className="text-gray-600">Color:</span>{' '}
                    <span className="font-medium">{vehicle.color}</span>
                  </div>
                )}
                {vehicle.license_plate && (
                  <div>
                    <span className="text-gray-600">Plate:</span>{' '}
                    <span className="font-medium">{vehicle.license_plate}</span>
                  </div>
                )}
              </div>

              {vehicle.features && vehicle.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {vehicle.features.slice(0, 4).map((featureName) => {
                    const feature = availableFeatures.find((f) => f.name === featureName);
                    return (
                      <span
                        key={featureName}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                        title={feature?.description}
                      >
                        {feature?.icon} {featureName}
                      </span>
                    );
                  })}
                  {vehicle.features.length > 4 && (
                    <span className="text-xs text-gray-500">
                      +{vehicle.features.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(vehicle.id, vehicle.active)}
                  className={`flex-1 px-3 py-1.5 rounded text-sm ${
                    vehicle.active
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {vehicle.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && !showAddForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">No vehicles in your fleet yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Your First Vehicle
          </button>
        </div>
      )}
    </div>
  );
}
