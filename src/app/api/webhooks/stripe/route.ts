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
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.error('No booking ID in session metadata');
    return;
  }

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

  if (!payment) return;

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
}
