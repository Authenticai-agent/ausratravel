-- Convert review status to ENUM type for dropdown in Supabase Table Editor
-- This will show a dropdown with options: pending, approved, published, rejected
-- Run this in Supabase SQL Editor

-- Step 1: Create the ENUM type
DO $$ BEGIN
  CREATE TYPE review_status_enum AS ENUM ('pending', 'approved', 'published', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Alter the reviews table to use the ENUM type
-- First, we need to cast the existing TEXT column to the ENUM type
DO $$ 
BEGIN
  -- Check if column exists and is TEXT type
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'reviews' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    -- Step 2a: Drop the default value temporarily
    ALTER TABLE reviews 
    ALTER COLUMN status DROP DEFAULT;
    
    -- Step 2b: Drop the old CHECK constraint if it exists
    ALTER TABLE reviews 
    DROP CONSTRAINT IF EXISTS reviews_status_check;
    
    -- Step 2c: Convert TEXT to ENUM
    ALTER TABLE reviews 
    ALTER COLUMN status TYPE review_status_enum 
    USING status::review_status_enum;
    
    -- Step 2d: Restore the default value with proper ENUM cast
    ALTER TABLE reviews 
    ALTER COLUMN status SET DEFAULT 'pending'::review_status_enum;
    
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'reviews' 
    AND column_name = 'status'
    AND udt_name = 'review_status_enum'
  ) THEN
    -- Column already exists and is ENUM type
    RAISE NOTICE 'Column status is already ENUM type. No conversion needed.';
  ELSE
    -- Column doesn't exist, create it
    ALTER TABLE reviews 
    ADD COLUMN status review_status_enum NOT NULL DEFAULT 'pending'::review_status_enum;
  END IF;
END $$;

-- Step 3: Verify the change
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'reviews' 
AND column_name = 'status';

-- Note: After running this script, the Supabase Table Editor will show a dropdown
-- with options: pending, approved, published, rejected when editing the status column

