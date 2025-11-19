import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const {
      code,
      customer_email,
      booking_amount,
      provider_id,
      trip_id,
      package_id,
    } = await request.json();

    if (!code || !customer_email || !booking_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call database function to validate and calculate discount
    const { data, error } = await supabaseAdmin.rpc('apply_voucher', {
      p_code: code.toUpperCase(),
      p_customer_email: customer_email,
      p_booking_amount: booking_amount,
      p_provider_id: provider_id || null,
      p_trip_id: trip_id || null,
      p_package_id: package_id || null,
    });

    if (error) {
      console.error('Error validating voucher:', error);
      return NextResponse.json(
        { error: 'Failed to validate voucher' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in voucher validation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
