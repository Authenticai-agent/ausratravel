# Setup Automatic Railway Deployments

Follow these steps to enable automatic deployments from GitHub to Railway:

## Step 1: Connect GitHub to Railway

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/project/44e50305-ee4f-402d-9b7f-54ce9e3bf777

2. **Connect GitHub Repository:**
   - Click on your service: **ausratravel**
   - Go to **Settings** tab
   - Scroll to **Source** section (or **GitHub** section)
   - Click **Connect GitHub Repository**
   - Authorize Railway to access your GitHub account if prompted
   - Select repository: **Authenticai-agent/ausratravel**
   - Click **Connect**

## Step 2: Configure Service Settings

1. **Set Root Directory:**
   - In your service settings, find **Root Directory**
   - Set it to: `api`
   - This tells Railway where your code is located

2. **Verify Build Settings:**
   - Railway will auto-detect Node.js from `package.json`
   - Build Command: `npm install` (auto-detected)
   - Start Command: `npm start` (from package.json)

## Step 3: Configure Branch

1. **Set Deployment Branch:**
   - In service settings → **Deployments**
   - Ensure **Branch** is set to: `main`
   - Railway will deploy automatically when you push to `main`

## Step 4: Verify Environment Variables

Make sure all required environment variables are set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `TO_EMAIL` (optional, defaults to jura@authenticai.ai)

Go to: Service → **Variables** tab → Add all variables

## Step 5: Test Automatic Deployment

1. Make a small change to any file in `api/` directory
2. Commit and push:
   ```bash
   git add api/
   git commit -m "Test automatic deployment"
   git push
   ```
3. Go to Railway dashboard → **Deployments** tab
4. You should see a new deployment automatically triggered!

## Done! ✅

Now every time you push to the `main` branch, Railway will automatically:
- Detect the change
- Build your application
- Deploy to production
- Your API will be live at: https://ausratravel-production.up.railway.app

## Optional: Disable GitHub Actions Workflow

Since Railway now handles deployments automatically, you can optionally disable the GitHub Actions workflow to avoid confusion:

1. Go to: https://github.com/Authenticai-agent/ausratravel/settings/actions
2. Under **Workflow permissions**, you can disable workflows if desired
3. Or just leave it - it won't interfere since Railway handles deployments

## Troubleshooting

**If deployments don't trigger:**
- Check that GitHub repository is connected in Railway
- Verify the branch is set to `main`
- Check Railway dashboard for any errors
- Ensure `api/` directory is correct in Root Directory setting

**If deployment fails:**
- Check **Logs** tab in Railway dashboard
- Verify all environment variables are set
- Check that `package.json` has correct scripts
- Ensure all dependencies are in `package.json`

