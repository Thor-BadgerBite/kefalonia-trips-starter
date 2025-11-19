-- POI Stop Types (predefined categories for what happens at a POI during a trip)
CREATE TABLE poi_stop_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) NOT NULL, -- emoji or icon name
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default stop types
INSERT INTO poi_stop_types (name, slug, icon, description) VALUES
  ('Photo Shoot', 'photo-shoot', '📸', 'Quick stop for photos and scenic views'),
  ('Free Time', 'free-time', '⏰', 'Unstructured exploration time'),
  ('Shopping Stop', 'shopping-stop', '🛍️', 'Browse local shops and markets'),
  ('Museum Visit', 'museum-visit', '🏛️', 'Guided or self-guided museum tour'),
  ('Beach Stop', 'beach-stop', '🏖️', 'Beach relaxation and sunbathing'),
  ('Swim Stop', 'swim-stop', '🏊', 'Swimming and water activities'),
  ('Monastery Visit', 'monastery-visit', '⛪', 'Religious site visit'),
  ('Restaurant Break', 'restaurant-break', '🍽️', 'Meal or refreshment stop'),
  ('Viewpoint', 'viewpoint', '👁️', 'Scenic overlook'),
  ('Wine Tasting', 'wine-tasting', '🍷', 'Local winery visit');

-- Transfer Regions (areas in Kefalonia for transfer pricing)
CREATE TABLE transfer_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  area_type VARCHAR(50), -- 'accommodation', 'airport', 'port', 'village', 'beach'
  lat DECIMAL(10, 7),
  lon DECIMAL(10, 7),
  location GEOGRAPHY(POINT, 4326),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Kefalonia regions
INSERT INTO transfer_regions (name, slug, area_type, lat, lon) VALUES
  ('Minies', 'minies', 'village', 38.1950, 20.4850),
  ('Spilia', 'spilia', 'village', 38.1820, 20.4720),
  ('Svoronata', 'svoronata', 'village', 38.1515, 20.4725),
  ('Lakithra', 'lakithra', 'village', 38.1445, 20.5105),
  ('Lassi', 'lassi', 'accommodation', 38.1650, 20.4650),
  ('Argostoli', 'argostoli', 'accommodation', 38.1742, 20.4911),
  ('Karavados', 'karavados', 'village', 38.1285, 20.4815),
  ('Spartia', 'spartia', 'village', 38.1125, 20.4985),
  ('Pessada', 'pessada', 'port', 38.0975, 20.4685),
  ('Trapezaki', 'trapezaki', 'beach', 38.1055, 20.5325),
  ('Lourdas', 'lourdas', 'beach', 38.0885, 20.5455),
  ('Katelios', 'katelios', 'village', 38.0615, 20.5645),
  ('Agia Efimia', 'agia-efimia', 'accommodation', 38.3002, 20.6002),
  ('Sami', 'sami', 'port', 38.2476, 20.6486),
  ('Karavomilos', 'karavomilos', 'village', 38.2525, 20.6125),
  ('Skala', 'skala', 'accommodation', 38.0685, 20.6155),
  ('Lixouri', 'lixouri', 'accommodation', 38.2045, 20.4355),
  ('Poros', 'poros', 'port', 38.1955, 20.7525),
  ('Assos', 'assos', 'village', 38.3785, 20.5453),
  ('Xi Beach', 'xi', 'beach', 38.1445, 20.4521),
  ('Fiskardo', 'fiskardo', 'accommodation', 38.4568, 20.5776),
  ('Kefalonia Airport', 'kefalonia-airport', 'airport', 38.1201, 20.5003);

-- Update location geography
UPDATE transfer_regions SET location = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography WHERE lat IS NOT NULL;

-- Transfer Pricelists (provider's point-to-point transfer rates)
CREATE TABLE transfer_pricelists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  from_region_id UUID REFERENCES transfer_regions(id) ON DELETE CASCADE,
  to_region_id UUID REFERENCES transfer_regions(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) NOT NULL,
  price_type VARCHAR(20) NOT NULL, -- 'per_route', 'per_person', 'per_hour'
  price_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  max_passengers INTEGER,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, from_region_id, to_region_id, vehicle_type)
);

