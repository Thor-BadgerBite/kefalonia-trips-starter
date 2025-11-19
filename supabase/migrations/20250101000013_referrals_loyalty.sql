-- Referral and loyalty program system
CREATE TABLE IF NOT EXISTS customer_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Customer info
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,

  -- Referral code
  referral_code TEXT NOT NULL UNIQUE,

  -- Referred by
  referred_by_code TEXT, -- References another customer's referral_code
  referred_at TIMESTAMP WITH TIME ZONE,

  -- Loyalty points
  loyalty_points INTEGER DEFAULT 0,
  lifetime_points_earned INTEGER DEFAULT 0,
  lifetime_points_spent INTEGER DEFAULT 0,

  -- Stats
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,

  -- Tier
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),

  -- Preferences
  opt_in_marketing BOOLEAN DEFAULT true
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Referrer (existing customer)
  referrer_account_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE NOT NULL,
  referrer_code TEXT NOT NULL,

  -- Referee (new customer)
  referee_account_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE NOT NULL,
  referee_email TEXT NOT NULL,

  -- Booking that qualified the referral
  qualifying_booking_id UUID, -- First completed booking
  qualified_at TIMESTAMP WITH TIME ZONE,

  -- Rewards
  referrer_reward_type TEXT, -- 'points', 'voucher', 'discount'
  referrer_reward_value DECIMAL(10,2),
  referrer_reward_given BOOLEAN DEFAULT false,

  referee_reward_type TEXT,
  referee_reward_value DECIMAL(10,2),
  referee_reward_given BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'completed', 'cancelled'))
);

-- Loyalty points transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  customer_account_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'expired', 'adjusted')),
  points INTEGER NOT NULL, -- Positive for earned, negative for spent
  balance_after INTEGER NOT NULL,

  -- Source
  source_type TEXT NOT NULL, -- 'booking', 'referral', 'review', 'reward', 'admin'
  source_id UUID, -- booking_id, referral_id, etc.
  source_description TEXT,

  -- Expiry (for earned points)
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Loyalty rewards catalog
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Provider (NULL for platform-wide rewards)
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,

  -- Reward details
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),

  -- Reward type
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_trip', 'upgrade')),
  reward_value DECIMAL(10,2),

  -- Restrictions
  min_tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
  applicable_to TEXT, -- 'all', 'trips', 'packages'
  specific_trip_ids UUID[],

  -- Availability
  active BOOLEAN DEFAULT true,
  stock_quantity INTEGER, -- NULL = unlimited
  stock_remaining INTEGER,

  -- Expiry after redemption
  valid_days INTEGER DEFAULT 90, -- Days the reward is valid after redemption

  -- Display
  image_url TEXT,
  featured BOOLEAN DEFAULT false
);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  customer_account_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES loyalty_rewards(id) ON DELETE RESTRICT NOT NULL,

  -- Points transaction
  points_spent INTEGER NOT NULL,
  loyalty_transaction_id UUID REFERENCES loyalty_transactions(id),

  -- Redemption details
  voucher_code TEXT, -- Generated voucher code for the reward

  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Usage
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_for_booking_id UUID
);

-- Indexes
CREATE INDEX idx_customer_accounts_email ON customer_accounts(email);
CREATE INDEX idx_customer_accounts_referral_code ON customer_accounts(referral_code);
CREATE INDEX idx_customer_accounts_loyalty_tier ON customer_accounts(loyalty_tier);

CREATE INDEX idx_referrals_referrer_account_id ON referrals(referrer_account_id);
CREATE INDEX idx_referrals_referee_account_id ON referrals(referee_account_id);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_loyalty_transactions_customer_account_id ON loyalty_transactions(customer_account_id);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);
CREATE INDEX idx_loyalty_transactions_expires_at ON loyalty_transactions(expires_at);

CREATE INDEX idx_loyalty_rewards_provider_id ON loyalty_rewards(provider_id);
CREATE INDEX idx_loyalty_rewards_active ON loyalty_rewards(active);
CREATE INDEX idx_loyalty_rewards_points_required ON loyalty_rewards(points_required);

CREATE INDEX idx_reward_redemptions_customer_account_id ON reward_redemptions(customer_account_id);
CREATE INDEX idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_used ON reward_redemptions(used);

-- RLS Policies
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own account
CREATE POLICY "Customers can view their account"
  ON customer_accounts
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Anyone can view active rewards
CREATE POLICY "Anyone can view active rewards"
  ON loyalty_rewards
  FOR SELECT
  USING (active = true);

-- Providers can manage their rewards
CREATE POLICY "Providers can manage their rewards"
  ON loyalty_rewards
  FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all
