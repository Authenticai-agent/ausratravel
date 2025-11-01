-- SQL Scripts for Managing Reviews in Supabase
-- Run these in Supabase SQL Editor

-- 1. View all pending reviews
SELECT 
  id,
  name,
  rating,
  review,
  status,
  created_at
FROM reviews
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 2. Approve a review (make it visible on website)
-- Replace 'REVIEW_ID_HERE' with the actual review ID
UPDATE reviews
SET status = 'approved'
WHERE id = 'REVIEW_ID_HERE';

-- Example:
-- UPDATE reviews SET status = 'approved' WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- 3. Reject a review (hide it from website)
-- Replace 'REVIEW_ID_HERE' with the actual review ID
UPDATE reviews
SET status = 'rejected'
WHERE id = 'REVIEW_ID_HERE';

-- 4. Approve all pending reviews at once
-- (Use with caution!)
UPDATE reviews
SET status = 'approved'
WHERE status = 'pending';

-- 5. View all approved reviews (what shows on website)
SELECT 
  id,
  name,
  rating,
  review,
  status,
  created_at
FROM reviews
WHERE status = 'approved'
ORDER BY created_at DESC;

-- 6. View all reviews (any status)
SELECT 
  id,
  name,
  rating,
  review,
  status,
  created_at,
  updated_at
FROM reviews
ORDER BY created_at DESC;

-- 7. Delete a review (permanently remove)
-- Replace 'REVIEW_ID_HERE' with the actual review ID
-- DELETE FROM reviews WHERE id = 'REVIEW_ID_HERE';

-- 8. Get review by ID (to find the ID)
-- Replace 'REVIEW_ID_HERE' with the actual review ID
SELECT * FROM reviews WHERE id = 'REVIEW_ID_HERE';

