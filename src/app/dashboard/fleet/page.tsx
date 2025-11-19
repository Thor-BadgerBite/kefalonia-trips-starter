import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FleetManagement from '@/components/fleet/FleetManagement';

export const metadata = {
  title: 'Fleet Management | Kefalonia Trips',
  description: 'Manage your vehicle fleet',
};

export default async function FleetPage() {
  const supabase = createServerSupabaseClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get provider profile
  const { data: provider } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!provider) {
    redirect('/auth/login');
  }

  // Get all vehicles for this provider
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  // Get available vehicle features
  const { data: availableFeatures } = await supabase
    .from('vehicle_features')
    .select('*')
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your vehicles, add photos, and update specifications
        </p>
      </div>

      <FleetManagement
        providerId={provider.id}
        initialVehicles={vehicles || []}
        availableFeatures={availableFeatures || []}
      />
    </div>
  );
}