CREATE POLICY "Service role can manage all customer_accounts"
  ON customer_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all referrals"
  ON referrals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all loyalty_transactions"
  ON loyalty_transactions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all reward_redemptions"
  ON reward_redemptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-character alphanumeric code
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM customer_accounts WHERE referral_code = v_code) INTO v_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create customer account
CREATE OR REPLACE FUNCTION get_or_create_customer_account(
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_referred_by_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
  v_referral_code TEXT;
  v_referrer_account_id UUID;
BEGIN
  -- Check if account exists
  SELECT id INTO v_account_id
  FROM customer_accounts
  WHERE email = p_email;

  IF v_account_id IS NOT NULL THEN
    RETURN v_account_id;
  END IF;

  -- Generate referral code
  v_referral_code := generate_referral_code();

  -- Get referrer account if code provided
  IF p_referred_by_code IS NOT NULL THEN
    SELECT id INTO v_referrer_account_id
    FROM customer_accounts
    WHERE referral_code = UPPER(p_referred_by_code);
  END IF;

  -- Create new account
  INSERT INTO customer_accounts (
    email,
    name,
    phone,
    referral_code,
    referred_by_code,
    referred_at
  ) VALUES (
    p_email,
    p_name,
    p_phone,
    v_referral_code,
    CASE WHEN v_referrer_account_id IS NOT NULL THEN UPPER(p_referred_by_code) ELSE NULL END,
    CASE WHEN v_referrer_account_id IS NOT NULL THEN now() ELSE NULL END
  )
  RETURNING id INTO v_account_id;

  -- Create referral record if referred
  IF v_referrer_account_id IS NOT NULL THEN
    INSERT INTO referrals (
      referrer_account_id,
      referrer_code,
      referee_account_id,
      referee_email,
      status
    ) VALUES (
      v_referrer_account_id,
      UPPER(p_referred_by_code),
      v_account_id,
      p_email,
      'pending'
    );
  END IF;

  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to award loyalty points
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_customer_account_id UUID,
  p_points INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_source_description TEXT DEFAULT NULL,
  p_expires_in_days INTEGER DEFAULT 365
)
RETURNS VOID AS $$
DECLARE
  v_balance_after INTEGER;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiry
  v_expires_at := now() + (p_expires_in_days || ' days')::INTERVAL;

  -- Get current balance
  SELECT loyalty_points INTO v_balance_after
  FROM customer_accounts
  WHERE id = p_customer_account_id;

  v_balance_after := v_balance_after + p_points;

  -- Record transaction
  INSERT INTO loyalty_transactions (
    customer_account_id,
    transaction_type,
    points,
    balance_after,
    source_type,
    source_id,
    source_description,
    expires_at
  ) VALUES (
    p_customer_account_id,
    'earned',
    p_points,
    v_balance_after,
    p_source_type,
    p_source_id,
    p_source_description,
    v_expires_at
  );

  -- Update account
  UPDATE customer_accounts
  SET
    loyalty_points = v_balance_after,
    lifetime_points_earned = lifetime_points_earned + p_points,
    updated_at = now()
  WHERE id = p_customer_account_id;

  -- Update tier based on lifetime points
  UPDATE customer_accounts
  SET loyalty_tier = CASE
    WHEN lifetime_points_earned >= 10000 THEN 'platinum'
    WHEN lifetime_points_earned >= 5000 THEN 'gold'
    WHEN lifetime_points_earned >= 2000 THEN 'silver'
    ELSE 'bronze'
  END
  WHERE id = p_customer_account_id;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem loyalty points
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_customer_account_id UUID,
  p_points INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_balance_after INTEGER;
BEGIN
  -- Get current balance
  SELECT loyalty_points INTO v_balance_after
  FROM customer_accounts
  WHERE id = p_customer_account_id;

  IF v_balance_after < p_points THEN
    RAISE EXCEPTION 'Insufficient loyalty points';
  END IF;

  v_balance_after := v_balance_after - p_points;

  -- Record transaction
  INSERT INTO loyalty_transactions (
    customer_account_id,
    transaction_type,
    points,
    balance_after,
    source_type,
    source_description
  ) VALUES (
    p_customer_account_id,
    'spent',
    -p_points,
    v_balance_after,
    'reward',
    'Redeemed for reward'
  );

  -- Update account
  UPDATE customer_accounts
  SET
    loyalty_points = v_balance_after,
    lifetime_points_spent = lifetime_points_spent + p_points,
    updated_at = now()
  WHERE id = p_customer_account_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points on completed bookings
CREATE OR REPLACE FUNCTION award_booking_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_account_id UUID;
  v_points INTEGER;
BEGIN
  -- Only award points when booking is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get or create customer account
    v_customer_account_id := get_or_create_customer_account(
      NEW.customer_email,
      NEW.customer_name,
      NEW.customer_phone
    );

    -- Calculate points (1 point per €1 spent)
    v_points := FLOOR(NEW.total_price);

    -- Award points
    PERFORM award_loyalty_points(
      v_customer_account_id,
      v_points,
      'booking',
      NEW.id,
      'Booking ' || NEW.booking_number
    );

    -- Update customer account stats
    UPDATE customer_accounts
    SET
      total_bookings = total_bookings + 1,
      total_spent = total_spent + NEW.total_price
    WHERE id = v_customer_account_id;

    -- Check for qualifying referral
    UPDATE referrals
    SET
      status = 'qualified',
      qualifying_booking_id = NEW.id,
      qualified_at = now()
    WHERE referee_account_id = v_customer_account_id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_booking_loyalty_points_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_booking_loyalty_points();

-- Same trigger for package bookings
CREATE TRIGGER award_package_booking_loyalty_points_trigger
  AFTER UPDATE ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_booking_loyalty_points();

-- Update trigger for customer_accounts updated_at
CREATE OR REPLACE FUNCTION update_customer_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_accounts_timestamp
  BEFORE UPDATE ON customer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_accounts_updated_at();

-- Update trigger for loyalty_rewards updated_at
CREATE OR REPLACE FUNCTION update_loyalty_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_rewards_timestamp
  BEFORE UPDATE ON loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_rewards_updated_at();
