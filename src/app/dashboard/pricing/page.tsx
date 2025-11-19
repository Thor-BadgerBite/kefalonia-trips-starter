import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PricingRulesManager from '@/components/pricing/PricingRulesManager';

export const metadata = {
  title: 'Pricing Rules | Provider Dashboard',
  description: 'Manage dynamic pricing rules for your trips',
};

export default async function PricingPage() {
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

  // Get pricing rules
  const { data: pricingRules } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('provider_id', provider.id)
    .order('priority', { ascending: false });

  // Get trips for rule assignment
  const { data: trips } = await supabase
    .from('trips')
    .select('id, title, slug')
    .eq('provider_id', provider.id)
    .eq('active', true);

  return (
    <PricingRulesManager
      providerId={provider.id}
      initialRules={pricingRules || []}
      trips={trips || []}
    />
  );
}
