import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WorkingHoursManager from '@/components/working-hours/WorkingHoursManager';

export const metadata = {
  title: 'Working Hours | Kefalonia Trips',
  description: 'Set your working hours and availability schedule',
};

export default async function WorkingHoursPage() {
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

  // Get all working hours for this provider
  const { data: workingHours } = await supabase
    .from('provider_working_hours')
    .select('*')
    .eq('provider_id', provider.id)
    .order('day_of_week')
    .order('start_time');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Working Hours</h1>
        <p className="text-gray-600 mt-2">
          Set your working schedule - you can add multiple time slots per day (e.g., 9:00-13:00 and 15:00-20:00)
        </p>
      </div>

      <WorkingHoursManager
        providerId={provider.id}
        initialWorkingHours={workingHours || []}
      />
    </div>
  );
}
