-- Gift vouchers and promo codes system
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Code
  code TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL CHECK (code_type IN ('voucher', 'promo')), -- 'voucher' for gift cards, 'promo' for discounts

  -- Provider (NULL for platform-wide promos)
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,

  -- Discount details
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),

  -- For gift vouchers - original purchase value
  original_value DECIMAL(10,2), -- Only for vouchers
  remaining_value DECIMAL(10,2), -- Only for vouchers

  -- Minimum purchase requirements
  min_purchase_amount DECIMAL(10,2),

  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Usage limits
  max_uses INTEGER, -- NULL = unlimited
  max_uses_per_customer INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,

  -- Restrictions
  applicable_to TEXT, -- 'all', 'trips', 'packages', 'transfers'
  specific_trip_ids UUID[], -- Specific trips this code applies to
  specific_package_ids UUID[], -- Specific packages this code applies to

  -- Status
  active BOOLEAN DEFAULT true,

  -- Gift voucher specific fields
  purchaser_name TEXT, -- Who bought the voucher
  purchaser_email TEXT,
  recipient_name TEXT, -- Who the voucher is for
  recipient_email TEXT,
  gift_message TEXT,

  -- Stats
  total_discount_given DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  description TEXT,
  internal_notes TEXT -- For provider use only
);

-- Voucher usage tracking
CREATE TABLE IF NOT EXISTS voucher_uses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE NOT NULL,

  -- Booking reference
  booking_type TEXT NOT NULL CHECK (booking_type IN ('trip', 'package', 'transfer')),
  booking_id UUID, -- References bookings, package_bookings, or transfer_bookings
  booking_number TEXT NOT NULL,

  -- Customer info
  customer_email TEXT NOT NULL,
  customer_name TEXT,

  -- Discount applied
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,

  -- For gift vouchers - track remaining balance
  value_used DECIMAL(10,2),
  balance_before DECIMAL(10,2),
  balance_after DECIMAL(10,2)
);

-- Indexes
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_provider_id ON vouchers(provider_id);
CREATE INDEX idx_vouchers_code_type ON vouchers(code_type);
CREATE INDEX idx_vouchers_active ON vouchers(active);
CREATE INDEX idx_vouchers_valid_dates ON vouchers(valid_from, valid_until);

CREATE INDEX idx_voucher_uses_voucher_id ON voucher_uses(voucher_id);
CREATE INDEX idx_voucher_uses_booking_number ON voucher_uses(booking_number);
CREATE INDEX idx_voucher_uses_customer_email ON voucher_uses(customer_email);

-- RLS Policies
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_uses ENABLE ROW LEVEL SECURITY;

-- Anyone can view active vouchers to validate codes
CREATE POLICY "Anyone can view active vouchers"
  ON vouchers
  FOR SELECT
  USING (active = true AND (valid_until IS NULL OR valid_until > now()));

-- Providers can manage their vouchers
CREATE POLICY "Providers can view their vouchers"
  ON vouchers
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create vouchers"
  ON vouchers
  FOR INSERT
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their vouchers"
  ON vouchers
  FOR UPDATE
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

