import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'Kefalonia Trips <bookings@kefalonia-trips.com>';

interface BookingConfirmationEmailProps {
  to: string;
  customerName: string;
  bookingNumber: string;
  tripTitle: string;
  providerName: string;
  bookingDate: string;
  startTime: string;
  numGuests: number;
  totalPrice: number;
  specialRequests?: string;
}

export async function sendBookingConfirmationEmail(props: BookingConfirmationEmailProps) {
  const {
    to,
    customerName,
    bookingNumber,
    tripTitle,
    providerName,
    bookingDate,
    startTime,
    numGuests,
    totalPrice,
    specialRequests,
  } = props;

  const formattedDate = new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Booking Confirmation - ${bookingNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .booking-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-label { color: #6b7280; }
              .detail-value { font-weight: bold; }
              .price { font-size: 24px; color: #2563eb; font-weight: bold; }
              .button { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .success-icon { width: 60px; height: 60px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">
                  <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
                <h1>Booking Confirmed!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for choosing Kefalonia Trips</p>
              </div>

              <div class="content">
                <p>Dear ${customerName},</p>

                <p>Your booking has been successfully submitted! Your provider will review and confirm your booking within 24 hours.</p>

                <div class="booking-details">
                  <h2 style="margin-top: 0;">Booking Details</h2>

                  <div class="detail-row">
                    <span class="detail-label">Booking Number:</span>
                    <span class="detail-value">${bookingNumber}</span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Trip:</span>
                    <span class="detail-value">${tripTitle}</span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Provider:</span>
                    <span class="detail-value">${providerName}</span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formattedDate}</span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${startTime}</span>
                  </div>

                  <div class="detail-row">
                    <span class="detail-label">Guests:</span>
                    <span class="detail-value">${numGuests}</span>
                  </div>

                  <div class="detail-row" style="border-bottom: none; padding-top: 20px;">
                    <span class="detail-label">Total Price:</span>
                    <span class="price">€${totalPrice}</span>
                  </div>
                </div>

                ${specialRequests ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>Your Special Requests:</strong>
                    <p style="margin: 10px 0 0 0;">${specialRequests}</p>
                  </div>
                ` : ''}

                <h3>What's Next?</h3>
                <ol style="padding-left: 20px;">
                  <li>The provider will review your booking request</li>
                  <li>You'll receive a confirmation email when approved</li>
                  <li>Payment instructions will be included in the confirmation</li>
                  <li>Enjoy your amazing Kefalonia experience!</li>
                </ol>

                <p style="margin-top: 30px;">
                  <strong>Need Help?</strong><br>
                  Contact ${providerName} directly or visit our website for support.
                </p>
              </div>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Kefalonia Trips. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return { success: false, error };
  }
}

interface ProviderNotificationEmailProps {
  to: string;
  providerName: string;
  bookingNumber: string;
  customerName: string;
  tripTitle: string;
  bookingDate: string;
  startTime: string;
  numGuests: number;
  totalPrice: number;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
}

export async function sendProviderNotificationEmail(props: ProviderNotificationEmailProps) {
  const {
    to,
    providerName,
    bookingNumber,
    customerName,
    tripTitle,
    bookingDate,
    startTime,
    numGuests,
    totalPrice,
    customerEmail,
    customerPhone,
    specialRequests,
  } = props;

  const formattedDate = new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `New Booking Request - ${bookingNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .booking-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .button { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔔 New Booking Request</h1>
                <p>Action required - Review and confirm</p>
              </div>

              <div class="content">
                <p>Dear ${providerName},</p>

                <p><strong>You have received a new booking request!</strong></p>

                <div class="booking-details">
                  <h2 style="margin-top: 0;">Booking: ${bookingNumber}</h2>

                  <div class="detail-row"><strong>Trip:</strong> ${tripTitle}</div>
                  <div class="detail-row"><strong>Date:</strong> ${formattedDate}</div>
                  <div class="detail-row"><strong>Time:</strong> ${startTime}</div>
                  <div class="detail-row"><strong>Guests:</strong> ${numGuests}</div>
                  <div class="detail-row"><strong>Price:</strong> €${totalPrice}</div>
                </div>

                <div class="booking-details">
                  <h3>Customer Information</h3>
                  <div class="detail-row"><strong>Name:</strong> ${customerName}</div>
                  <div class="detail-row"><strong>Email:</strong> ${customerEmail}</div>
                  <div class="detail-row"><strong>Phone:</strong> ${customerPhone}</div>
                </div>

                ${specialRequests ? `
                  <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>Special Requests:</strong>
                    <p style="margin: 10px 0 0 0;">${specialRequests}</p>
                  </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/bookings" class="button">
                    View in Dashboard
                  </a>
                </div>

                <p><strong>Next Steps:</strong></p>
                <ol>
                  <li>Log in to your dashboard</li>
                  <li>Review the booking details</li>
                  <li>Confirm or reject the booking</li>
                  <li>Assign a vehicle if confirmed</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send provider notification email:', error);
    return { success: false, error };
  }
}

interface CustomTripQuoteEmailProps {
  to: string;
  customerName: string;
  requestNumber: string;
  providerName: string;
  quotedPrice: number;
  estimatedPrice: number;
  providerNotes?: string;
}

export async function sendCustomTripQuoteEmail(props: CustomTripQuoteEmailProps) {
  const {
    to,
    customerName,
    requestNumber,
    providerName,
    quotedPrice,
    estimatedPrice,
    providerNotes,
  } = props;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Quote Received for ${requestNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .quote-box { background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .price { font-size: 36px; color: #10b981; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📋 Quote Received!</h1>
                <p>${providerName} has sent you a quote</p>
              </div>

              <div class="content">
                <p>Dear ${customerName},</p>

                <p>Good news! ${providerName} has reviewed your custom trip request and sent you a quote.</p>

                <div class="quote-box">
                  <h2 style="margin: 0 0 10px 0;">Quoted Price</h2>
                  <div class="price">€${quotedPrice}</div>
                  ${estimatedPrice !== quotedPrice ? `<p style="color: #6b7280; margin-top: 10px;">System estimate was €${estimatedPrice}</p>` : ''}
                </div>

                ${providerNotes ? `
                  <div style="background: #f9fafb; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <strong>Provider's Message:</strong>
                    <p style="margin: 10px 0 0 0;">${providerNotes}</p>
                  </div>
                ` : ''}

                <p><strong>Request Number:</strong> ${requestNumber}</p>

                <p>To accept this quote and proceed with booking, please contact ${providerName} directly or reply to this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send custom trip quote email:', error);
    return { success: false, error };
  }
}
