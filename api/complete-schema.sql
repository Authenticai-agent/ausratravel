-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR AUTHENTIC FRANCE BOOKING SYSTEM
-- Run this entire script in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  experience TEXT NOT NULL,
  occupancy TEXT NOT NULL CHECK (occupancy IN ('double', 'single')),
  guests INTEGER NOT NULL CHECK (guests > 0 AND guests <= 10),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL CHECK (nights >= 4),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  
  -- Questionnaire fields
  physical_ability BOOLEAN,
  interests TEXT[],
  activity_level TEXT,
  group_preference TEXT,
  bathroom_ack BOOLEAN,
  rooming_with TEXT,
  travel_companions TEXT,
  marketing_source TEXT,
  additional_info TEXT,
  
  -- Extra days
  extra_days_before INTEGER DEFAULT 0 NOT NULL,
  extra_days_after INTEGER DEFAULT 0 NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);

-- ============================================================================
-- CUSTOM REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for custom_requests
CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_requests_created ON custom_requests(created_at DESC);

-- ============================================================================
-- UPDATE TIMESTAMP FUNCTIONS
-- ============================================================================

-- Function for bookings updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for custom_requests updated_at
CREATE OR REPLACE FUNCTION update_custom_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for bookings
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for custom_requests
DROP TRIGGER IF EXISTS update_custom_requests_updated_at ON custom_requests;
CREATE TRIGGER update_custom_requests_updated_at
  BEFORE UPDATE ON custom_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_requests_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- Note: Service role key (used by API) bypasses RLS
-- If you need user-level access, create policies in Supabase dashboard

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run after setup)
-- ============================================================================

-- Check bookings table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'bookings'
-- ORDER BY ordinal_position;

-- Check custom_requests table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'custom_requests'
-- ORDER BY ordinal_position;