CREATE POLICY "Providers can delete their vouchers"
  ON vouchers
  FOR DELETE
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Providers can view usage of their vouchers
CREATE POLICY "Providers can view their voucher uses"
  ON voucher_uses
  FOR SELECT
  USING (
    voucher_id IN (
      SELECT id FROM vouchers
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can manage all
CREATE POLICY "Service role can manage all vouchers"
  ON vouchers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all voucher_uses"
  ON voucher_uses
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to validate and apply voucher
CREATE OR REPLACE FUNCTION apply_voucher(
  p_code TEXT,
  p_customer_email TEXT,
  p_booking_amount DECIMAL,
  p_provider_id UUID DEFAULT NULL,
  p_trip_id UUID DEFAULT NULL,
  p_package_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_voucher RECORD;
  v_discount_amount DECIMAL;
  v_final_amount DECIMAL;
  v_customer_uses INTEGER;
  v_value_to_use DECIMAL;
  v_balance_after DECIMAL;
BEGIN
  -- Get voucher
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE code = UPPER(p_code)
    AND active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now())
    AND (provider_id IS NULL OR provider_id = p_provider_id);

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid or expired code'
    );
  END IF;

  -- Check max uses
  IF v_voucher.max_uses IS NOT NULL AND v_voucher.current_uses >= v_voucher.max_uses THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Code has reached maximum uses'
    );
  END IF;

  -- Check customer usage
  SELECT COUNT(*) INTO v_customer_uses
  FROM voucher_uses
  WHERE voucher_id = v_voucher.id
    AND customer_email = p_customer_email;

  IF v_customer_uses >= v_voucher.max_uses_per_customer THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'You have already used this code the maximum number of times'
    );
  END IF;

  -- Check minimum purchase
  IF v_voucher.min_purchase_amount IS NOT NULL AND p_booking_amount < v_voucher.min_purchase_amount THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Minimum purchase amount not met',
      'min_amount', v_voucher.min_purchase_amount
    );
  END IF;

  -- Check applicable_to restrictions
  IF v_voucher.applicable_to = 'trips' AND p_trip_id IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Code only valid for trips');
  END IF;

  IF v_voucher.applicable_to = 'packages' AND p_package_id IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Code only valid for packages');
  END IF;

  -- Check specific trip/package restrictions
  IF v_voucher.specific_trip_ids IS NOT NULL AND NOT (p_trip_id = ANY(v_voucher.specific_trip_ids)) THEN
    RETURN json_build_object('valid', false, 'error', 'Code not valid for this trip');
  END IF;

  IF v_voucher.specific_package_ids IS NOT NULL AND NOT (p_package_id = ANY(v_voucher.specific_package_ids)) THEN
    RETURN json_build_object('valid', false, 'error', 'Code not valid for this package');
  END IF;

  -- Calculate discount
  IF v_voucher.code_type = 'voucher' THEN
    -- Gift voucher - use remaining value
    v_value_to_use := LEAST(v_voucher.remaining_value, p_booking_amount);
    v_discount_amount := v_value_to_use;
    v_balance_after := v_voucher.remaining_value - v_value_to_use;
  ELSE
    -- Promo code - calculate percentage or fixed discount
    IF v_voucher.discount_type = 'percentage' THEN
      v_discount_amount := ROUND(p_booking_amount * v_voucher.discount_value / 100, 2);
    ELSE
      v_discount_amount := LEAST(v_voucher.discount_value, p_booking_amount);
    END IF;
    v_value_to_use := NULL;
    v_balance_after := NULL;
  END IF;

  v_final_amount := p_booking_amount - v_discount_amount;

  -- Return validation result
  RETURN json_build_object(
    'valid', true,
    'voucher_id', v_voucher.id,
    'code_type', v_voucher.code_type,
    'discount_type', v_voucher.discount_type,
    'discount_value', v_voucher.discount_value,
    'discount_amount', v_discount_amount,
    'original_amount', p_booking_amount,
    'final_amount', v_final_amount,
    'value_used', v_value_to_use,
    'balance_before', v_voucher.remaining_value,
    'balance_after', v_balance_after
  );
END;
$$ LANGUAGE plpgsql;

-- Function to record voucher use (called after successful booking)
CREATE OR REPLACE FUNCTION record_voucher_use(
  p_voucher_id UUID,
  p_booking_type TEXT,
  p_booking_id UUID,
  p_booking_number TEXT,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_original_amount DECIMAL,
  p_discount_amount DECIMAL,
  p_final_amount DECIMAL,
  p_value_used DECIMAL DEFAULT NULL,
  p_balance_before DECIMAL DEFAULT NULL,
  p_balance_after DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Record usage
  INSERT INTO voucher_uses (
    voucher_id,
    booking_type,
    booking_id,
    booking_number,
    customer_email,
    customer_name,
    original_amount,
    discount_amount,
    final_amount,
    value_used,
    balance_before,
    balance_after
  ) VALUES (
    p_voucher_id,
    p_booking_type,
    p_booking_id,
    p_booking_number,
    p_customer_email,
    p_customer_name,
    p_original_amount,
    p_discount_amount,
    p_final_amount,
    p_value_used,
    p_balance_before,
    p_balance_after
  );

  -- Update voucher stats
  UPDATE vouchers
  SET
    current_uses = current_uses + 1,
    total_discount_given = total_discount_given + p_discount_amount,
    remaining_value = CASE
      WHEN code_type = 'voucher' THEN p_balance_after
      ELSE remaining_value
    END,
    -- Auto-deactivate gift voucher if balance is zero
    active = CASE
      WHEN code_type = 'voucher' AND p_balance_after <= 0 THEN false
      ELSE active
    END,
    updated_at = now()
  WHERE id = p_voucher_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code(p_prefix TEXT DEFAULT 'GIFT')
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random alphanumeric code
    v_code := p_prefix || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM vouchers WHERE code = v_code) INTO v_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for vouchers updated_at
CREATE OR REPLACE FUNCTION update_vouchers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vouchers_timestamp
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_vouchers_updated_at();
