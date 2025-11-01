# How to Deploy to Railway

## 🚀 Quick Methods

### Method 1: Manual Deployment (CLI)
```bash
cd api
railway up --detach
```

### Method 2: Automatic Deployment (Recommended)

**Set up Railway's GitHub Integration:**

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/project/44e50305-ee4f-402d-9b7f-54ce9e3bf777

2. **Connect GitHub:**
   - Click **Settings** → **GitHub** (or **Source**)
   - Click **Connect GitHub Repository**
   - Authorize Railway to access GitHub
   - Select repository: `Authenticai-agent/ausratravel`
   - Railway will automatically detect the `api` directory

3. **Configure Service:**
   - In your service settings, ensure:
     - **Root Directory:** `api`
     - **Build Command:** (auto-detected from package.json)
     - **Start Command:** `npm start`

4. **Set Environment Variables:**
   - Go to service → **Variables**
   - Add all required variables:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_key
     RESEND_API_KEY=your_resend_key
     STRIPE_SECRET_KEY=your_stripe_secret
     STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
     PORT=3001
     ```

5. **Done!** Now every push to `main` will automatically trigger a deployment.

### Method 3: Deploy from Railway Dashboard

1. Go to your Railway project
2. Click **Deploy** or **Redeploy** button in the service
3. Railway will deploy the latest code

## 🔍 Monitor Deployments

- **Railway Dashboard:** https://railway.app/project/44e50305-ee4f-402d-9b7f-54ce9e3bf777
- **Deployments Tab:** Shows all deployment history
- **Logs Tab:** Real-time build and runtime logs

## ✅ Verify Deployment

After deployment completes, check:
- **Health:** https://ausratravel-production.up.railway.app/health
- **API Root:** https://ausratravel-production.up.railway.app/

## 🛠️ Troubleshooting

**If deployment fails:**
1. Check the **Logs** tab in Railway dashboard
2. Verify all environment variables are set
3. Ensure `package.json` has correct scripts
4. Check that all dependencies are in `package.json`

**Common issues:**
- Missing environment variables → Add in Railway service Variables
- Build errors → Check build logs in Railway dashboard
- Port issues → Ensure `PORT` variable is set (Railway auto-assigns, but your code should use `process.env.PORT`)

