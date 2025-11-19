import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Use service role for cancellations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { bookingId, reason, cancelledBy } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get booking details with trip and policy
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        trip:trip_id(
          cancellation_policy_id
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 });
    }

    // Calculate refund amount using the database function
    const { data: refundData, error: refundError } = await supabaseAdmin
      .rpc('calculate_refund_amount', {
        p_booking_id: bookingId,
        p_cancellation_time: new Date().toISOString(),
      });

    if (refundError) {
      console.error('Error calculating refund:', refundError);
    }

    const refundAmount = refundData || 0;

    // Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy || 'customer',
        cancellation_reason: reason,
        refund_amount: refundAmount,
        refund_status: refundAmount > 0 ? 'pending' : 'none',
      })
      .eq('id', bookingId);

    if (updateError) {
      throw updateError;
    }

    // Process Stripe refund if applicable
    let stripeRefundId = null;
    if (refundAmount > 0 && booking.payment_status === 'paid') {
      try {
        // Get payment record
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .select('stripe_payment_intent_id')
          .eq('booking_id', bookingId)
          .single();

        if (payment?.stripe_payment_intent_id) {
          // Create refund in Stripe
          const refund = await stripe.refunds.create({
            payment_intent: payment.stripe_payment_intent_id,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              booking_id: bookingId,
              cancelled_by: cancelledBy || 'customer',
            },
          });

          stripeRefundId = refund.id;

          // Update payment record
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'refunded',
              refund_amount: refundAmount,
              refunded_at: new Date().toISOString(),
            })
            .eq('booking_id', bookingId);

          // Update booking refund status
          await supabaseAdmin
            .from('bookings')
            .update({ refund_status: 'processed' })
            .eq('id', bookingId);
        }
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError);
        // Mark refund as failed but still cancel booking
        await supabaseAdmin
          .from('bookings')
          .update({ refund_status: 'failed' })
          .eq('id', bookingId);
      }
    }

    return NextResponse.json({
      success: true,
      refundAmount,
      stripeRefundId,
      message:
        refundAmount > 0
          ? `Booking cancelled. Refund of €${refundAmount.toFixed(2)} is being processed.`
          : 'Booking cancelled. No refund applicable based on cancellation policy.',
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking', details: error.message },
      { status: 500 }
    );
  }
}
