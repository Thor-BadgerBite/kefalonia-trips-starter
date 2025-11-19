-- Voucher Refund Functionality
-- Restores voucher balances when bookings are refunded/cancelled

-- Override record_voucher_use to accept code instead of voucher_id (simpler API call)
CREATE OR REPLACE FUNCTION record_voucher_use(
  p_code TEXT,
  p_customer_email TEXT,
  p_booking_amount DECIMAL,
  p_booking_type TEXT,
  p_booking_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_voucher RECORD;
  v_voucher_use RECORD;
  v_discount_amount DECIMAL;
  v_value_used DECIMAL;
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
BEGIN
  -- Get voucher details
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE code = UPPER(p_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher code % not found', p_code;
  END IF;

  -- Calculate discount based on voucher type
  IF v_voucher.code_type = 'promo' THEN
    -- Promo code discount
    IF v_voucher.discount_type = 'percentage' THEN
      v_discount_amount := p_booking_amount * (v_voucher.discount_value / 100.0);
      IF v_voucher.max_discount_amount IS NOT NULL THEN
        v_discount_amount := LEAST(v_discount_amount, v_voucher.max_discount_amount);
      END IF;
    ELSE
      v_discount_amount := v_voucher.discount_value;
    END IF;
    v_value_used := NULL;
    v_balance_before := NULL;
    v_balance_after := NULL;
  ELSE
    -- Gift voucher - use remaining balance
    v_balance_before := v_voucher.remaining_value;
    v_value_used := LEAST(p_booking_amount, v_balance_before);
    v_discount_amount := v_value_used;
    v_balance_after := v_balance_before - v_value_used;
  END IF;

  -- Get booking number
  DECLARE
    v_booking_number TEXT;
    v_customer_name TEXT;
  BEGIN
    IF p_booking_type = 'package' THEN
      SELECT booking_number, customer_name INTO v_booking_number, v_customer_name
      FROM package_bookings WHERE id = p_booking_id;
    ELSE
      SELECT booking_number, customer_name INTO v_booking_number, v_customer_name
      FROM bookings WHERE id = p_booking_id;
    END IF;
  END;

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
    v_voucher.id,
    p_booking_type,
    p_booking_id,
    v_booking_number,
    p_customer_email,
    v_customer_name,
    p_booking_amount,
    v_discount_amount,
    p_booking_amount - v_discount_amount,
    v_value_used,
    v_balance_before,
    v_balance_after
  );

  -- Update voucher stats
  UPDATE vouchers
  SET
    current_uses = current_uses + 1,
    total_discount_given = total_discount_given + v_discount_amount,
    remaining_value = CASE
      WHEN code_type = 'voucher' THEN v_balance_after
      ELSE remaining_value
    END,
    -- Auto-deactivate gift voucher if balance is zero
    active = CASE
      WHEN code_type = 'voucher' AND v_balance_after <= 0 THEN false
      ELSE active
    END,
    updated_at = now()
  WHERE id = v_voucher.id;
END;
$$ LANGUAGE plpgsql;

-- Function to refund voucher on booking cancellation
CREATE OR REPLACE FUNCTION refund_voucher(
  p_booking_type TEXT,
  p_booking_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_voucher_use RECORD;
  v_voucher RECORD;
BEGIN
  -- Find the voucher use record for this booking
  SELECT * INTO v_voucher_use
  FROM voucher_uses
  WHERE booking_type = p_booking_type
    AND booking_id = p_booking_id
    AND refunded_at IS NULL;

  IF NOT FOUND THEN
    -- No voucher was used for this booking
    RETURN;
  END IF;

  -- Get voucher details
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE id = v_voucher_use.voucher_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher not found for refund';
  END IF;

  -- Mark voucher use as refunded
  UPDATE voucher_uses
  SET refunded_at = now()
  WHERE id = v_voucher_use.id;

  -- Restore voucher based on type
  IF v_voucher.code_type = 'voucher' THEN
    -- Gift voucher: restore balance and reactivate if needed
    UPDATE vouchers
    SET
      remaining_value = remaining_value + COALESCE(v_voucher_use.value_used, v_voucher_use.discount_amount),
      active = true, -- Reactivate voucher
      current_uses = GREATEST(current_uses - 1, 0),
      total_discount_given = GREATEST(total_discount_given - v_voucher_use.discount_amount, 0),
      updated_at = now()
    WHERE id = v_voucher.id;
  ELSE
    -- Promo code: decrement usage count and restore stats
    UPDATE vouchers
    SET
      current_uses = GREATEST(current_uses - 1, 0),
      total_discount_given = GREATEST(total_discount_given - v_voucher_use.discount_amount, 0),
      updated_at = now()
    WHERE id = v_voucher.id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add refunded_at column to voucher_uses if not exists
ALTER TABLE voucher_uses ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Create index for faster refund lookups
CREATE INDEX IF NOT EXISTS idx_voucher_uses_booking
  ON voucher_uses(booking_type, booking_id)
  WHERE refunded_at IS NULL;
