-- Custom Trip Builder System
-- Allows clients to create custom trips with their own POI selection and timing
-- Providers set hourly waiting rates and can accept/reject custom trip requests

-- Add hourly waiting rate to providers table
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS hourly_waiting_rate DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepts_custom_trips BOOLEAN DEFAULT true;

-- Custom trip requests table
CREATE TABLE IF NOT EXISTS custom_trip_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255) NOT NULL,
  trip_date DATE NOT NULL,
  start_time TIME NOT NULL,
  num_guests INTEGER NOT NULL CHECK (num_guests > 0),
  vehicle_type VARCHAR(50), -- preferred vehicle type
  special_requests TEXT,
  total_estimated_cost DECIMAL(10,2), -- system calculated estimate
  total_duration_minutes INTEGER, -- total trip duration
  total_distance_km DECIMAL(10,2), -- total driving distance
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom trip request POIs (the itinerary)
CREATE TABLE IF NOT EXISTS custom_trip_request_pois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES custom_trip_requests(id) ON DELETE CASCADE NOT NULL,
  poi_id UUID REFERENCES pois(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  duration_at_poi INTEGER NOT NULL DEFAULT 30, -- minutes client wants to spend here
  notes TEXT, -- client's notes for this stop
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider quotes for custom trip requests
CREATE TABLE IF NOT EXISTS custom_trip_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES custom_trip_requests(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  quoted_price DECIMAL(10,2) NOT NULL,
  estimated_price DECIMAL(10,2), -- system's automatic estimate
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  provider_notes TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until TIMESTAMPTZ, -- quote expiration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, provider_id)
);

-- Indexes
CREATE INDEX idx_custom_trip_requests_date ON custom_trip_requests(trip_date);
CREATE INDEX idx_custom_trip_requests_status ON custom_trip_requests(status);
CREATE INDEX idx_custom_trip_requests_email ON custom_trip_requests(customer_email);
CREATE INDEX idx_custom_trip_request_pois_request ON custom_trip_request_pois(request_id);
CREATE INDEX idx_custom_trip_quotes_request ON custom_trip_quotes(request_id);
CREATE INDEX idx_custom_trip_quotes_provider ON custom_trip_quotes(provider_id);

-- RLS policies
ALTER TABLE custom_trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_trip_request_pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_trip_quotes ENABLE ROW LEVEL SECURITY;

-- Public can create custom trip requests
CREATE POLICY "Anyone can create custom trip requests"
  ON custom_trip_requests FOR INSERT
  WITH CHECK (true);

-- Public can view their own requests by email (for tracking)
CREATE POLICY "Users can view their own requests"
  ON custom_trip_requests FOR SELECT
  USING (true);

-- Public can view request POIs
CREATE POLICY "Anyone can view request POIs"
  ON custom_trip_request_pois FOR SELECT
  USING (true);

-- Providers can view quotes and requests
CREATE POLICY "Providers can view all requests"
  ON custom_trip_requests FOR SELECT
  USING (true);

