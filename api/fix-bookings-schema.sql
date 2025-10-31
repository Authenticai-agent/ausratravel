-- ============================================================================
-- FIX EXISTING BOOKINGS TABLE: Add missing columns
-- Run this if you get "column does not exist" errors
-- ============================================================================

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Primary guest information columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'first_name') THEN
    ALTER TABLE bookings ADD COLUMN first_name TEXT;
    ALTER TABLE bookings ADD COLUMN last_name TEXT;
    
    -- Migrate existing 'name' field if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'name') THEN
      UPDATE bookings 
      SET first_name = SPLIT_PART(name, ' ', 1),
          last_name = CASE 
            WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
            ELSE ''
          END
      WHERE first_name IS NULL AND name IS NOT NULL;
    END IF;
    
    ALTER TABLE bookings ALTER COLUMN first_name SET NOT NULL;
    ALTER TABLE bookings ALTER COLUMN last_name SET NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'phone') THEN
    ALTER TABLE bookings ADD COLUMN phone TEXT NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address') THEN
    ALTER TABLE bookings ADD COLUMN address TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Travel companions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'travel_companions') THEN
    ALTER TABLE bookings ADD COLUMN travel_companions JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Extra days (convert from integer to JSONB if needed)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_before') THEN
    ALTER TABLE bookings ADD COLUMN extra_days_before JSONB DEFAULT NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_before' AND data_type = 'integer') THEN
    -- Migrate integer to JSONB
    ALTER TABLE bookings ADD COLUMN extra_days_before_new JSONB DEFAULT NULL;
    UPDATE bookings SET extra_days_before_new = jsonb_build_object('nights', extra_days_before) WHERE extra_days_before IS NOT NULL;
    ALTER TABLE bookings DROP COLUMN extra_days_before;
    ALTER TABLE bookings RENAME COLUMN extra_days_before_new TO extra_days_before;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_after') THEN
    ALTER TABLE bookings ADD COLUMN extra_days_after JSONB DEFAULT NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_after' AND data_type = 'integer') THEN
    ALTER TABLE bookings ADD COLUMN extra_days_after_new JSONB DEFAULT NULL;
    UPDATE bookings SET extra_days_after_new = jsonb_build_object('nights', extra_days_after) WHERE extra_days_after IS NOT NULL;
    ALTER TABLE bookings DROP COLUMN extra_days_after;
    ALTER TABLE bookings RENAME COLUMN extra_days_after_new TO extra_days_after;
  END IF;
  
  -- Add-ons
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'addons') THEN
    ALTER TABLE bookings ADD COLUMN addons TEXT[] DEFAULT '{}';
  END IF;
  
  -- Rename 'guests' to 'total_guests' if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guests') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_guests') THEN
    ALTER TABLE bookings RENAME COLUMN guests TO total_guests;
  END IF;
  
  -- Payment columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_amount') THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(10, 2) DEFAULT 299.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'deposit_paid') THEN
    ALTER TABLE bookings ADD COLUMN deposit_paid BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE bookings ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE bookings ADD COLUMN stripe_customer_id TEXT;
  END IF;
  
  -- Pricing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'trip_total') THEN
    ALTER TABLE bookings ADD COLUMN trip_total DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_total') THEN
    ALTER TABLE bookings ADD COLUMN extra_days_total DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'addons_total') THEN
    ALTER TABLE bookings ADD COLUMN addons_total DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_amount') THEN
    ALTER TABLE bookings ADD COLUMN total_amount DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'remaining_balance') THEN
    ALTER TABLE bookings ADD COLUMN remaining_balance DECIMAL(10, 2);
  END IF;
  
  -- Questionnaire data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'questionnaire_data') THEN
    ALTER TABLE bookings ADD COLUMN questionnaire_data JSONB DEFAULT NULL;
  END IF;
END $$;

-- Create indexes (only if columns exist)
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

-- Create Stripe payment intent index only if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'stripe_payment_intent_id') THEN
    CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);
  END IF;
END $$;

-- Create addons_catalog table if it doesn't exist
CREATE TABLE IF NOT EXISTS addons_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  price_per_person BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert placeholder add-ons
INSERT INTO addons_catalog (code, name, description, price, price_per_person, available) VALUES
  ('horse_riding', 'Horse Riding Experience', 'Guided horse riding through Provençal countryside', 150.00, true, false),
  ('spa_day', 'Spa Day', 'Full day spa experience with local treatments', 200.00, true, false),
  ('photography_tour', 'Photography Tour', 'Professional photography tour of iconic locations', 180.00, true, false)
ON CONFLICT (code) DO NOTHING;

