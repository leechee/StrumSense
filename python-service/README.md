# StrumSense Python Audio Analysis Service

This is the Python microservice for audio fingerprinting and analysis.

## Deploy to Render (Free!)

1. Go to https://render.com and sign up with GitHub (free, no credit card)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `python-service`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free
5. Click "Create Web Service"
6. Render will automatically deploy

## Get the Service URL

After deployment:
1. Your service URL will be shown (e.g., `https://strumsense-audio-analysis.onrender.com`)
2. Copy this URL

## Configure Vercel

In your Vercel project settings:
1. Go to "Settings" → "Environment Variables"
2. Add:
   - Name: `PYTHON_SERVICE_URL`
   - Value: `https://your-service.onrender.com` (your Render URL)
3. Redeploy your Vercel project

## Local Development

The Python service won't run locally - it's only for Render deployment.
Your local development will continue using the conda environment.

## How It Works

- **Local**: Uses conda Python environment directly
- **Production**: Vercel calls Render Python service via HTTP

## Note about Free Tier

Render's free tier spins down after 15 minutes of inactivity. The first request after spin-down will take ~30 seconds. This is normal for free tier.
