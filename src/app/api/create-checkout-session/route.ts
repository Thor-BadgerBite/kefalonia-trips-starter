import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        trip:trip_id(title, slug),
        provider:provider_id(name, slug)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if already paid
    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    const tripTitle = booking.trip?.title || 'Transfer Service';
    const providerName = booking.provider.name;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: booking.currency.toLowerCase(),
            product_data: {
              name: `${tripTitle} - ${providerName}`,
              description: `Booking #${booking.booking_number} for ${booking.num_guests} guest(s) on ${booking.booking_date}`,
              images: booking.trip?.images?.[0] ? [booking.trip.images[0]] : undefined,
            },
            unit_amount: Math.round(booking.total_price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: booking.customer_email,
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        providerId: booking.provider_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking=${booking.booking_number}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-canceled?booking=${booking.booking_number}`,
    });

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        stripe_checkout_session_id: session.id,
        amount: booking.total_price,
        currency: booking.currency,
        status: 'pending',
        customer_email: booking.customer_email,
        customer_name: booking.customer_name,
        description: `Booking #${booking.booking_number} - ${tripTitle}`,
        metadata: {
          booking_number: booking.booking_number,
          trip_title: tripTitle,
          provider_name: providerName,
        },
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}
