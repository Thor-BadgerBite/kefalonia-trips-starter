import Link from 'next/link';
import Image from 'next/image';

interface PackageCardProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  package_price: number;
  original_price: number;
  discount_percentage: number;
  total_duration_hours: number;
  includes_transfers: boolean;
  cover_image: string | null;
  provider?: {
    name: string;
    slug: string;
  };
  tripCount?: number;
}

export default function PackageCard({
  id,
  name,
  slug,
  description,
  package_price,
  original_price,
  discount_percentage,
  total_duration_hours,
  includes_transfers,
  cover_image,
  provider,
  tripCount,
}: PackageCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <Link
      href={`/packages/${slug}`}
      className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-56">
        {cover_image ? (
          <Image
            src={cover_image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <svg
              className="w-20 h-20 text-white opacity-50"
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

        {/* Discount Badge */}
        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          Save {discount_percentage}%
        </div>

        {/* Package Badge */}
        <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
          PACKAGE DEAL
        </div>
      </div>

      <div className="p-5">
        {/* Provider */}
        {provider && (
          <div className="text-sm text-gray-600 mb-2">{provider.name}</div>
        )}

        {/* Package Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Package Info */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
          {tripCount && (
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
              {tripCount} trips
            </div>
          )}

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
            {total_duration_hours}h total
          </div>

          {includes_transfers && (
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Transfers included
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-200">
          <div>
            <div className="text-sm text-gray-500 line-through">
              {formatPrice(original_price)}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(package_price)}
            </div>
            <div className="text-xs text-gray-500">per person</div>
          </div>

          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            View Details
          </button>
        </div>
      </div>
    </Link>
  );
}
