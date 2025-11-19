import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MessagingInbox from '@/components/messaging/MessagingInbox';

export const metadata = {
  title: 'Messages | Provider Dashboard',
  description: 'Communicate with your customers',
};

export default async function MessagesPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Get provider
  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, email')
    .eq('user_id', user.id)
    .single();

  if (!provider) redirect('/dashboard');

  // Get conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      booking:booking_id(booking_number, trip_id, trip:trip_id(title))
    `)
    .eq('provider_id', provider.id)
    .order('last_message_at', { ascending: false });

  return (
    <MessagingInbox
      provider={provider}
      initialConversations={conversations || []}
    />
  );
}