CREATE POLICY "Providers can manage their quotes"
  ON custom_trip_quotes FOR ALL
  USING (provider_id IN (
    SELECT id FROM providers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view quotes"
  ON custom_trip_quotes FOR SELECT
  USING (true);

-- Update triggers
CREATE TRIGGER update_custom_trip_requests_updated_at
  BEFORE UPDATE ON custom_trip_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_custom_trip_quotes_updated_at
  BEFORE UPDATE ON custom_trip_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Generate unique request number
CREATE OR REPLACE FUNCTION generate_custom_trip_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'CTR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('custom_trip_request_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS custom_trip_request_seq;

CREATE TRIGGER trigger_generate_request_number
  BEFORE INSERT ON custom_trip_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_custom_trip_request_number();

-- Function to calculate custom trip estimate for a provider
CREATE OR REPLACE FUNCTION calculate_custom_trip_estimate(
  p_request_id UUID,
  p_provider_id UUID
)
RETURNS TABLE(
  total_cost DECIMAL(10,2),
  transfer_cost DECIMAL(10,2),
  waiting_cost DECIMAL(10,2),
  total_duration_minutes INTEGER,
  total_distance_km DECIMAL(10,2)
) AS $$
DECLARE
  v_provider RECORD;
  v_total_transfer_cost DECIMAL(10,2) := 0;
  v_total_waiting_cost DECIMAL(10,2) := 0;
  v_total_waiting_minutes INTEGER := 0;
  v_total_duration INTEGER := 0;
  v_total_distance DECIMAL(10,2) := 0;
  v_poi_count INTEGER;
  v_prev_poi RECORD;
  v_curr_poi RECORD;
  v_distance DECIMAL(10,2);
  v_drive_time INTEGER;
BEGIN
  -- Get provider info
  SELECT * INTO v_provider FROM providers WHERE id = p_provider_id;

  -- Get total waiting time from all POI stops
  SELECT
    COALESCE(SUM(duration_at_poi), 0),
    COUNT(*)
  INTO v_total_waiting_minutes, v_poi_count
  FROM custom_trip_request_pois
  WHERE request_id = p_request_id;

  -- Calculate waiting cost (waiting time * hourly rate)
  v_total_waiting_cost := (v_total_waiting_minutes / 60.0) * COALESCE(v_provider.hourly_waiting_rate, 0);

  -- Calculate transfer costs and distances between POIs
  FOR v_curr_poi IN (
    SELECT ctrp.*, p.lat, p.lon, p.name
    FROM custom_trip_request_pois ctrp
    JOIN pois p ON ctrp.poi_id = p.id
    WHERE ctrp.request_id = p_request_id
    ORDER BY ctrp.order_index
  ) LOOP
    -- Add waiting time at this POI
    v_total_duration := v_total_duration + v_curr_poi.duration_at_poi;

    IF v_prev_poi IS NOT NULL THEN
      -- Calculate distance between previous and current POI (haversine formula)
      v_distance := calculate_distance_km(
        v_prev_poi.lat, v_prev_poi.lon,
        v_curr_poi.lat, v_curr_poi.lon
      );

      -- Apply road factor (1.3x for winding roads)
      v_distance := v_distance * 1.3;
      v_total_distance := v_total_distance + v_distance;

      -- Estimate drive time (40 km/h average)
      v_drive_time := CEIL((v_distance / 40.0) * 60); -- minutes
      v_total_duration := v_total_duration + v_drive_time;

      -- For transfer cost, use a simple per-km rate if no specific route exists
      -- This is a fallback - ideally we'd look up actual transfer pricelists
      -- Assuming average of €2 per km for transfers
      v_total_transfer_cost := v_total_transfer_cost + (v_distance * 2.0);
    END IF;

    v_prev_poi := v_curr_poi;
  END LOOP;

  RETURN QUERY SELECT
    v_total_transfer_cost + v_total_waiting_cost,
    v_total_transfer_cost,
    v_total_waiting_cost,
    v_total_duration,
    v_total_distance;
END;
$$ LANGUAGE plpgsql;

-- Function to find matching providers for a custom trip request
CREATE OR REPLACE FUNCTION find_providers_for_custom_trip(
  p_request_id UUID,
  p_trip_date DATE,
  p_start_time TIME,
  p_num_guests INTEGER
)
RETURNS TABLE(
  provider_id UUID,
  provider_name VARCHAR,
  estimated_cost DECIMAL(10,2),
  is_available BOOLEAN,
  is_working BOOLEAN
) AS $$
DECLARE
  v_request RECORD;
  v_end_time TIME;
BEGIN
  -- Get request details
  SELECT * INTO v_request FROM custom_trip_requests WHERE id = p_request_id;

  -- Calculate end time
  v_end_time := p_start_time + (v_request.total_duration_minutes || ' minutes')::INTERVAL;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    (SELECT total_cost FROM calculate_custom_trip_estimate(p_request_id, p.id)),
    provider_has_available_vehicle(p.id, p_trip_date, p_start_time, v_end_time::TIME, p_num_guests),
    is_provider_working_during_range(p.id, p_trip_date, p_start_time, v_end_time::TIME)
  FROM providers p
  WHERE p.accepts_custom_trips = true
    AND p.verified = true
  ORDER BY estimated_cost ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE custom_trip_requests IS 'Client-created custom trip requests with custom POI selections';
COMMENT ON TABLE custom_trip_quotes IS 'Provider quotes for custom trip requests';
COMMENT ON COLUMN providers.hourly_waiting_rate IS 'Hourly rate charged for waiting at POIs during custom trips';
COMMENT ON FUNCTION calculate_custom_trip_estimate IS 'Calculates estimated cost for a provider to fulfill a custom trip request';
COMMENT ON FUNCTION find_providers_for_custom_trip IS 'Finds available providers who can fulfill a custom trip request';
