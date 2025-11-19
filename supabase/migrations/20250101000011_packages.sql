-- Package deals and bundles system
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Provider
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,

  -- Package details
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  highlights TEXT[],

  -- Pricing
  original_price DECIMAL(10,2) NOT NULL, -- Sum of individual trip prices
  package_price DECIMAL(10,2) NOT NULL, -- Discounted package price
  discount_percentage INTEGER GENERATED ALWAYS AS (
    ROUND(((original_price - package_price) / NULLIF(original_price, 0) * 100)::numeric, 0)::integer
  ) STORED,

  -- Validity
  valid_from DATE,
  valid_until DATE,

  -- Settings
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  max_bookings INTEGER, -- Limit total package bookings
  min_guests INTEGER DEFAULT 1,
  max_guests INTEGER,

  -- Metadata
  total_duration_hours INTEGER, -- Calculated from trips
  includes_transfers BOOLEAN DEFAULT false,

  -- Stats (denormalized for performance)
  total_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  -- Media
  cover_image TEXT,
  images TEXT[],

  CONSTRAINT unique_package_slug_per_provider UNIQUE (provider_id, slug),
  CONSTRAINT valid_package_price CHECK (package_price > 0 AND package_price <= original_price)
);

-- Junction table for package trips
CREATE TABLE IF NOT EXISTS package_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,

  -- Order of trips in the package
  trip_order INTEGER NOT NULL DEFAULT 0,

  -- Optional: Specific day offset for multi-day packages
  day_offset INTEGER DEFAULT 0,

  CONSTRAINT unique_trip_per_package UNIQUE (package_id, trip_id)
);

-- Package bookings
CREATE TABLE IF NOT EXISTS package_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Package and provider
  package_id UUID REFERENCES packages(id) ON DELETE RESTRICT NOT NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE RESTRICT NOT NULL,

  -- Booking details
  booking_number TEXT NOT NULL UNIQUE,

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  num_guests INTEGER NOT NULL,

  -- Dates
  start_date DATE NOT NULL,

  -- Pricing
  package_price DECIMAL(10,2) NOT NULL, -- Price at time of booking
  total_price DECIMAL(10,2) NOT NULL, -- May include guest adjustments

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'failed'

  -- Payment info
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Special requests
  special_requests TEXT,

  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by TEXT,
  refund_amount DECIMAL(10,2),

  CONSTRAINT valid_num_guests CHECK (num_guests > 0)
);

-- Individual trip bookings within package booking
CREATE TABLE IF NOT EXISTS package_booking_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  package_booking_id UUID REFERENCES package_bookings(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE RESTRICT NOT NULL,

  -- Scheduled date/time for this specific trip
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,

  -- Status for individual trip
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'

  -- Assignment
  assigned_vehicle_id UUID REFERENCES vehicles(id),
  assigned_driver TEXT,

  -- Notes
  notes TEXT
);

-- Indexes
CREATE INDEX idx_packages_provider_id ON packages(provider_id);
CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_active ON packages(active);
CREATE INDEX idx_packages_featured ON packages(featured);
CREATE INDEX idx_packages_valid_dates ON packages(valid_from, valid_until);

CREATE INDEX idx_package_trips_package_id ON package_trips(package_id);
CREATE INDEX idx_package_trips_trip_id ON package_trips(trip_id);

CREATE INDEX idx_package_bookings_package_id ON package_bookings(package_id);
CREATE INDEX idx_package_bookings_provider_id ON package_bookings(provider_id);
CREATE INDEX idx_package_bookings_booking_number ON package_bookings(booking_number);
CREATE INDEX idx_package_bookings_customer_email ON package_bookings(customer_email);
CREATE INDEX idx_package_bookings_status ON package_bookings(status);
CREATE INDEX idx_package_bookings_start_date ON package_bookings(start_date);

CREATE INDEX idx_package_booking_trips_package_booking_id ON package_booking_trips(package_booking_id);
CREATE INDEX idx_package_booking_trips_trip_id ON package_booking_trips(trip_id);
CREATE INDEX idx_package_booking_trips_scheduled_date ON package_booking_trips(scheduled_date);

