# Deploy StrumSense to GitHub and Vercel

## Step 1: Push to GitHub

Open your terminal and run these commands:

```bash
cd "c:\Users\jasom\Documents\Coding Projects\StrumSense"

git init

git add .

git commit -m "Initial commit: StrumSense - free AI acoustic cover app"
```

Now create a GitHub repository:
1. Go to https://github.com/new
2. Repository name: `StrumSense`
3. Description: `AI-powered acoustic guitar cover recommendation app`
4. Choose Public or Private
5. DO NOT check "Initialize with README"
6. Click "Create repository"

Connect and push to GitHub (replace YOUR_USERNAME with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/StrumSense.git

git branch -M main

git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Dashboard (Easiest)

1. Go to https://vercel.com/
2. Sign up/login with GitHub
3. Click "Add New" > "Project"
4. Import your StrumSense repository
5. Click "Deploy"
6. Wait 2-3 minutes
7. Done!

### Option B: CLI

```bash
npm install -g vercel

vercel login

vercel --prod
```

## Step 3: Test Your Deployment

Visit these URLs (replace with your actual URL):

Health Check:
```
https://your-app.vercel.app/api/health
```

Demo Mode:
```
https://your-app.vercel.app/api/demo?style=slow_fingerstyle&mood=chill
```

Main App:
```
https://your-app.vercel.app
```

## Important Notes

### No Configuration Needed
- No environment variables required
- No API keys needed
- Analytics already enabled via package
- Speed Insights already enabled via package

### Analytics & Speed Insights

Both are automatically enabled because:
- Analytics component in `_app.js`
- Speed Insights component in `_app.js`
- `@vercel/analytics` installed
- `@vercel/speed-insights` installed

View them in Vercel dashboard after 24 hours of usage.

### Auto-Deploy

If you deployed via Dashboard (Option A), auto-deploy is already set up.

Every time you push to GitHub, Vercel will automatically deploy:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## That's It!

Your app is now:
- Live on Vercel
- 100% free (no API costs)
- Analytics enabled
- Speed tracking enabled
- Auto-deploying from GitHub

Total cost: $0
Total time: 5-10 minutes

Enjoy your free AI music app!
