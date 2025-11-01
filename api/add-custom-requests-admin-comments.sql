-- Add admin_comments column to custom_requests table
-- This allows admin to track: email sent, request done, rejected, explained, asked for details, etc.
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'custom_requests' 
    AND column_name = 'admin_comments'
  ) THEN
    -- Add the admin_comments column
    ALTER TABLE custom_requests 
    ADD COLUMN admin_comments TEXT;
    
    RAISE NOTICE 'Column admin_comments added successfully';
  ELSE
    RAISE NOTICE 'Column admin_comments already exists';
  END IF;
END $$;

-- Verify the change
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'custom_requests' 
AND column_name = 'admin_comments';

-- Example usage:
-- UPDATE custom_requests 
-- SET admin_comments = 'Email sent on 2024-01-15. Requested additional details about group size.'
-- WHERE id = 'your-request-id';

