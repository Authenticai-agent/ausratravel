# Railway Environment Variables Checklist

## Required Variables for Reviews to Work:

In Railway Dashboard → Service → Variables, verify these exact variable names:

### 1. SUPABASE_URL
- **Variable Name:** `SUPABASE_URL` (exact match, case-sensitive)
- **Value:** Your Supabase project URL
- **Format:** `https://xxxxx.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API → Project URL

### 2. SUPABASE_SERVICE_ROLE_KEY
- **Variable Name:** `SUPABASE_SERVICE_ROLE_KEY` (exact match, case-sensitive)
- **Value:** Your Supabase service role key
- **Format:** Starts with `eyJ...` (JWT token)
- **Where to find:** Supabase Dashboard → Settings → API → service_role key (secret)
- **⚠️ Important:** Use the **service_role** key, NOT the **anon** key!

## How to Verify Variables are Set:

1. **In Railway Dashboard:**
   - Go to your service → **Variables** tab
   - Check both variables are listed:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **Test the API:**
   After Railway redeploys, test:
   ```
   https://ausratravel-production.up.railway.app/api/diagnostics
   ```
   Should show:
   ```json
   {
     "supabase": {
       "url": "Set",
       "key": "Set",
       "keyType": "JWT token",
       "clientInitialized": true
     }
   }
   ```

3. **Check Railway Logs:**
   When server starts, logs should show:
   ```
   Supabase: connected
   ```
   NOT:
   ```
   Supabase: not configured
   ```

## After Adding Variables:

1. **Save** the variables in Railway
2. **Railway will automatically redeploy** (check Deployments tab)
3. **Wait 1-2 minutes** for deployment to complete
4. **Test** by submitting a review

## Common Mistakes:

- ❌ Using `SUPABASE_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`
- ❌ Using the anon key instead of service role key
- ❌ Typo in variable name (extra spaces, wrong case)
- ❌ Not waiting for Railway to redeploy after adding variables
- ❌ Setting variables in wrong service/environment

