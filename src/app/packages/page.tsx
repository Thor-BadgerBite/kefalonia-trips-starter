import { createServerSupabaseClient } from '@/lib/supabase/server';
import PackageCard from '@/components/packages/PackageCard';

export const metadata = {
  title: 'Package Deals | Kefalonia Trips',
  description: 'Discover amazing package deals for your Kefalonia adventure',
};

export default async function PackagesPage() {
  const supabase = createServerSupabaseClient();

  // Get active packages with provider and trip count
  const { data: packages } = await supabase
    .from('packages')
    .select(`
      *,
      provider:provider_id(name, slug),
      package_trips(count)
    `)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  const featuredPackages = packages?.filter((p) => p.featured) || [];
  const regularPackages = packages?.filter((p) => !p.featured) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Package Deals
            </h1>
            <p className="text-xl text-blue-100 mb-6">
              Save big with our curated package deals combining the best
              experiences Kefalonia has to offer
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <div className="text-3xl font-bold">
                  {packages?.length || 0}
                </div>
                <div className="text-blue-200 text-sm">Package Deals</div>
              </div>
              <div>
                <div className="text-3xl font-bold">Up to 30%</div>
                <div className="text-blue-200 text-sm">Savings</div>
              </div>
              <div>
                <div className="text-3xl font-bold">Multi-Day</div>
                <div className="text-blue-200 text-sm">Experiences</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Why Choose Packages */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Why Book a Package?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Save Money</h3>
              <p className="text-sm text-gray-600">
                Up to 30% off individual trip prices
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              </div>
              <h3 className="font-semibold mb-1">Curated Experiences</h3>
              <p className="text-sm text-gray-600">
                Expertly planned itineraries
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-purple-600"
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
              </div>
              <h3 className="font-semibold mb-1">Save Time</h3>
              <p className="text-sm text-gray-600">
                One booking for multiple trips
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Complete Experience</h3>
              <p className="text-sm text-gray-600">
                See more of the island
              </p>
            </div>
          </div>
        </div>

        {/* Featured Packages */}
        {featuredPackages.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-6 h-6 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h2 className="text-2xl font-bold">Featured Packages</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  {...pkg}
                  provider={pkg.provider}
                  tripCount={pkg.package_trips[0]?.count || 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Packages */}
        {regularPackages.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {featuredPackages.length > 0 ? 'More Packages' : 'All Packages'}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  {...pkg}
                  provider={pkg.provider}
                  tripCount={pkg.package_trips[0]?.count || 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Packages */}
        {!packages || packages.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No packages available yet
            </h3>
            <p className="text-gray-600">
              Check back soon for amazing package deals!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
