import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Loyalty Program | Kefalonia Trips',
  description: 'Earn points and rewards with every booking',
};

export default async function LoyaltyPage() {
  const supabase = createServerSupabaseClient();

  // Get available rewards (no auth required)
  const { data: rewards } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('active', true)
    .order('points_required');

  const bronzeRewards = rewards?.filter((r) => !r.min_tier || r.min_tier === 'bronze') || [];
  const silverRewards = rewards?.filter((r) => r.min_tier === 'silver') || [];
  const goldRewards = rewards?.filter((r) => r.min_tier === 'gold') || [];
  const platinumRewards = rewards?.filter((r) => r.min_tier === 'platinum') || [];

  const formatReward = (reward: any) => {
    if (reward.reward_type === 'discount_percentage') {
      return `${reward.reward_value}% off`;
    } else if (reward.reward_type === 'discount_fixed') {
      return `€${reward.reward_value} off`;
    } else if (reward.reward_type === 'free_trip') {
      return 'Free trip';
    } else if (reward.reward_type === 'upgrade') {
      return 'Free upgrade';
    }
    return 'Reward';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Loyalty Rewards Program
            </h1>
            <p className="text-xl text-purple-100 mb-6">
              Earn points with every booking and unlock exclusive rewards
            </p>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">1 Point = €1</div>
                <div className="text-purple-200 text-sm mt-1">
                  On every booking
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">4 Tiers</div>
                <div className="text-purple-200 text-sm mt-1">
                  Bronze to Platinum
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold">Refer & Earn</div>
                <div className="text-purple-200 text-sm mt-1">
                  Bonus points for friends
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">1. Sign Up</h3>
              <p className="text-sm text-gray-600">
                Create your account automatically with your first booking
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h3 className="font-semibold mb-2">2. Earn Points</h3>
              <p className="text-sm text-gray-600">
                Get 1 point for every €1 spent on trips and packages
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
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
              </div>
              <h3 className="font-semibold mb-2">3. Level Up</h3>
              <p className="text-sm text-gray-600">
                Progress through tiers to unlock better rewards
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">4. Redeem</h3>
              <p className="text-sm text-gray-600">
                Use your points for discounts and exclusive perks
              </p>
            </div>
          </div>
        </div>

        {/* Loyalty Tiers */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Membership Tiers
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-amber-600">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🥉</div>
                <h3 className="text-xl font-bold text-amber-700">Bronze</h3>
                <p className="text-sm text-gray-600 mt-1">0 - 1,999 points</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Earn 1 point per €1
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Birthday bonus
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Basic rewards
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-gray-400">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🥈</div>
                <h3 className="text-xl font-bold text-gray-600">Silver</h3>
                <p className="text-sm text-gray-600 mt-1">2,000 - 4,999 points</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  All Bronze benefits
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Better rewards
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-yellow-500">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🥇</div>
                <h3 className="text-xl font-bold text-yellow-600">Gold</h3>
                <p className="text-sm text-gray-600 mt-1">5,000 - 9,999 points</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  All Silver benefits
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Early access
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Premium rewards
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">💎</div>
                <h3 className="text-xl font-bold">Platinum</h3>
                <p className="text-sm text-purple-100 mt-1">10,000+ points</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-purple-200 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  All Gold benefits
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-purple-200 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  VIP treatment
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-purple-200 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Exclusive rewards
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-12 border border-blue-200">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Refer a Friend</h2>
            <p className="text-gray-700 mb-6">
              Share your love for Kefalonia! Get your unique referral code when
              you make your first booking. When your friends book using your code,
              you both earn bonus points!
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6">
                <div className="text-4xl mb-2">🎁</div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  500 Points
                </div>
                <div className="text-sm text-gray-600">
                  For you when friend completes first trip
                </div>
              </div>
              <div className="bg-white rounded-lg p-6">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  10% Off
                </div>
                <div className="text-sm text-gray-600">
                  For your friend on their first booking
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Rewards Preview */}
        {rewards && rewards.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">
              Available Rewards
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {rewards.slice(0, 6).map((reward) => (
                <div
                  key={reward.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {reward.name}
                      </h3>
                      {reward.min_tier && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                          {reward.min_tier.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {reward.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {reward.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {reward.points_required}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {formatReward(reward)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Start Earning Rewards?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Make your first booking today and automatically join our loyalty
              program. Start earning points and unlock exclusive rewards!
            </p>
            <Link
              href="/trips"
              className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Browse Trips
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
