# Quick Deployment Guide

## Railway API Setup (5 minutes)

1. **Deploy API to Railway:**
   ```bash
   cd api
   railway login
   railway init
   railway link
   railway up
   ```

2. **Set Environment Variables in Railway Dashboard:**
   - Go to your Railway project → Variables
   - Add these:
     ```
     SUPABASE_URL=https://xxxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
     RESEND_API_KEY=re_xxxxx
     TO_EMAIL=jura@authenticai.ai
     ```

3. **Get your Railway API URL:**
   - Railway will give you a URL like: `https://your-app.railway.app`
   - Copy this URL

## Supabase Setup (3 minutes)

1. **Create bookings table:**
   - Go to Supabase Dashboard → SQL Editor
   - Paste and run `api/supabase-schema.sql`

2. **Get your credentials:**
   - Settings → API
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## Resend Setup (2 minutes)

1. **Create API key:**
   - Go to [resend.com](https://resend.com) → API Keys
   - Create new key → Copy it → `RESEND_API_KEY`

2. **Verify domain (optional):**
   - For production, verify your domain
   - Or use default `noreply@authenticai.ai` for testing

## Frontend Configuration

In `index.html`, update the API URL:

```html
<script>
  window.API_BASE_URL = 'https://your-app.railway.app';
</script>
```

Or set it dynamically via your hosting platform's environment variables.

## Test It

1. Submit a booking form on your site
2. Check `jura@authenticai.ai` for the email
3. Check Supabase → Table Editor → `bookings` table

---

**Done!** Your booking system is live. 🎉

