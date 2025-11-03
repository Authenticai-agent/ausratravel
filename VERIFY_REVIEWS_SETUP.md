# Verify Reviews Setup

## Step 1: Check if Reviews Table Exists

Run this in Supabase SQL Editor:
```sql
SELECT * FROM reviews LIMIT 5;
```

If you get an error, the table doesn't exist - run `api/reviews-schema.sql`

## Step 2: Verify Table Structure

Run this to see the table structure:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reviews';
```

Should show:
- `id` (UUID)
- `name` (TEXT)
- `rating` (INTEGER)
- `review` (TEXT)
- `status` (TEXT, default 'pending')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Step 3: Check Railway Environment Variables

In Railway Dashboard → Service → Variables, verify:
- `SUPABASE_URL` is set
- `SUPABASE_SERVICE_ROLE_KEY` is set (NOT the anon key)

## Step 4: Test Review Submission

1. Submit a review on the website
2. Check Railway logs for any errors
3. Check Supabase:
   ```sql
   SELECT * FROM reviews ORDER BY created_at DESC LIMIT 1;
   ```

## Step 5: Check RLS Policies

If reviews aren't being inserted, check Row Level Security:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reviews';

-- If RLS is blocking, the service role key should bypass it
-- But you can check policies:
SELECT * FROM pg_policies WHERE tablename = 'reviews';
```

## Common Issues

1. **Table doesn't exist**: Run `api/reviews-schema.sql` in Supabase
2. **Wrong key**: Use `SUPABASE_SERVICE_ROLE_KEY`, not `SUPABASE_ANON_KEY`
3. **RLS blocking**: Service role should bypass, but verify in Supabase dashboard
4. **Connection issue**: Check Railway logs for Supabase connection errors

