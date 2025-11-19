import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CustomRequestsManager from '@/components/custom-requests/CustomRequestsManager';

export const metadata = {
  title: 'Custom Trip Requests | Kefalonia Trips',
  description: 'Manage custom trip requests from clients',
};

export default async function CustomRequestsPage() {
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

  // Get all custom trip requests (pending and recent)
  const { data: requests } = await supabase
    .from('custom_trip_requests')
    .select('*')
    .in('status', ['pending', 'quoted'])
    .order('created_at', { ascending: false })
    .limit(50);

  // Get my quotes
  const { data: myQuotes } = await supabase
    .from('custom_trip_quotes')
    .select(`
      *,
      request:request_id(*)
    `)
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  // Get my vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('active', true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Custom Trip Requests</h1>
        <p className="text-gray-600 mt-2">
          Review custom trip requests from clients and submit your quotes
        </p>
      </div>

      {!provider.accepts_custom_trips && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <strong>Note:</strong> Custom trips are currently disabled for your account.
          Enable them in settings to receive requests.
        </div>
      )}

      {provider.hourly_waiting_rate === 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded">
          <strong>Reminder:</strong> Set your hourly waiting rate in settings to provide
          accurate estimates.
        </div>
      )}

      <CustomRequestsManager
        providerId={provider.id}
        providerHourlyRate={provider.hourly_waiting_rate || 0}
        availableRequests={requests || []}
        myQuotes={myQuotes || []}
        vehicles={vehicles || []}
      />
    </div>
  );
}
