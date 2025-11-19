import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const {
      package_id,
      provider_id,
      start_date,
      num_guests,
      customer_name,
      customer_email,
      customer_phone,
      special_requests,
      package_price,
      total_price,
      voucher_code,
      discount_amount,
    } = await request.json();

    // Validate required fields
    if (
      !package_id ||
      !provider_id ||
      !start_date ||
      !num_guests ||
      !customer_name ||
      !customer_email ||
      !customer_phone ||
      !package_price ||
      !total_price
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get package details
    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('id, name, slug')
      .eq('id', package_id)
      .eq('active', true)
      .single();

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Create package booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('package_bookings')
      .insert({
        package_id,
        provider_id,
        start_date,
        num_guests,
        customer_name,
        customer_email,
        customer_phone,
        special_requests: special_requests || null,
        package_price,
        total_price,
        voucher_code: voucher_code || null,
        discount_amount: discount_amount || 0,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(total_price * 100),
            product_data: {
              name: `Package: ${pkg.name}`,
              description: `${num_guests} guest${
                num_guests > 1 ? 's' : ''
              } • Starting ${start_date}`,
              metadata: {
                type: 'package',
                package_id: pkg.id,
                booking_id: booking.id,
              },
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=package`,
      cancel_url: `${APP_URL}/payment-canceled?booking=${booking.booking_number}&type=package`,
      customer_email: customer_email,
      metadata: {
        booking_type: 'package',
        package_booking_id: booking.id,
        booking_number: booking.booking_number,
        package_id: pkg.id,
        provider_id: provider_id,
      },
    });

    // Update booking with Stripe session ID
    await supabaseAdmin
      .from('package_bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id);

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
      checkoutUrl: session.url,
    });
  } catch (error: any) {
    console.error('Error creating package booking:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
