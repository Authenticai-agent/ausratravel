# How to Manage Reviews in Supabase

## Quick Guide: Change Review Status

### Method 1: Supabase Table Editor (Easiest)

1. Go to Supabase Dashboard → **Table Editor**
2. Select **reviews** table
3. Find the review you want to change
4. Click on the **status** cell
5. Change from `pending` to:
   - `approved` - Review will appear on website
   - `published` - Same as approved (alternative name)
   - `rejected` - Review will NOT appear on website
6. Click **Save** or press Enter

### Method 2: SQL Editor (For Bulk Changes)

Go to Supabase Dashboard → **SQL Editor** and run:

#### View all pending reviews:
```sql
SELECT id, name, rating, review, status, created_at
FROM reviews
WHERE status = 'pending'
ORDER BY created_at DESC;
```

#### Approve a single review:
```sql
-- Replace 'REVIEW_ID_HERE' with the actual ID from the query above
UPDATE reviews
SET status = 'approved'
WHERE id = 'REVIEW_ID_HERE';
```

#### Approve all pending reviews at once:
```sql
UPDATE reviews
SET status = 'approved'
WHERE status = 'pending';
```

#### Reject a review:
```sql
UPDATE reviews
SET status = 'rejected'
WHERE id = 'REVIEW_ID_HERE';
```

#### Change to "published" (alternative to approved):
```sql
UPDATE reviews
SET status = 'published'
WHERE id = 'REVIEW_ID_HERE';
```

### Status Values Explained:

- **`pending`** - Newly submitted, waiting for approval (default)
- **`approved`** - Approved review, visible on website ✅
- **`published`** - Same as approved, visible on website ✅
- **`rejected`** - Rejected, NOT visible on website ❌

### Quick Workflow:

1. **View pending reviews:**
   ```sql
   SELECT * FROM reviews WHERE status = 'pending';
   ```

2. **Approve one:**
   ```sql
   UPDATE reviews SET status = 'approved' WHERE id = 'THE_ID_HERE';
   ```

3. **Verify it's approved:**
   ```sql
   SELECT * FROM reviews WHERE id = 'THE_ID_HERE';
   ```

4. **Refresh your website** - The review should now appear!

### All Available SQL Commands:

See `api/manage-reviews.sql` for a complete list of SQL commands for managing reviews.

