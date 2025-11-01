-- Fix RLS for reviews table to allow service role inserts
-- Run this in Supabase SQL Editor

-- First, check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reviews';

-- Add a policy to allow service role (API) to insert reviews
-- Service role key should bypass RLS, but let's add an explicit policy to be safe
CREATE POLICY IF NOT EXISTS "Allow service role to insert reviews"
ON reviews
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service role to read all reviews
CREATE POLICY IF NOT EXISTS "Allow service role to read reviews"
ON reviews
FOR SELECT
TO service_role
USING (true);

-- Allow service role to update reviews
CREATE POLICY IF NOT EXISTS "Allow service role to update reviews"
ON reviews
FOR UPDATE
TO service_role
USING (true);

-- Verify policies were created
SELECT * FROM pg_policies WHERE tablename = 'reviews';

-- Alternative: If policies don't work, you can temporarily disable RLS for testing
-- (Not recommended for production, but useful for debugging)
-- ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

