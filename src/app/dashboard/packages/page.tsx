import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PackagesManager from '@/components/packages/PackagesManager';

export const metadata = {
  title: 'Package Deals | Provider Dashboard',
  description: 'Manage your package deals and bundles',
};

export default async function PackagesPage() {
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

  // Get packages with trip count
  const { data: packages } = await supabase
    .from('packages')
    .select(`
      *,
      package_trips(count)
    `)
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  // Get provider's trips for package creation
  const { data: trips } = await supabase
    .from('trips')
    .select('id, title, slug, price_per_person, duration_hours')
    .eq('provider_id', provider.id)
    .eq('active', true)
    .order('title');

  return (
    <PackagesManager
      providerId={provider.id}
      initialPackages={packages || []}
      availableTrips={trips || []}
    />
  );
}
