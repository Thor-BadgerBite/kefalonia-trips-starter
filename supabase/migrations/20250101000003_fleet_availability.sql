-- Fleet Management & Availability System Enhancement
-- This migration adds vehicle photos, enhanced availability tracking, and booking-vehicle relationships

-- Add image_urls column to vehicles table
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS primary_image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY[]::TEXT[], -- AC, WiFi, USB charging, etc.
ADD COLUMN IF NOT EXISTS license_plate VARCHAR(50),
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Add vehicle_id to bookings table to track which vehicle is assigned
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Create index on bookings for availability queries
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_time ON bookings(vehicle_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_time ON bookings(provider_id, booking_date, start_time);

-- Enhanced availability table with time slots
-- Drop and recreate with better structure
DROP TABLE IF EXISTS availability CASCADE;

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE, -- NULL means applies to all vehicles
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true, -- false = blocked/unavailable
  reason VARCHAR(255), -- 'booking', 'maintenance', 'personal', etc.
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE, -- Link to booking if blocked by booking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, date, start_time, end_time)
);

-- Indexes for availability queries
CREATE INDEX idx_availability_provider_date ON availability(provider_id, date);
CREATE INDEX idx_availability_vehicle_date ON availability(vehicle_id, date);
CREATE INDEX idx_availability_date_range ON availability(date, start_time, end_time);

-- RLS policies for availability
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their own availability"
  ON availability FOR ALL
  USING (provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view available slots"
  ON availability FOR SELECT
  USING (is_available = true);

-- Function to check if a vehicle is available for a time slot
CREATE OR REPLACE FUNCTION is_vehicle_available(
  p_vehicle_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for any conflicting unavailability or bookings
  SELECT COUNT(*) INTO conflict_count
  FROM availability
  WHERE vehicle_id = p_vehicle_id
    AND date = p_date
    AND is_available = false
    AND (
      -- Time ranges overlap
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    );

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a provider has any available vehicle for a time slot
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
BEGIN
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

-- Function to automatically block availability when a booking is created
CREATE OR REPLACE FUNCTION block_availability_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if the booking is confirmed and has time information
  IF NEW.status = 'confirmed' AND NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    -- Insert unavailability record
    INSERT INTO availability (
      provider_id,
      vehicle_id,
      date,
      start_time,
      end_time,
      is_available,
      reason,
      booking_id
    )
    VALUES (
      NEW.provider_id,
      NEW.vehicle_id,
      NEW.booking_date,
      NEW.start_time::TIME,
      NEW.end_time::TIME,
      false,
      'booking',
      NEW.id
    )
    ON CONFLICT (vehicle_id, date, start_time, end_time)
    DO UPDATE SET
      is_available = false,
      reason = 'booking',
      booking_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-block availability on booking
DROP TRIGGER IF EXISTS trigger_block_availability ON bookings;
CREATE TRIGGER trigger_block_availability
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION block_availability_on_booking();

-- Function to release availability when booking is cancelled
CREATE OR REPLACE FUNCTION release_availability_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to cancelled or rejected, remove the availability block
  IF NEW.status IN ('cancelled', 'rejected') AND OLD.status = 'confirmed' THEN
    DELETE FROM availability
    WHERE booking_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to release availability on cancellation
DROP TRIGGER IF EXISTS trigger_release_availability ON bookings;
CREATE TRIGGER trigger_release_availability
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION release_availability_on_cancel();

-- Add some common vehicle features for seeding
CREATE TABLE IF NOT EXISTS vehicle_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50), -- emoji or icon name
  description TEXT
);

INSERT INTO vehicle_features (name, icon, description) VALUES
  ('Air Conditioning', '❄️', 'Climate control for comfort'),
  ('WiFi', '📶', 'Free internet connectivity'),
  ('USB Charging', '🔌', 'USB ports for device charging'),
  ('Bluetooth Audio', '🎵', 'Connect your phone for music'),
  ('Child Seats Available', '👶', 'Baby and child car seats'),
  ('Luggage Space', '🧳', 'Ample room for suitcases'),
  ('Wheelchair Accessible', '♿', 'Accessible for wheelchair users'),
  ('Pet Friendly', '🐕', 'Pets welcome on board'),
  ('Professional Driver', '👔', 'Experienced licensed driver'),
  ('English Speaking', '🗣️', 'Driver speaks English'),
  ('Water Bottles', '💧', 'Complimentary water provided'),
  ('Refreshments', '🍬', 'Snacks and drinks available')
ON CONFLICT (name) DO NOTHING;

-- Update triggers for availability
CREATE TRIGGER update_availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE vehicles IS 'Fleet vehicles owned by providers with photos and specifications';
COMMENT ON TABLE availability IS 'Time-based availability slots for providers and vehicles';
COMMENT ON FUNCTION is_vehicle_available IS 'Check if a specific vehicle is available for a given time slot';
COMMENT ON FUNCTION provider_has_available_vehicle IS 'Check if provider has any vehicle available for time slot and capacity';
