-- Payments table for tracking Stripe transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Foreign keys
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,

  -- Stripe details
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, succeeded, failed, canceled, refunded

  -- Payment method
  payment_method_type TEXT, -- card, ideal, etc.
  last4 TEXT, -- last 4 digits of card
  card_brand TEXT, -- visa, mastercard, etc.

  -- Metadata
  customer_email TEXT,
  customer_name TEXT,
  description TEXT,
  metadata JSONB,

  -- Refund info
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Providers can view payments for their bookings
CREATE POLICY "Providers can view their booking payments"
  ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = payments.booking_id
      AND b.provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- System can insert/update payments
CREATE POLICY "Service role can manage all payments"
  ON payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add payment_status column to bookings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
    ALTER TABLE bookings ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on payment_status
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();
