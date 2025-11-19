'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import PackageForm from './PackageForm';

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  original_price: number;
  package_price: number;
  discount_percentage: number;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  featured: boolean;
  total_bookings: number;
  total_duration_hours: number;
  package_trips: { count: number }[];
}

interface Trip {
  id: string;
  title: string;
  slug: string;
  price_per_person: number;
  duration_hours: number;
}

interface PackagesManagerProps {
  providerId: string;
  initialPackages: Package[];
  availableTrips: Trip[];
}

export default function PackagesManager({
  providerId,
  initialPackages,
  availableTrips,
}: PackagesManagerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const handleToggleActive = async (packageId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('packages')
      .update({ active: !currentStatus })
      .eq('id', packageId);

    if (!error) {
      setPackages(
        packages.map((p) =>
          p.id === packageId ? { ...p, active: !currentStatus } : p
        )
      );
    }
  };

  const handleToggleFeatured = async (
    packageId: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from('packages')
      .update({ featured: !currentStatus })
      .eq('id', packageId);

    if (!error) {
      setPackages(
        packages.map((p) =>
          p.id === packageId ? { ...p, featured: !currentStatus } : p
        )
      );
    }
  };

  const handleDelete = async (packageId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this package? This cannot be undone.'
      )
    )
      return;

    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId);

    if (!error) {
      setPackages(packages.filter((p) => p.id !== packageId));
    }
  };

  const handleFormClose = () => {
    setShowCreateModal(false);
    setEditingPackage(null);
    router.refresh();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Package Deals</h1>
          <p className="text-gray-600 mt-1">
            Create attractive bundles to increase bookings and revenue
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Package
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Why Create Package Deals?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Increase average booking value by bundling trips together</li>
              <li>Attract customers with discounted pricing</li>
              <li>Stand out with unique multi-day experiences</li>
              <li>Reduce cancellations with committed multi-trip bookings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      {packages.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {pkg.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pkg.package_trips[0]?.count || 0} trips •{' '}
                      {pkg.total_duration_hours}h total
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleFeatured(pkg.id, pkg.featured)}
                      className={`p-1.5 rounded ${
                        pkg.featured
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-gray-500'
                      }`}
                      title={pkg.featured ? 'Unfeature' : 'Feature'}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={pkg.featured ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {pkg.description}
                  </p>
                )}

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(pkg.package_price)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(pkg.original_price)}
                    </span>
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Save {pkg.discount_percentage}%
                  </div>
                </div>

                {/* Validity */}
                {(pkg.valid_from || pkg.valid_until) && (
                  <div className="text-xs text-gray-500 mb-4">
                    Valid:{' '}
                    {pkg.valid_from
                      ? new Date(pkg.valid_from).toLocaleDateString()
                      : 'Now'}{' '}
                    -{' '}
                    {pkg.valid_until
                      ? new Date(pkg.valid_until).toLocaleDateString()
                      : 'Ongoing'}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {pkg.total_bookings} bookings
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => handleToggleActive(pkg.id, pkg.active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pkg.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pkg.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPackage(pkg)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No packages yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first package deal to bundle trips and increase revenue
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Create Your First Package
          </button>
        </div>
      )}

      {/* Package Examples */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Package Deal Ideas</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">
              🌊 Island Explorer
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Combine beach tours, cave exploration, and coastal drives for a
              complete island experience
            </p>
            <div className="text-xs text-gray-500">3-4 trips • 15% discount</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">
              🎯 Weekend Getaway
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Perfect 2-day package with scenic tours, wine tasting, and sunset
              viewing
            </p>
            <div className="text-xs text-gray-500">2-3 trips • 20% discount</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-2">
              👨‍👩‍👧‍👦 Family Adventure
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Kid-friendly activities bundled together with group discounts
            </p>
            <div className="text-xs text-gray-500">3-5 trips • 25% discount</div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPackage) && (
        <PackageForm
          providerId={providerId}
          availableTrips={availableTrips}
          existingPackage={editingPackage}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
