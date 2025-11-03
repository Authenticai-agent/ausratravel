# Quick Check: Reviews Table Status

## Run these queries in Supabase SQL Editor:

### 1. Check if table exists:
```sql
SELECT * FROM reviews LIMIT 5;
```

### 2. Check table structure:
```sql
\dt reviews
-- OR
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'reviews';
```

### 3. Check for any pending reviews:
```sql
SELECT id, name, rating, status, created_at 
FROM reviews 
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### 4. Check all reviews (including any you just submitted):
```sql
SELECT * FROM reviews ORDER BY created_at DESC;
```

### 5. If table doesn't exist, create it:
Run the entire contents of `api/reviews-schema.sql` in Supabase SQL Editor.

## Check Railway Logs:

1. Go to Railway Dashboard
2. Latest Deployment → Logs
3. Look for:
   - "Supabase: connected" or "Supabase: not configured"
   - Any errors when submitting a review
   - "Review saved successfully with ID: ..."

## Test Review Submission:

1. Submit a review on the website
2. Immediately check Railway logs
3. Check Supabase for the new review

