# Fix: Railway Root Directory Configuration

## Problem
The API endpoints are returning HTML instead of JSON, which means Railway is serving from the wrong directory.

## Solution: Set Root Directory in Railway

1. **Go to Railway Dashboard:**
   - https://railway.app/project/44e50305-ee4f-402d-9b7f-54ce9e3bf777
   - Click on service: **ausratravel**

2. **Go to Settings:**
   - Click **Settings** tab
   - Scroll to **Root Directory** section

3. **Set Root Directory:**
   - Set **Root Directory** to: `api`
   - This tells Railway to build and deploy from the `api` folder

4. **Verify:**
   - Railway should redeploy automatically
   - Check **Deployments** tab to see new deployment
   - Once deployed, test: https://ausratravel-production.up.railway.app/api/health
   - Should return: `{"status":"ok","timestamp":"..."}`

## Why This Matters

Without the Root Directory set to `api`:
- Railway tries to serve from the repository root
- It finds `index.html` (the frontend) instead of `server.js` (the API)
- API endpoints return HTML instead of JSON
- CORS errors occur because the frontend is being served as the API

With Root Directory set to `api`:
- Railway serves from the `api` folder
- Finds `server.js` and runs it correctly
- API endpoints return JSON as expected
- CORS works properly

## After Setting Root Directory

After setting the Root Directory, Railway will automatically redeploy. Once the deployment completes:
- API will work correctly
- CORS errors will be resolved
- Reviews, availability, Stripe config will all work

