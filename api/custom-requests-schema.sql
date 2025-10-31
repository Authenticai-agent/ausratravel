-- Create custom_requests table in Supabase
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_requests_created ON custom_requests(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_custom_requests_updated_at ON custom_requests;
CREATE TRIGGER update_custom_requests_updated_at
  BEFORE UPDATE ON custom_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_requests_updated_at();

-- RLS (Row Level Security)
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for API)
-- Service role key bypasses RLS

