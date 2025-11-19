import { NextResponse } from 'next/request';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { tripId, bookingDate, numGuests } = await request.json();

    if (!tripId || !bookingDate || !numGuests) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Calculate dynamic price using the database function
    const { data, error } = await supabaseAdmin.rpc('calculate_dynamic_price', {
      p_trip_id: tripId,
      p_booking_date: bookingDate,
      p_num_guests: parseInt(numGuests),
      p_booking_created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error calculating price:', error);
      return NextResponse.json(
        { error: 'Failed to calculate price' },
        { status: 500 }
      );
    }

    // Get base price for comparison
    const { data: trip } = await supabaseAdmin
      .from('trips')
      .select('price_amount, price_type, currency')
      .eq('id', tripId)
      .single();

    const basePrice = trip?.price_type === 'per_person'
      ? trip.price_amount * numGuests
      : trip.price_amount;

    return NextResponse.json({
      basePrice: parseFloat(basePrice || '0'),
      finalPrice: parseFloat(data || '0'),
      discount: basePrice - parseFloat(data || '0'),
      currency: trip?.currency || 'EUR',
    });
  } catch (error: any) {
    console.error('Error in calculate-price:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
