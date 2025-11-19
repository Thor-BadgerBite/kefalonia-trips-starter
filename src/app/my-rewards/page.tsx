import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'My Rewards | Kefalonia Trips',
  description: 'View your loyalty points and rewards',
};

export default async function MyRewardsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const email = searchParams?.email;

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Your Rewards</h1>
          <p className="text-gray-600 mb-6">
            Enter your email address to view your loyalty points and rewards
          </p>
          <form action="/my-rewards" method="get" className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              View My Rewards
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4">
            Your loyalty account is created automatically with your first booking
          </p>
        </div>
      </div>
    );
  }

  const supabase = createServerSupabaseClient();

  // Get customer account
  const { data: account } = await supabase
    .from('customer_accounts')
    .select('*')
    .eq('email', email)
    .single();

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Account Not Found</h1>
          <p className="text-gray-600 mb-6">
            No loyalty account found for {email}. Make your first booking to join
            our rewards program!
          </p>
          <Link
            href="/trips"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Browse Trips
          </Link>
        </div>
      </div>
    );
  }

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get available rewards
  const { data: availableRewards } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('active', true)
    .lte('points_required', account.loyalty_points)
    .order('points_required');

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'from-amber-600 to-amber-700',
      silver: 'from-gray-400 to-gray-500',
      gold: 'from-yellow-500 to-yellow-600',
      platinum: 'from-purple-500 to-blue-600',
    };
    return colors[tier] || colors.bronze;
  };

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
    };
    return icons[tier] || icons.bronze;
  };

  const nextTier = () => {
    const tiers = {
      bronze: { name: 'Silver', points: 2000 },
      silver: { name: 'Gold', points: 5000 },
      gold: { name: 'Platinum', points: 10000 },
      platinum: null,
    };
    return tiers[account.loyalty_tier as keyof typeof tiers];
  };

  const progressToNextTier = () => {
    const next = nextTier();
    if (!next) return 100;
    return (account.lifetime_points_earned / next.points) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getTierColor(account.loyalty_tier)} text-white`}>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{getTierIcon(account.loyalty_tier)}</span>
                  <h1 className="text-3xl font-bold capitalize">
                    {account.loyalty_tier} Member
                  </h1>
                </div>
                <p className="text-lg opacity-90">{account.name || account.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-75 mb-1">Available Points</div>
                <div className="text-3xl font-bold">{account.loyalty_points.toLocaleString()}</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-75 mb-1">Lifetime Earned</div>
                <div className="text-3xl font-bold">
                  {account.lifetime_points_earned.toLocaleString()}
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
                <div className="text-sm opacity-75 mb-1">Total Bookings</div>
                <div className="text-3xl font-bold">{account.total_bookings}</div>
              </div>
            </div>

            {nextTier() && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to {nextTier()?.name}</span>
                  <span>
                    {account.lifetime_points_earned} / {nextTier()?.points}
                  </span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(progressToNextTier(), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Referral Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-bold mb-3">Refer a Friend</h2>
            <p className="text-gray-700 mb-4">
              Share your code and earn 500 points when your friends complete their
              first trip!
            </p>
            <div className="flex gap-3 items-center">
              <div className="flex-1 bg-white rounded-lg p-4 border-2 border-blue-300">
                <div className="text-sm text-gray-600 mb-1">Your Referral Code</div>
                <div className="text-2xl font-bold text-blue-600 tracking-wider">
                  {account.referral_code}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(account.referral_code);
                  alert('Code copied to clipboard!');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Copy Code
              </button>
            </div>
            {account.successful_referrals > 0 && (
              <div className="mt-4 text-sm text-gray-700">
                🎉 You've successfully referred {account.successful_referrals}{' '}
                {account.successful_referrals === 1 ? 'friend' : 'friends'}!
              </div>
            )}
          </div>

          {/* Available Rewards */}
          {availableRewards && availableRewards.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Rewards You Can Redeem</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {availableRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                  >
                    <h3 className="font-semibold text-lg mb-2">{reward.name}</h3>
                    {reward.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {reward.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {reward.points_required}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                        Redeem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {transactions && transactions.length > 0 ? (
                <div className="divide-y">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {txn.source_description || 'Points Transaction'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(txn.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${
                              txn.points > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {txn.points > 0 ? '+' : ''}
                            {txn.points}
                          </div>
                          <div className="text-xs text-gray-500">
                            Balance: {txn.balance_after}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No activity yet. Start booking to earn points!
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">Ready to Earn More Points?</h3>
            <p className="text-blue-100 mb-6">
              Book your next adventure and continue earning rewards!
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
