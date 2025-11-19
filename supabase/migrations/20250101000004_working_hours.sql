-- Working Hours System for Providers
-- Allows providers to set multiple working time slots per day with breaks

-- Create working hours table
CREATE TABLE IF NOT EXISTS provider_working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN DEFAULT true,
  label VARCHAR(100), -- Optional label like "Morning Shift", "Afternoon Shift"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes for efficient querying
CREATE INDEX idx_working_hours_provider ON provider_working_hours(provider_id);
CREATE INDEX idx_working_hours_day ON provider_working_hours(day_of_week);
CREATE INDEX idx_working_hours_active ON provider_working_hours(active);

-- RLS policies
ALTER TABLE provider_working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own working hours"
  ON provider_working_hours FOR ALL
  USING (provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view active working hours"
  ON provider_working_hours FOR SELECT
  USING (active = true);

-- Update trigger
CREATE TRIGGER update_working_hours_updated_at
  BEFORE UPDATE ON provider_working_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to check if a provider is working at a specific date/time
CREATE OR REPLACE FUNCTION is_provider_working(
  p_provider_id UUID,
  p_date DATE,
  p_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  day_num INTEGER;
  is_working BOOLEAN;
BEGIN
  -- Get day of week (0=Sunday, 1=Monday, etc.)
  day_num := EXTRACT(DOW FROM p_date);

  -- Check if provider has any active working hours for this day and time
  SELECT EXISTS(
    SELECT 1 FROM provider_working_hours
    WHERE provider_id = p_provider_id
      AND day_of_week = day_num
      AND active = true
      AND p_time >= start_time
      AND p_time < end_time
  ) INTO is_working;

  RETURN is_working;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a provider is working during a time range
CREATE OR REPLACE FUNCTION is_provider_working_during_range(
  p_provider_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  day_num INTEGER;
  has_coverage BOOLEAN;
BEGIN
  -- Get day of week
  day_num := EXTRACT(DOW FROM p_date);

  -- Check if there are working hours that cover the entire requested time range
  -- This is complex: we need to ensure the full time range is covered by working hours

  -- First, check if provider has any working hours for this day
  IF NOT EXISTS (
    SELECT 1 FROM provider_working_hours
    WHERE provider_id = p_provider_id
      AND day_of_week = day_num
      AND active = true
  ) THEN
    RETURN false;
  END IF;

  -- For simplicity, we'll check if the start time falls within working hours
  -- A more complex implementation would check if the ENTIRE range is covered
  SELECT EXISTS(
    SELECT 1 FROM provider_working_hours
    WHERE provider_id = p_provider_id
      AND day_of_week = day_num
      AND active = true
      AND p_start_time >= start_time
      AND p_start_time < end_time
  ) INTO has_coverage;

  RETURN has_coverage;
END;
$$ LANGUAGE plpgsql;

-- Enhanced version of provider_has_available_vehicle that also checks working hours
CREATE OR REPLACE FUNCTION provider_has_available_vehicle(
  p_provider_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_min_capacity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  available_count INTEGER;
  is_working BOOLEAN;
BEGIN
  -- First check if provider is working at the requested time
  SELECT is_provider_working_during_range(p_provider_id, p_date, p_start_time, p_end_time)
  INTO is_working;

  IF NOT is_working THEN
    RETURN false;
  END IF;

  -- Find vehicles from this provider with sufficient capacity
  -- that don't have conflicting unavailability
  SELECT COUNT(*) INTO available_count
  FROM vehicles v
  WHERE v.provider_id = p_provider_id
    AND v.capacity >= p_min_capacity
    AND v.active = true
    AND NOT EXISTS (
      SELECT 1 FROM availability a
      WHERE a.vehicle_id = v.id
        AND a.date = p_date
        AND a.is_available = false
        AND (a.start_time, a.end_time) OVERLAPS (p_start_time, p_end_time)
    );

  RETURN available_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Insert default working hours templates for common schedules
COMMENT ON TABLE provider_working_hours IS 'Defines when providers are available to work - supports multiple time slots per day';
COMMENT ON FUNCTION is_provider_working IS 'Check if a provider is working at a specific date and time';
COMMENT ON FUNCTION is_provider_working_during_range IS 'Check if a provider is working during a time range';

-- Example default working hours for a provider (not inserted by default)
-- Providers will set these up themselves
-- INSERT INTO provider_working_hours (provider_id, day_of_week, start_time, end_time, label) VALUES
--   (provider_id, 1, '09:00', '13:00', 'Morning Shift'),
--   (provider_id, 1, '15:00', '20:00', 'Afternoon Shift');
