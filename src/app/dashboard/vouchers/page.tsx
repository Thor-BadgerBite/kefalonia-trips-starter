import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VouchersManager from '@/components/vouchers/VouchersManager';

export const metadata = {
  title: 'Vouchers & Promo Codes | Provider Dashboard',
  description: 'Manage gift vouchers and promotional codes',
};

export default async function VouchersPage() {
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

  // Get vouchers with usage stats
  const { data: vouchers } = await supabase
    .from('vouchers')
    .select(`
      *,
      voucher_uses(count)
    `)
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  // Get provider's trips for specific voucher creation
  const { data: trips } = await supabase
    .from('trips')
    .select('id, title, slug')
    .eq('provider_id', provider.id)
    .eq('active', true)
    .order('title');

  // Get provider's packages
  const { data: packages } = await supabase
    .from('packages')
    .select('id, name, slug')
    .eq('provider_id', provider.id)
    .eq('active', true)
    .order('name');

  return (
    <VouchersManager
      providerId={provider.id}
      initialVouchers={vouchers || []}
      availableTrips={trips || []}
      availablePackages={packages || []}
    />
  );
}
