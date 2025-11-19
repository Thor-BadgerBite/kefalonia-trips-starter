import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const {
      conversationId,
      bookingId,
      senderType,
      senderId,
      senderName,
      senderEmail,
      content,
    } = await request.json();

    if (!content || !senderType || !senderName || !senderEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let finalConversationId = conversationId;

    // Create conversation if it doesn't exist
    if (!conversationId && bookingId) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('provider_id, customer_name, customer_email')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Check if conversation already exists
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('booking_id', bookingId)
        .single();

      if (existingConv) {
        finalConversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabaseAdmin
          .from('conversations')
          .insert({
            booking_id: bookingId,
            provider_id: booking.provider_id,
            customer_email: booking.customer_email,
            customer_name: booking.customer_name,
          })
          .select()
          .single();

        if (convError || !newConv) {
          return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 500 }
          );
        }

        finalConversationId = newConv.id;
      }
    }

    if (!finalConversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
      );
    }

    // Create message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: finalConversationId,
        sender_type: senderType,
        sender_id: senderId || null,
        sender_name: senderName,
        sender_email: senderEmail,
        content,
      })
      .select()
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      conversationId: finalConversationId,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
