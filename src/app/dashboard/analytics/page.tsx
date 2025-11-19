import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata = {
  title: 'Analytics | Provider Dashboard',
  description: 'View your business analytics and performance metrics',
};

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Get provider
  const { data: provider } = await supabase
    .from('providers')
    .select('id, name')
    .eq('user_id', user.id)
    .single();

  if (!provider) redirect('/dashboard');

  // Get date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Get all bookings for analytics
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      trip:trip_id(title, slug)
    `)
    .eq('provider_id', provider.id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  // Get all reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('status', 'published');

  // Get trips
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('provider_id', provider.id);

  return (
    <AnalyticsDashboard
      provider={provider}
      bookings={bookings || []}
      reviews={reviews || []}
      trips={trips || []}
      startDate={startDate.toISOString()}
      endDate={endDate.toISOString()}
    />
  );
}
