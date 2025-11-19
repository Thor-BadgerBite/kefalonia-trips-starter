-- Dynamic pricing rules system
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Foreign keys
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,

  -- Rule details
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'seasonal', 'group_size', 'early_bird', 'last_minute', 'day_of_week'

  -- Priority (higher number = higher priority)
  priority INTEGER DEFAULT 0,

  -- Seasonal pricing
  start_date DATE,
  end_date DATE,

  -- Day of week pricing (array of integers 0-6, where 0 is Sunday)
  days_of_week INTEGER[],

  -- Time-based pricing
  booking_window_start INTEGER, -- hours before trip
  booking_window_end INTEGER, -- hours before trip

  -- Group size pricing
  min_guests INTEGER,
  max_guests INTEGER,

  -- Discount/Markup
  adjustment_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  adjustment_value DECIMAL(10, 2) NOT NULL, -- positive for markup, negative for discount

  -- Minimum/Maximum price constraints
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2),

  -- Status
  active BOOLEAN DEFAULT true,

  -- Combinable with other rules
  can_combine BOOLEAN DEFAULT true,

  CONSTRAINT valid_adjustment CHECK (
    (adjustment_type = 'percentage' AND adjustment_value BETWEEN -100 AND 1000) OR
    adjustment_type = 'fixed'
  )
);

-- Indexes
CREATE INDEX idx_pricing_rules_provider_id ON pricing_rules(provider_id);
CREATE INDEX idx_pricing_rules_trip_id ON pricing_rules(trip_id);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(active);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(start_date, end_date);

-- RLS Policies
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Providers can manage their pricing rules
CREATE POLICY "Providers can manage their pricing rules"
  ON pricing_rules
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

-- Anyone can view active pricing rules (for price calculation)
CREATE POLICY "Anyone can view active pricing rules"
  ON pricing_rules
  FOR SELECT
  USING (active = true);

-- Service role can manage all rules
CREATE POLICY "Service role can manage all rules"
  ON pricing_rules
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to calculate dynamic price
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
  p_trip_id UUID,
  p_booking_date DATE,
  p_num_guests INTEGER,
  p_booking_created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS DECIMAL AS $$
DECLARE
  v_base_price DECIMAL;
  v_final_price DECIMAL;
  v_rule RECORD;
  v_hours_before INTEGER;
  v_day_of_week INTEGER;
  v_adjustment DECIMAL;
BEGIN
  -- Get base price
  SELECT
    CASE
      WHEN price_type = 'per_person' THEN price_amount * p_num_guests
      ELSE price_amount
    END
  INTO v_base_price
  FROM trips
  WHERE id = p_trip_id;

  IF v_base_price IS NULL THEN
    RETURN 0;
  END IF;

  v_final_price := v_base_price;

  -- Calculate hours before trip
  v_hours_before := EXTRACT(EPOCH FROM (p_booking_date::timestamp - p_booking_created_at)) / 3600;

  -- Get day of week (0 = Sunday)
  v_day_of_week := EXTRACT(DOW FROM p_booking_date);

  -- Apply pricing rules in priority order
  FOR v_rule IN
    SELECT *
    FROM pricing_rules
    WHERE active = true
      AND (trip_id = p_trip_id OR trip_id IS NULL)
      AND (
        (rule_type = 'seasonal' AND p_booking_date BETWEEN COALESCE(start_date, p_booking_date) AND COALESCE(end_date, p_booking_date))
        OR (rule_type = 'day_of_week' AND v_day_of_week = ANY(days_of_week))
        OR (rule_type = 'early_bird' AND v_hours_before >= COALESCE(booking_window_start, 0) AND v_hours_before <= COALESCE(booking_window_end, 999999))
        OR (rule_type = 'last_minute' AND v_hours_before >= COALESCE(booking_window_start, 0) AND v_hours_before <= COALESCE(booking_window_end, 999999))
        OR (rule_type = 'group_size' AND p_num_guests >= COALESCE(min_guests, 0) AND p_num_guests <= COALESCE(max_guests, 999))
      )
    ORDER BY priority DESC
  LOOP
    -- Calculate adjustment
    IF v_rule.adjustment_type = 'percentage' THEN
      v_adjustment := v_final_price * v_rule.adjustment_value / 100.0;
    ELSE
      v_adjustment := v_rule.adjustment_value;
    END IF;

    -- Apply adjustment
    IF v_rule.can_combine THEN
      v_final_price := v_final_price + v_adjustment;
    ELSE
      v_final_price := v_base_price + v_adjustment;
    END IF;

    -- Apply min/max constraints
    IF v_rule.min_price IS NOT NULL THEN
      v_final_price := GREATEST(v_final_price, v_rule.min_price);
    END IF;

    IF v_rule.max_price IS NOT NULL THEN
      v_final_price := LEAST(v_final_price, v_rule.max_price);
    END IF;
  END LOOP;

  -- Ensure price doesn't go below 0
  v_final_price := GREATEST(v_final_price, 0);

  RETURN v_final_price;
END;
$$ LANGUAGE plpgsql;

-- Create some default pricing rules for existing providers
INSERT INTO pricing_rules (provider_id, name, description, rule_type, adjustment_type, adjustment_value, priority, active)
SELECT DISTINCT
  p.id,
  'High Season Markup',
  'Price increase during peak summer months',
  'seasonal',
  'percentage',
  20,
  10,
  false -- Disabled by default
FROM providers p
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_rules WHERE provider_id = p.id
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_rules_timestamp
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_rules_updated_at();
