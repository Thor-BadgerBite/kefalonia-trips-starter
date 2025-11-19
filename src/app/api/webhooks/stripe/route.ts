import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Use service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const bookingType = session.metadata?.booking_type;

  // Handle package bookings
  if (bookingType === 'package') {
    const packageBookingId = session.metadata?.package_booking_id;

    if (!packageBookingId) {
      console.error('No package booking ID in session metadata');
      return;
    }

    // Get package booking details
    const { data: packageBooking } = await supabaseAdmin
      .from('package_bookings')
      .select('voucher_code, customer_email, total_price')
      .eq('id', packageBookingId)
      .single();

    // Update package booking status
    const { error: bookingError } = await supabaseAdmin
      .from('package_bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq('id', packageBookingId);

    if (bookingError) {
      console.error('Error updating package booking:', bookingError);
    }

    // Record voucher usage if applicable
    if (packageBooking?.voucher_code) {
      const { error: voucherError } = await supabaseAdmin.rpc('record_voucher_use', {
        p_code: packageBooking.voucher_code,
        p_customer_email: packageBooking.customer_email,
        p_booking_amount: packageBooking.total_price,
        p_booking_type: 'package',
        p_booking_id: packageBookingId,
      });

      if (voucherError) {
        console.error('Error recording voucher use:', voucherError);
      } else {
        console.log(`Recorded voucher usage: ${packageBooking.voucher_code}`);
      }
    }

    console.log(`Payment completed for package booking ${packageBookingId}`);
    return;
  }

  // Handle regular trip bookings
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.error('No booking ID in session metadata');
    return;
  }

  // Get booking details
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('voucher_code, customer_email, total_price')
    .eq('id', bookingId)
    .single();

  // Update payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .update({
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_customer_id: session.customer as string,
      status: 'succeeded',
    })
    .eq('stripe_checkout_session_id', session.id);

  if (paymentError) {
    console.error('Error updating payment:', paymentError);
  }

  // Update booking status
  const { error: bookingError } = await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'paid',
      status: 'confirmed', // Auto-confirm booking on payment
    })
    .eq('id', bookingId);

  if (bookingError) {
    console.error('Error updating booking:', bookingError);
  }

  // Record voucher usage if applicable
  if (booking?.voucher_code) {
    const { error: voucherError } = await supabaseAdmin.rpc('record_voucher_use', {
      p_code: booking.voucher_code,
      p_customer_email: booking.customer_email,
      p_booking_amount: booking.total_price,
      p_booking_type: 'trip',
      p_booking_id: bookingId,
    });

    if (voucherError) {
      console.error('Error recording voucher use:', voucherError);
    } else {
      console.log(`Recorded voucher usage: ${booking.voucher_code}`);
    }
  }

  console.log(`Payment completed for booking ${bookingId}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Get payment method details
  const paymentMethod = paymentIntent.payment_method
    ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
    : null;

  // Update payment with payment method details
  const { error } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
      payment_method_type: paymentMethod?.type,
      last4: paymentMethod?.card?.last4,
      card_brand: paymentMethod?.card?.brand,
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating payment with payment method:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { error } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'failed',
      metadata: {
        failure_code: paymentIntent.last_payment_error?.code,
        failure_message: paymentIntent.last_payment_error?.message,
      },
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating failed payment:', error);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) return;

  // Get payment record
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*, booking_id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!payment) {
    // Check if this is a package booking
    const { data: packageBooking } = await supabaseAdmin
      .from('package_bookings')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (packageBooking) {
      // Handle package booking refund
      const refundAmount = charge.amount_refunded / 100;

      // Update package booking status
      const { error: bookingError } = await supabaseAdmin
        .from('package_bookings')
        .update({
          payment_status: 'refunded',
          status: 'cancelled',
        })
        .eq('id', packageBooking.id);

      if (bookingError) {
        console.error('Error updating package booking after refund:', bookingError);
      }

      // Refund voucher if one was used
      const { error: voucherRefundError } = await supabaseAdmin.rpc('refund_voucher', {
        p_booking_type: 'package',
        p_booking_id: packageBooking.id,
      });

      if (voucherRefundError) {
        console.error('Error refunding voucher for package:', voucherRefundError);
      } else {
        console.log(`Voucher refunded for package booking ${packageBooking.id}`);
      }
    }
    return;
  }

  // Calculate refund amount (in dollars/euros)
  const refundAmount = charge.amount_refunded / 100;

  // Update payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'refunded',
      refund_amount: refundAmount,
      refund_reason: charge.refunds?.data[0]?.reason || null,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  if (paymentError) {
    console.error('Error updating refunded payment:', paymentError);
  }

  // Update booking status
  const { error: bookingError } = await supabaseAdmin
    .from('bookings')
    .update({
      payment_status: 'refunded',
      status: 'cancelled',
    })
    .eq('id', payment.booking_id);

  if (bookingError) {
    console.error('Error updating booking after refund:', bookingError);
  }

  // Refund voucher if one was used
  const { error: voucherRefundError } = await supabaseAdmin.rpc('refund_voucher', {
    p_booking_type: 'trip',
    p_booking_id: payment.booking_id,
  });

  if (voucherRefundError) {
    console.error('Error refunding voucher:', voucherRefundError);
  } else {
    console.log(`Voucher refunded for trip booking ${payment.booking_id}`);
  }
}