CREATE INDEX idx_transfer_pricelists_provider ON transfer_pricelists(provider_id);
CREATE INDEX idx_transfer_pricelists_from ON transfer_pricelists(from_region_id);
CREATE INDEX idx_transfer_pricelists_to ON transfer_pricelists(to_region_id);

-- Provider POI Templates (reusable POI configurations)
CREATE TABLE provider_poi_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
  stop_type_id UUID REFERENCES poi_stop_types(id) ON DELETE SET NULL,
  custom_name VARCHAR(255), -- e.g., "Myrtos Photo Shoot"
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  images TEXT[], -- photos of the place + social photos from clients
  tips TEXT, -- provider tips for this stop
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_poi_templates_provider ON provider_poi_templates(provider_id);
CREATE INDEX idx_provider_poi_templates_poi ON provider_poi_templates(poi_id);

-- Update trip_pois to include rich stop details
ALTER TABLE trip_pois ADD COLUMN stop_type_id UUID REFERENCES poi_stop_types(id) ON DELETE SET NULL;
ALTER TABLE trip_pois ADD COLUMN custom_stop_name VARCHAR(255);
ALTER TABLE trip_pois ADD COLUMN stop_description TEXT;
ALTER TABLE trip_pois ADD COLUMN stop_images TEXT[];
ALTER TABLE trip_pois ADD COLUMN provider_tips TEXT;

-- Add calculated fields to trips
ALTER TABLE trips ADD COLUMN total_duration_calculated INTEGER; -- auto-calculated total time
ALTER TABLE trips ADD COLUMN total_distance_km DECIMAL(10,2); -- total driving distance

-- RLS Policies for new tables

ALTER TABLE poi_stop_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stop types are viewable by everyone" ON poi_stop_types FOR SELECT USING (true);

ALTER TABLE transfer_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transfer regions are viewable by everyone" ON transfer_regions FOR SELECT USING (active = true);

ALTER TABLE transfer_pricelists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active transfer pricelists are viewable by everyone" ON transfer_pricelists
  FOR SELECT USING (active = true);

CREATE POLICY "Providers can manage own transfer pricelists" ON transfer_pricelists
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

ALTER TABLE provider_poi_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage own POI templates" ON provider_poi_templates
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_transfer_pricelists_updated_at BEFORE UPDATE ON transfer_pricelists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_poi_templates_updated_at BEFORE UPDATE ON provider_poi_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate driving distance between two points (rough estimate)
CREATE OR REPLACE FUNCTION calculate_drive_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  distance_km DECIMAL;
BEGIN
  -- Calculate straight-line distance and multiply by 1.3 for road factor
  distance_km := ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  ) / 1000.0 * 1.3;

  RETURN ROUND(distance_km, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to estimate drive time (minutes) based on distance
-- Assumes average 40 km/h (realistic for Kefalonia's mountain roads)
CREATE OR REPLACE FUNCTION calculate_drive_time(distance_km DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  RETURN CEIL((distance_km / 40.0) * 60);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate trip duration based on POIs
CREATE OR REPLACE FUNCTION calculate_trip_duration(trip_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_stop_time INTEGER;
  total_drive_time INTEGER;
  poi_record RECORD;
  prev_lat DECIMAL;
  prev_lon DECIMAL;
BEGIN
  -- Sum all stop durations
  SELECT COALESCE(SUM(duration_at_poi), 0) INTO total_stop_time
  FROM trip_pois
  WHERE trip_id = trip_uuid;

  -- Calculate drive time between POIs
  total_drive_time := 0;
  prev_lat := NULL;

  FOR poi_record IN
    SELECT p.lat, p.lon
    FROM trip_pois tp
    JOIN pois p ON tp.poi_id = p.id
    WHERE tp.trip_id = trip_uuid
    ORDER BY tp.order_index
  LOOP
    IF prev_lat IS NOT NULL THEN
      total_drive_time := total_drive_time + calculate_drive_time(
        calculate_drive_distance(prev_lat, prev_lon, poi_record.lat, poi_record.lon)
      );
    END IF;

    prev_lat := poi_record.lat;
    prev_lon := poi_record.lon;
  END LOOP;

  RETURN total_stop_time + total_drive_time;
END;
$$ LANGUAGE plpgsql;
