-- ============================================================================
-- COMPREHENSIVE BOOKING DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Main bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Primary guest information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  
  -- Trip details
  experience TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL CHECK (nights >= 4),
  occupancy TEXT NOT NULL CHECK (occupancy IN ('double', 'single')),
  total_guests INTEGER NOT NULL CHECK (total_guests > 0 AND total_guests <= 10),
  
  -- Travel companions (stored as JSONB for flexibility)
  travel_companions JSONB DEFAULT '[]'::jsonb,
  
  -- Extra days
  extra_days_before JSONB DEFAULT NULL, -- {dates: ['2024-01-01', '2024-01-02'], nights: 2}
  extra_days_after JSONB DEFAULT NULL,
  
  -- Add-ons (stored as array)
  addons TEXT[] DEFAULT '{}',
  
  -- Payment information
  deposit_amount DECIMAL(10, 2) DEFAULT 299.00,
  deposit_paid BOOLEAN DEFAULT false,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  
  -- Total pricing
  trip_total DECIMAL(10, 2),
  extra_days_total DECIMAL(10, 2) DEFAULT 0,
  addons_total DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2),
  remaining_balance DECIMAL(10, 2),
  
  -- Status and notes
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  
  -- Questionnaire data (optional)
  questionnaire_data JSONB DEFAULT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON bookings(stripe_payment_intent_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- Add-ons catalog table (for future add-ons like horse riding)
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

-- Insert placeholder add-ons (can be expanded later)
INSERT INTO addons_catalog (code, name, description, price, price_per_person, available) VALUES
  ('horse_riding', 'Horse Riding Experience', 'Guided horse riding through Provençal countryside', 150.00, true, false),
  ('spa_day', 'Spa Day', 'Full day spa experience with local treatments', 200.00, true, false),
  ('photography_tour', 'Photography Tour', 'Professional photography tour of iconic locations', 180.00, true, false)
ON CONFLICT (code) DO NOTHING;

-- Function to update addons_catalog updated_at
CREATE OR REPLACE FUNCTION update_addons_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for addons_catalog
DROP TRIGGER IF EXISTS update_addons_catalog_updated_at ON addons_catalog;
CREATE TRIGGER update_addons_catalog_updated_at
  BEFORE UPDATE ON addons_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_addons_catalog_updated_at();

-- RLS (Row Level Security)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons_catalog ENABLE ROW LEVEL SECURITY;

-- Note: Service role key (used by API) bypasses RLS
-- If you need user-level access, create policies in Supabase dashboard

-- ============================================================================
-- HELPFUL QUERIES (for reference, not executed)
-- ============================================================================

-- Get bookings with travel companions
-- SELECT id, first_name, last_name, email, experience, 
--        travel_companions, 
--        jsonb_array_length(travel_companions) as companion_count
-- FROM bookings;

-- Get bookings with extra days
-- SELECT id, first_name, experience, check_in, check_out,
--        extra_days_before->>'nights' as extra_nights_before,
--        extra_days_after->>'nights' as extra_nights_after
-- FROM bookings
-- WHERE extra_days_before IS NOT NULL OR extra_days_after IS NOT NULL;

-- Get bookings by add-ons
-- SELECT id, first_name, experience, addons, total_amount
-- FROM bookings
-- WHERE array_length(addons, 1) > 0;

-- Get available add-ons
-- SELECT * FROM addons_catalog WHERE available = true;

