import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import PackageBookingForm from '@/components/packages/PackageBookingForm';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: pkg } = await supabase
    .from('packages')
    .select('name, description')
    .eq('slug', params.slug)
    .eq('active', true)
    .single();

  if (!pkg) {
    return {
      title: 'Package Not Found',
    };
  }

  return {
    title: `${pkg.name} | Kefalonia Package Deals`,
    description: pkg.description || `Book ${pkg.name} package deal`,
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabaseClient();

  // Get package with all details
  const { data: pkg } = await supabase
    .from('packages')
    .select(`
      *,
      provider:provider_id(
        id,
        name,
        slug,
        email,
        phone,
        description,
        logo_url
      )
    `)
    .eq('slug', params.slug)
    .eq('active', true)
    .single();

  if (!pkg) {
    notFound();
  }

  // Get trips in this package
  const { data: packageTrips } = await supabase
    .from('package_trips')
    .select(`
      trip_order,
      day_offset,
      trip:trip_id(
        id,
        title,
        slug,
        description,
        price_per_person,
        duration_hours,
        category,
        difficulty_level,
        cover_image,
        includes_transfer,
        pickup_location
      )
    `)
    .eq('package_id', pkg.id)
    .order('trip_order');

  const trips = packageTrips?.map((pt) => pt.trip) || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 bg-gradient-to-r from-blue-600 to-blue-800">
        {pkg.cover_image ? (
          <Image
            src={pkg.cover_image}
            alt={pkg.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-32 h-32 text-white opacity-30"
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
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40" />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-0 right-0">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-white">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <span>/</span>
              <Link href="/packages" className="hover:underline">
                Packages
              </Link>
              <span>/</span>
              <span className="text-blue-200">{pkg.name}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black to-transparent">
          <div className="container mx-auto px-4">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full mb-3">
              PACKAGE DEAL • SAVE {pkg.discount_percentage}%
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {pkg.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white text-sm">
              <div className="flex items-center gap-1">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {trips.length} trips included
              </div>
              <div className="flex items-center gap-1">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {pkg.total_duration_hours}h total duration
              </div>
              {pkg.includes_transfers && (
                <div className="flex items-center gap-1">
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
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Transfers included
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {pkg.description && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">About This Package</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {pkg.description}
                </p>
              </div>
            )}

            {/* Highlights */}
            {pkg.highlights && pkg.highlights.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Package Highlights</h2>
                <ul className="space-y-2">
                  {pkg.highlights.map((highlight: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Included Trips */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">Included Trips</h2>
              <div className="space-y-4">
                {trips.map((trip: any, index: number) => (
                  <div
                    key={trip.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex gap-4">
                      {/* Trip Number */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>

                      {/* Trip Details */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {trip.title}
                        </h3>
                        {trip.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {trip.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {trip.duration_hours}h
                          </div>
                          {trip.difficulty_level && (
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
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              {trip.difficulty_level}
                            </div>
                          )}
                          {trip.includes_transfer && (
                            <div className="flex items-center gap-1 text-green-600">
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
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Transfer included
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/trips/${trip.slug}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View trip details →
                          </Link>
                        </div>
                      </div>

                      {/* Individual Price */}
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Individual</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(trip.price_per_person)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">About the Provider</h2>
              <div className="flex items-start gap-4">
                {pkg.provider.logo_url && (
                  <Image
                    src={pkg.provider.logo_url}
                    alt={pkg.provider.name}
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {pkg.provider.name}
                  </h3>
                  {pkg.provider.description && (
                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {pkg.provider.description}
                    </p>
                  )}
                  <Link
                    href={`/providers/${pkg.provider.slug}`}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View provider profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                {/* Pricing */}
                <div className="mb-6 pb-6 border-b">
                  <div className="text-sm text-gray-500 mb-1">Package Price</div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(pkg.package_price)}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(pkg.original_price)}
                    </span>
                  </div>
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded">
                    Save {pkg.discount_percentage}% (
                    {formatPrice(pkg.original_price - pkg.package_price)})
                  </div>
                  <div className="text-xs text-gray-500 mt-2">per person</div>
                </div>

                {/* Booking Form */}
                <PackageBookingForm
                  packageData={{
                    id: pkg.id,
                    name: pkg.name,
                    slug: pkg.slug,
                    package_price: pkg.package_price,
                    min_guests: pkg.min_guests,
                    max_guests: pkg.max_guests,
                    provider_id: pkg.provider_id,
                  }}
                  trips={trips}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
