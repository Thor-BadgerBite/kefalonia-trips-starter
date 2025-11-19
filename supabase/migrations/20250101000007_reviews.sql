-- Reviews and ratings system
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Foreign keys
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,

  -- Customer info (denormalized for convenience)
  customer_name TEXT NOT NULL,
  customer_email TEXT,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,

  -- Detailed ratings (optional)
  rating_communication INTEGER CHECK (rating_communication >= 1 AND rating_communication <= 5),
  rating_cleanliness INTEGER CHECK (rating_cleanliness >= 1 AND rating_cleanliness <= 5),
  rating_value INTEGER CHECK (rating_value >= 1 AND rating_value <= 5),
  rating_accuracy INTEGER CHECK (rating_accuracy >= 1 AND rating_accuracy <= 5),

  -- Status and moderation
  status TEXT NOT NULL DEFAULT 'published', -- published, pending, hidden, flagged
  verified_booking BOOLEAN DEFAULT true,

  -- Provider response
  provider_response TEXT,
  provider_responded_at TIMESTAMP WITH TIME ZONE,

  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Photos from customer
  photos TEXT[],

  UNIQUE(booking_id) -- One review per booking
);

-- Indexes
CREATE INDEX idx_reviews_trip_id ON reviews(trip_id);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- RLS Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews"
  ON reviews
  FOR SELECT
  USING (status = 'published');

-- Customers can create reviews for their completed bookings
CREATE POLICY "Customers can create reviews for their bookings"
  ON reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.customer_email = reviews.customer_email
      AND bookings.status = 'completed'
    )
  );

-- Providers can view all reviews for their trips
CREATE POLICY "Providers can view their reviews"
  ON reviews
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Providers can respond to reviews
CREATE POLICY "Providers can respond to reviews"
  ON reviews
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

-- Service role can manage all reviews
CREATE POLICY "Service role can manage all reviews"
  ON reviews
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to update trip ratings when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_trip_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update trip ratings
  UPDATE trips
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
      AND status = 'published'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
      AND status = 'published'
    )
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trip ratings
DROP TRIGGER IF EXISTS update_trip_ratings_on_review_change ON reviews;
CREATE TRIGGER update_trip_ratings_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_ratings();

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_timestamp
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Add reviewed flag to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reviewed'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reviewed BOOLEAN DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_reviewed ON bookings(reviewed);
