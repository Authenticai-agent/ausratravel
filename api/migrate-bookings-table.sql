-- ============================================================================
-- MIGRATION SCRIPT: Update existing bookings table to new schema
-- Run this ONLY if you already have a bookings table with old structure
-- ============================================================================

-- First, check if old columns exist and migrate data
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'first_name') THEN
    ALTER TABLE bookings ADD COLUMN first_name TEXT;
    ALTER TABLE bookings ADD COLUMN last_name TEXT;
    ALTER TABLE bookings ADD COLUMN phone TEXT;
    ALTER TABLE bookings ADD COLUMN address TEXT;
    
    -- Migrate existing 'name' to first_name/last_name (split on first space)
    UPDATE bookings 
    SET first_name = SPLIT_PART(name, ' ', 1),
        last_name = CASE 
          WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
          ELSE ''
        END
    WHERE first_name IS NULL AND name IS NOT NULL;
    
    -- Make required after migration
    ALTER TABLE bookings ALTER COLUMN first_name SET NOT NULL;
    ALTER TABLE bookings ALTER COLUMN last_name SET NOT NULL;
    ALTER TABLE bookings ALTER COLUMN phone SET NOT NULL;
    ALTER TABLE bookings ALTER COLUMN address SET NOT NULL;
  END IF;
END $$;

-- Add new columns for travel companions (JSONB)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'travel_companions') THEN
    ALTER TABLE bookings ADD COLUMN travel_companions JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add new columns for extra days (JSONB)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_before') THEN
    ALTER TABLE bookings ADD COLUMN extra_days_before JSONB DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_after') THEN
    ALTER TABLE bookings ADD COLUMN extra_days_after JSONB DEFAULT NULL;
  END IF;
END $$;

-- Migrate old extra_days_before and extra_days_after integer columns to JSONB
DO $$
BEGIN
  -- Check if old integer columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_before' AND data_type = 'integer') THEN
    -- Convert integer to JSONB format
    UPDATE bookings 
    SET extra_days_before = jsonb_build_object('nights', extra_days_before::integer)
    WHERE extra_days_before IS NOT NULL AND extra_days_before::integer > 0 
      AND extra_days_before::text ~ '^[0-9]+$';
    
    -- Drop old integer column (after creating JSONB)
    ALTER TABLE bookings DROP COLUMN IF EXISTS extra_days_before;
    ALTER TABLE bookings ADD COLUMN extra_days_before JSONB DEFAULT NULL;
    
    -- Migrate data back
    -- Note: This is simplified - you may need to adjust based on your data
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'extra_days_after' AND data_type = 'integer') THEN
    UPDATE bookings 
    SET extra_days_after = jsonb_build_object('nights', extra_days_after::integer)
    WHERE extra_days_after IS NOT NULL AND extra_days_after::integer > 0
      AND extra_days_after::text ~ '^[0-9]+$';
    
    ALTER TABLE bookings DROP COLUMN IF EXISTS extra_days_after;
    ALTER TABLE bookings ADD COLUMN extra_days_after JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add addons column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'addons') THEN
    ALTER TABLE bookings ADD COLUMN addons TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Rename 'guests' to 'total_guests' if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'guests') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'total_guests') THEN
    ALTER TABLE bookings RENAME COLUMN guests TO total_guests;
  END IF;
END $$;

-- Add payment and pricing columns
DO $$
BEGIN
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
END $$;

-- Add questionnaire_data column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'questionnaire_data') THEN
    ALTER TABLE bookings ADD COLUMN questionnaire_data JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);

-- Create addons_catalog table if it doesn't exist (from booking-schema.sql)
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

-- Insert placeholder add-ons if they don't exist
INSERT INTO addons_catalog (code, name, description, price, price_per_person, available) VALUES
  ('horse_riding', 'Horse Riding Experience', 'Guided horse riding through Provençal countryside', 150.00, true, false),
  ('spa_day', 'Spa Day', 'Full day spa experience with local treatments', 200.00, true, false),
  ('photography_tour', 'Photography Tour', 'Professional photography tour of iconic locations', 180.00, true, false)
ON CONFLICT (code) DO NOTHING;

