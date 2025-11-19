import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get provider data
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!provider) {
    // User doesn't have a provider account
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow">
          <h1 className="text-2xl font-bold mb-4">No Provider Account</h1>
          <p className="text-gray-600 mb-6">
            Your account doesn't have provider access. Please contact support.
          </p>
          <form action="/auth/logout" method="post">
            <button className="bg-gray-600 text-white px-6 py-2 rounded-lg">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Kefalonia Trips
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/trips"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Trips
                </Link>
                <Link
                  href="/dashboard/packages"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Packages
                </Link>
                <Link
                  href="/dashboard/bookings"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Bookings
                </Link>
                <Link
                  href="/dashboard/messages"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Messages
                </Link>
                <Link
                  href="/dashboard/pricing"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Pricing
                </Link>
                <Link
                  href="/dashboard/vouchers"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Vouchers
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Analytics
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {provider.name}
              </span>
              <Link
                href="/dashboard/settings"
                className="text-gray-600 hover:text-gray-900"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
