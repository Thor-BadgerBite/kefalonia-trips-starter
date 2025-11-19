-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Providers table (taxi operators/tour companies)
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  description TEXT,
  logo_url TEXT,
  verified BOOLEAN DEFAULT false,
  languages TEXT[] DEFAULT ARRAY['en', 'el'],
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'sedan', 'minivan', 'minibus'
  seats INTEGER NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  license_plate VARCHAR(50),
  features TEXT[], -- ['AC', 'WiFi', 'Child seat', etc.]
  images TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POIs (Points of Interest)
CREATE TABLE pois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geography type
  lat DECIMAL(10, 7) NOT NULL,
  lon DECIMAL(10, 7) NOT NULL,
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  short_desc TEXT,
  long_desc TEXT,
  images TEXT[],
  opening_hours JSONB, -- flexible JSON for hours
  entry_fee DECIMAL(10,2),
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for POIs
CREATE INDEX idx_pois_location ON pois USING GIST(location);

-- Trips table (created by providers)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_type VARCHAR(20) NOT NULL, -- 'fixed', 'per_person', 'hourly'
  price_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  seats_max INTEGER NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  languages TEXT[],
  images TEXT[],
  includes TEXT[],
  exclusions TEXT[],
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip POIs junction table (many-to-many)
CREATE TABLE trip_pois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL, -- order of visit in itinerary
  duration_at_poi INTEGER, -- minutes spent at this POI
  notes TEXT,
  UNIQUE(trip_id, poi_id)
);

CREATE INDEX idx_trip_pois_trip ON trip_pois(trip_id);
CREATE INDEX idx_trip_pois_poi ON trip_pois(poi_id);

-- Availability blocks (when providers are available)
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_provider_date ON availability(provider_id, date);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  party_size INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  pickup_location TEXT,
  pickup_coords GEOGRAPHY(POINT, 4326),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'declined', 'cancelled', 'completed'
  price_total DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  payment_method VARCHAR(50), -- 'cash', 'card', 'online'
  special_requests TEXT,
  internal_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_provider ON bookings(provider_id);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rating_comfort INTEGER CHECK (rating_comfort >= 1 AND rating_comfort <= 5),
  rating_punctuality INTEGER CHECK (rating_punctuality >= 1 AND rating_punctuality <= 5),
  rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5),
  comment TEXT,
  images TEXT[],
  provider_response TEXT,
  provider_responded_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_trip ON reviews(trip_id);
CREATE INDEX idx_reviews_provider ON reviews(provider_id);

-- Notifications table (for email/SMS tracking)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(50),
  type VARCHAR(50) NOT NULL, -- 'booking_request', 'booking_confirmed', 'booking_reminder', etc.
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'both'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_booking ON notifications(booking_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pois_updated_at BEFORE UPDATE ON pois
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'KEF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('booking_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE booking_number_seq;

CREATE TRIGGER generate_booking_number_trigger BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for POIs
CREATE POLICY "POIs are viewable by everyone" ON pois
  FOR SELECT USING (active = true);

-- Public read access for active trips
CREATE POLICY "Active trips are viewable by everyone" ON trips
  FOR SELECT USING (active = true);

-- Public read access for trip_pois
CREATE POLICY "Trip POIs are viewable by everyone" ON trip_pois
  FOR SELECT USING (true);

-- Providers can read their own data
CREATE POLICY "Providers can view own data" ON providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Providers can update own data" ON providers
  FOR UPDATE USING (auth.uid() = user_id);

-- Providers can manage their vehicles
CREATE POLICY "Providers can manage own vehicles" ON vehicles
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

-- Providers can manage their trips
CREATE POLICY "Providers can manage own trips" ON trips
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

-- Providers can manage their trip POIs
CREATE POLICY "Providers can manage own trip POIs" ON trip_pois
  FOR ALL USING (
    trip_id IN (
      SELECT id FROM trips WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- Providers can manage their availability
CREATE POLICY "Providers can manage own availability" ON availability
  FOR ALL USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

-- Providers can view their bookings
CREATE POLICY "Providers can view own bookings" ON bookings
  FOR SELECT USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

CREATE POLICY "Providers can update own bookings" ON bookings
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );

-- Anyone can create bookings (customers)
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Public read access for verified reviews
CREATE POLICY "Verified reviews are viewable by everyone" ON reviews
  FOR SELECT USING (verified = true);

-- Providers can respond to their reviews
CREATE POLICY "Providers can respond to reviews" ON reviews
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
  );
