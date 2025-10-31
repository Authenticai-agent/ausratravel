# Authentic Experiences in South of France

Professional booking website with Airbnb-style calendar, dynamic pricing, and email notifications via Railway + Supabase.

## Features

- ✅ Airbnb-style date range picker with availability blocking
- ✅ Dynamic pricing calculation based on occupancy and dates
- ✅ Railway API backend with Express
- ✅ Supabase database for bookings storage
- ✅ Resend email notifications (to you and customers)
- ✅ Responsive, modern design

## Setup

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `api/supabase-schema.sql`
3. Copy your project URL and service role key (Settings → API)

### 2. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Create an API key in the dashboard
3. Verify your domain (or use the default `noreply@authenticai.ai` for testing)

### 3. Railway Deployment

#### Option A: Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repo (or deploy from the `api` folder)
3. Set environment variables in Railway dashboard:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   TO_EMAIL=jura@authenticai.ai
   ```
4. Railway will auto-detect Node.js and deploy

#### Option B: Railway CLI

```bash
cd api
railway login
railway init
railway link
railway add
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key
railway variables set RESEND_API_KEY=re_xxxxxxxxxxxxx
railway variables set TO_EMAIL=jura@authenticai.ai
railway up
```

### 4. Frontend Configuration

Update `script.js` to point to your Railway API URL:

```javascript
// Set your Railway API URL here or via environment variable
const API_BASE = window.API_BASE_URL || 'https://your-app-name.railway.app';
```

Or set it in your HTML:

```html
<script>
  window.API_BASE_URL = 'https://your-app-name.railway.app';
</script>
<script src="/script.js"></script>
```

### 5. Local Development

```bash
cd api
npm install
cp .env.example .env
# Edit .env with your keys
npm start
```

The API will run on `http://localhost:3001`

## API Endpoints

- `GET /health` - Health check
- `GET /api/availability` - Returns blocked date ranges from confirmed bookings
- `POST /api/booking` - Submit booking request (saves to Supabase + sends emails)

## Email Flow

When someone submits a booking:

1. **Admin Email** → Sent to `TO_EMAIL` (jura@authenticai.ai)
   - Contains all booking details
   - Reply-to set to customer email
   - Includes estimated total

2. **Customer Confirmation** → Sent to customer email
   - Thank you message
   - Booking summary
   - Response time expectation

## Database Schema

Bookings are stored in Supabase with:
- Customer info (name, email)
- Experience details
- Dates (check-in, check-out, nights)
- Status (pending, confirmed, cancelled)
- Timestamps

## Availability Logic

- Confirmed bookings automatically block dates in the calendar
- Minimum stay: 4 nights (enforced client + server side)
- Calendar fetches availability on page load

## Pricing

- **Double occupancy**: $700/person/day
- **Single occupancy**: $1,200/person/day
- Total = rate × guests × nights

## Customization

- Edit blocked dates manually in `script.js` (or add admin UI)
- Modify pricing in `script.js` (`pricePerDay` object)
- Customize email templates in `api/server.js`
- Adjust minimum nights in both frontend and backend validation

## Troubleshooting

**Calendar not showing blocked dates?**
- Check Railway API `/api/availability` endpoint
- Verify Supabase has confirmed bookings
- Check browser console for fetch errors

**Emails not sending?**
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for delivery logs
- Ensure domain is verified in Resend (if using custom domain)

**Database errors?**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase dashboard → Table Editor for bookings table
- Ensure schema was run successfully

---

**Need help?** Contact: jura@authenticai.ai

