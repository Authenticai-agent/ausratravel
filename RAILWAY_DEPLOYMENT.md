# Railway Deployment Setup

## Recommended: Native GitHub Integration (Easiest)

Railway's native GitHub integration automatically deploys your code when you push to GitHub. This is simpler than using GitHub Actions.

### Setup Steps:

1. **Connect GitHub to Railway:**
   - Go to your Railway project: https://railway.app/project/[YOUR_PROJECT_ID]
   - Click "Settings" → "GitHub"
   - Click "Connect GitHub Repository"
   - Select `Authenticai-agent/ausratravel`
   - Railway will automatically set up deployments

2. **Configure Service:**
   - In Railway, go to your service settings
   - Set "Root Directory" to `api`
   - Railway will automatically detect it's a Node.js project and deploy

3. **Configure Environment Variables:**
   - In Railway service settings → "Variables"
   - Add all required variables (SUPABASE_URL, RESEND_API_KEY, STRIPE_SECRET_KEY, etc.)

4. **Done!** Railway will now automatically deploy whenever you push to the `main` branch.

## Alternative: GitHub Actions (Current Setup)

The GitHub Actions workflow is configured but requires Railway CLI authentication. If you prefer GitHub Actions:

1. Ensure `RAILWAY_TOKEN` and `RAILWAY_PROJECT_ID` secrets are set in GitHub
2. The workflow will attempt to deploy using Railway CLI

Note: Railway's native GitHub integration is recommended as it's simpler and more reliable.

