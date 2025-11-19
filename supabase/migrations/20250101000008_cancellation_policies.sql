-- Cancellation policies system
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Foreign key
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,

  -- Policy details
  name TEXT NOT NULL,
  description TEXT,

  -- Cancellation windows (hours before trip)
  full_refund_hours INTEGER, -- Full refund if cancelled X hours before
  partial_refund_hours INTEGER, -- Partial refund if cancelled X hours before
  partial_refund_percentage INTEGER CHECK (partial_refund_percentage >= 0 AND partial_refund_percentage <= 100),

  -- No refund after this point
  no_refund_hours INTEGER,

  -- Fees
  cancellation_fee_fixed DECIMAL(10, 2) DEFAULT 0,
  cancellation_fee_percentage INTEGER DEFAULT 0 CHECK (cancellation_fee_percentage >= 0 AND cancellation_fee_percentage <= 100),

  -- Weather/emergency exceptions
  allow_weather_cancellation BOOLEAN DEFAULT true,
  allow_emergency_cancellation BOOLEAN DEFAULT true,

  -- Status
  active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false
);

-- Add cancellation policy to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'cancellation_policy_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN cancellation_policy_id UUID REFERENCES cancellation_policies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add cancellation tracking to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE bookings ADD COLUMN cancelled_by TEXT; -- 'customer' or 'provider'
    ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT;
    ALTER TABLE bookings ADD COLUMN refund_amount DECIMAL(10, 2);
    ALTER TABLE bookings ADD COLUMN refund_status TEXT; -- 'none', 'pending', 'processed', 'failed'
  END IF;
END $$;

-- Indexes
CREATE INDEX idx_cancellation_policies_provider_id ON cancellation_policies(provider_id);
CREATE INDEX idx_cancellation_policies_active ON cancellation_policies(active);
CREATE INDEX idx_trips_cancellation_policy_id ON trips(cancellation_policy_id);
CREATE INDEX idx_bookings_cancelled_at ON bookings(cancelled_at);

-- RLS Policies
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

-- Anyone can view active cancellation policies
CREATE POLICY "Anyone can view active cancellation policies"
  ON cancellation_policies
  FOR SELECT
  USING (active = true);

-- Providers can manage their cancellation policies
CREATE POLICY "Providers can manage their cancellation policies"
  ON cancellation_policies
  FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all policies
CREATE POLICY "Service role can manage all policies"
  ON cancellation_policies
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to calculate refund amount based on policy
CREATE OR REPLACE FUNCTION calculate_refund_amount(
  p_booking_id UUID,
  p_cancellation_time TIMESTAMP WITH TIME ZONE
)
RETURNS DECIMAL AS $$
DECLARE
  v_booking RECORD;
  v_policy RECORD;
  v_hours_before INTEGER;
  v_refund_amount DECIMAL;
  v_cancellation_fee DECIMAL;
BEGIN
  -- Get booking details
  SELECT b.*, t.cancellation_policy_id, b.booking_date, b.start_time, b.total_price
  INTO v_booking
  FROM bookings b
  LEFT JOIN trips t ON t.id = b.trip_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Get cancellation policy
  SELECT *
  INTO v_policy
  FROM cancellation_policies
  WHERE id = v_booking.cancellation_policy_id;

  -- If no policy, no refund
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate hours before trip
  v_hours_before := EXTRACT(EPOCH FROM (
    (v_booking.booking_date::timestamp + v_booking.start_time::time)::timestamp - p_cancellation_time
  )) / 3600;

  -- If already past trip time, no refund
  IF v_hours_before < 0 THEN
    RETURN 0;
  END IF;

  -- Calculate base refund
  IF v_hours_before >= COALESCE(v_policy.full_refund_hours, 999999) THEN
    -- Full refund window
    v_refund_amount := v_booking.total_price;
  ELSIF v_hours_before >= COALESCE(v_policy.partial_refund_hours, 0) THEN
    -- Partial refund window
    v_refund_amount := v_booking.total_price * COALESCE(v_policy.partial_refund_percentage, 0) / 100.0;
  ELSIF v_hours_before >= COALESCE(v_policy.no_refund_hours, 0) THEN
    -- Minimal or no refund
    v_refund_amount := 0;
  ELSE
    -- Past no-refund window
    v_refund_amount := 0;
  END IF;

  -- Apply cancellation fees
  v_cancellation_fee := COALESCE(v_policy.cancellation_fee_fixed, 0) +
                        (v_booking.total_price * COALESCE(v_policy.cancellation_fee_percentage, 0) / 100.0);

  v_refund_amount := GREATEST(0, v_refund_amount - v_cancellation_fee);

  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql;

-- Create default cancellation policies for existing providers
INSERT INTO cancellation_policies (provider_id, name, description, full_refund_hours, partial_refund_hours, partial_refund_percentage, no_refund_hours, is_default)
SELECT
  id,
  'Standard Cancellation Policy',
  'Free cancellation up to 48 hours before the trip. 50% refund up to 24 hours before. No refund for cancellations within 24 hours.',
  48,
  24,
  50,
  0,
  true
FROM providers
WHERE NOT EXISTS (
  SELECT 1 FROM cancellation_policies WHERE provider_id = providers.id
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_cancellation_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cancellation_policies_timestamp
  BEFORE UPDATE ON cancellation_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_cancellation_policies_updated_at();
