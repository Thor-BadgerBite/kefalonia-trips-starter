import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendCustomTripQuoteEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { quoteId } = await request.json();

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get quote details with related data
    const { data: quote, error: quoteError } = await supabase
      .from('custom_trip_quotes')
      .select(
        `
        *,
        request:request_id(request_number, customer_name, customer_email),
        provider:provider_id(name)
      `
      )
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Send quote email to customer
    const emailResult = await sendCustomTripQuoteEmail({
      to: quote.request.customer_email,
      customerName: quote.request.customer_name,
      requestNumber: quote.request.request_number,
      providerName: quote.provider.name,
      quotedPrice: quote.quoted_price,
      estimatedPrice: quote.estimated_price || quote.quoted_price,
      providerNotes: quote.provider_notes || undefined,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send quote email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending quote email:', error);
    return NextResponse.json(
      { error: 'Failed to send quote email' },
      { status: 500 }
    );
  }
}
