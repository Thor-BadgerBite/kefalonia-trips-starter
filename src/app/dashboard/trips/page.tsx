import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TripsListClient from '@/components/trips/TripsListClient';

export default async function TripsListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
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

  // Get provider's trips with POI count
  const { data: trips } = await supabase
    .from('trips')
    .select(`
      *,
      trip_pois(count)
    `)
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  return (
    <TripsListClient
      trips={trips || []}
      created={searchParams?.created}
      updated={searchParams?.updated}
      deleted={searchParams?.deleted}
    />
  );
}
