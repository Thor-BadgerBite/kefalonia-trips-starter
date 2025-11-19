import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendBookingConfirmationEmail, sendProviderNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        trip:trip_id(title),
        provider:provider_id(name, email)
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const tripTitle = booking.trip?.title || 'Transfer Service';

    // Send confirmation email to customer
    const customerEmailResult = await sendBookingConfirmationEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      bookingNumber: booking.booking_number,
      tripTitle,
      providerName: booking.provider.name,
      bookingDate: booking.booking_date,
      startTime: booking.start_time || '00:00',
      numGuests: booking.num_guests,
      totalPrice: booking.total_price,
      specialRequests: booking.special_requests || undefined,
    });

    // Send notification email to provider
    const providerEmailResult = await sendProviderNotificationEmail({
      to: booking.provider.email,
      providerName: booking.provider.name,
      bookingNumber: booking.booking_number,
      customerName: booking.customer_name,
      tripTitle,
      bookingDate: booking.booking_date,
      startTime: booking.start_time || '00:00',
      numGuests: booking.num_guests,
      totalPrice: booking.total_price,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      specialRequests: booking.special_requests || undefined,
    });

    return NextResponse.json({
      success: true,
      customerEmail: customerEmailResult.success,
      providerEmail: providerEmailResult.success,
    });
  } catch (error) {
    console.error('Error sending booking emails:', error);
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    );
  }
}
