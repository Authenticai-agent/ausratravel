-- Update existing reviews table to allow 'published' status
-- Run this in Supabase SQL Editor if your table already exists

-- First, drop the existing check constraint
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_status_check;

-- Add new constraint with 'published' option
ALTER TABLE reviews
ADD CONSTRAINT reviews_status_check 
CHECK (status IN ('pending', 'approved', 'published', 'rejected'));

-- Verify the change
SELECT 
  tc.constraint_name, 
  cc.check_clause 
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'reviews' 
AND tc.constraint_type = 'CHECK';

-- Now you can use 'published' status!
-- Example: UPDATE reviews SET status = 'published' WHERE id = 'your-review-id';