-- RLS Policies
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_booking_trips ENABLE ROW LEVEL SECURITY;

-- Public can view active packages
CREATE POLICY "Anyone can view active packages"
  ON packages
  FOR SELECT
  USING (active = true);

-- Providers can manage their packages
CREATE POLICY "Providers can view their packages"
  ON packages
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create packages"
  ON packages
  FOR INSERT
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their packages"
  ON packages
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

CREATE POLICY "Providers can delete their packages"
  ON packages
  FOR DELETE
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Package trips policies
CREATE POLICY "Anyone can view package trips for active packages"
  ON package_trips
  FOR SELECT
  USING (
    package_id IN (SELECT id FROM packages WHERE active = true)
  );

CREATE POLICY "Providers can manage their package trips"
  ON package_trips
  FOR ALL
  USING (
    package_id IN (
      SELECT id FROM packages
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    package_id IN (
      SELECT id FROM packages
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- Package bookings policies
CREATE POLICY "Providers can view their package bookings"
  ON package_bookings
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their package bookings"
  ON package_bookings
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

-- Package booking trips policies
CREATE POLICY "Providers can view their package booking trips"
  ON package_booking_trips
  FOR SELECT
  USING (
    package_booking_id IN (
      SELECT id FROM package_bookings
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Providers can update their package booking trips"
  ON package_booking_trips
  FOR UPDATE
  USING (
    package_booking_id IN (
      SELECT id FROM package_bookings
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    package_booking_id IN (
      SELECT id FROM package_bookings
      WHERE provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can manage all
CREATE POLICY "Service role can manage all packages"
  ON packages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all package_trips"
  ON package_trips
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all package_bookings"
  ON package_bookings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all package_booking_trips"
  ON package_booking_trips
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to update package stats on booking
CREATE OR REPLACE FUNCTION update_package_stats_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE packages
    SET total_bookings = total_bookings + 1
    WHERE id = NEW.package_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE packages
      SET total_bookings = total_bookings + 1
      WHERE id = NEW.package_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE packages
      SET total_bookings = total_bookings - 1
      WHERE id = NEW.package_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_package_stats_on_booking_trigger
  AFTER INSERT OR UPDATE ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_stats_on_booking();

-- Function to calculate package metadata
CREATE OR REPLACE FUNCTION update_package_metadata()
RETURNS TRIGGER AS $$
DECLARE
  v_total_duration INTEGER;
  v_original_price DECIMAL;
  v_has_transfers BOOLEAN;
BEGIN
  -- Calculate total duration
  SELECT COALESCE(SUM(t.duration_hours), 0)
  INTO v_total_duration
  FROM package_trips pt
  JOIN trips t ON t.id = pt.trip_id
  WHERE pt.package_id = NEW.package_id;

  -- Calculate original price (sum of trip prices)
  SELECT COALESCE(SUM(t.price_per_person), 0)
  INTO v_original_price
  FROM package_trips pt
  JOIN trips t ON t.id = pt.trip_id
  WHERE pt.package_id = NEW.package_id;

  -- Check if any trip includes transfers
  SELECT EXISTS(
    SELECT 1
    FROM package_trips pt
    JOIN trips t ON t.id = pt.trip_id
    WHERE pt.package_id = NEW.package_id AND t.includes_transfer = true
  )
  INTO v_has_transfers;

  -- Update package
  UPDATE packages
  SET
    total_duration_hours = v_total_duration,
    original_price = v_original_price,
    includes_transfers = v_has_transfers,
    updated_at = now()
  WHERE id = NEW.package_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_package_metadata_trigger
  AFTER INSERT OR DELETE ON package_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_package_metadata();

-- Update trigger for packages updated_at
CREATE OR REPLACE FUNCTION update_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_packages_timestamp
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_packages_updated_at();

-- Update trigger for package_bookings updated_at
CREATE OR REPLACE FUNCTION update_package_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_package_bookings_timestamp
  BEFORE UPDATE ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_package_bookings_updated_at();

-- Function to generate package booking number
CREATE OR REPLACE FUNCTION generate_package_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'PKG-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_package_booking_number_trigger
  BEFORE INSERT ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_package_booking_number();
