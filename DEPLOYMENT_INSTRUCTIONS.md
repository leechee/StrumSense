# StrumSense - Complete Deployment Instructions

## Overview

This guide will help you deploy your free AI acoustic cover recommendation app to GitHub and Vercel.

**Time Required:** 5-10 minutes
**Cost:** $0 (completely free)

---

## Prerequisites

- Git installed on your computer
- GitHub account (free)
- Vercel account (free - can sign up with GitHub)

---

## Part 1: Push to GitHub

### Step 1: Initialize Git Repository

Open your terminal/command prompt and navigate to the project:

```bash
cd "c:\Users\jasom\Documents\Coding Projects\StrumSense"
```

Initialize git:

```bash
git init
```

### Step 2: Stage All Files

```bash
git add .
```

### Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: StrumSense - free AI acoustic cover app"
```

### Step 4: Create GitHub Repository

1. Open your browser and go to: **https://github.com/new**

2. Fill in the repository details:
   - **Repository name:** `StrumSense`
   - **Description:** `AI-powered acoustic guitar cover recommendation app - 100% free`
   - **Visibility:** Choose Public or Private
   - **IMPORTANT:** Do NOT check "Initialize this repository with a README"

3. Click **"Create repository"**

### Step 5: Connect to GitHub

After creating the repository, GitHub will show you some commands. Use these (replace YOUR_USERNAME with your actual GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/StrumSense.git
```

Set the main branch:

```bash
git branch -M main
```

Push your code:

```bash
git push -u origin main
```

### Step 6: Verify

Go to your repository URL in your browser:
```
https://github.com/YOUR_USERNAME/StrumSense
```

You should see all your project files!

---

## Part 2: Deploy to Vercel

You can deploy using either the Dashboard (easier) or CLI.

### Option A: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Sign Up/Login

1. Go to: **https://vercel.com/**
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

#### Step 2: Import Repository

1. Click the **"Add New..."** button (top right)
2. Select **"Project"**
3. You'll see a list of your GitHub repositories
4. Find **"StrumSense"** and click **"Import"**

#### Step 3: Configure Project

Vercel will auto-detect Next.js. The default settings are perfect - you don't need to change anything:

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** ./
- **Build Command:** npm run build
- **Output Directory:** .next
- **Install Command:** npm install

**Environment Variables:** Leave this section EMPTY - no variables needed!

#### Step 4: Deploy

1. Click the **"Deploy"** button
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your URL

#### Step 5: Get Your Live URL

Your app is now live! The URL will be something like:
```
https://strumsense.vercel.app
```

Or:
```
https://strumsense-username.vercel.app
```

---

### Option B: Deploy via CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login

```bash
vercel login
```

Choose your preferred login method (Email, GitHub, etc.)

#### Step 3: Deploy to Production

```bash
vercel --prod
```

Answer the prompts:
- **Set up and deploy?** Y
- **Which scope?** (Select your account)
- **Link to existing project?** N
- **What's your project's name?** strumsense (or press Enter)
- **In which directory is your code?** ./ (press Enter)
- **Want to override settings?** N

The CLI will show your live URL when deployment is complete.

---

## Part 3: Test Your Deployment

After deployment is complete, test these endpoints (replace with your actual URL):

### 1. Health Check

Visit:
```
https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "checks": {
    "server": "running",
    "mode": "100% free - no API keys required",
    "ai_engine": "librosa (local ML) + rule-based matching"
  }
}
```

### 2. Demo Mode

Visit:
```
https://your-app.vercel.app/api/demo?style=slow_fingerstyle&mood=chill
```

Should return JSON with song recommendations.

### 3. Main Application

Visit:
```
https://your-app.vercel.app
```

You should see the upload interface!

---

## Part 4: Verify Analytics & Speed Insights

Both are automatically enabled because they're already configured in your app:

### Analytics

1. Go to your Vercel Dashboard
2. Click on your **"strumsense"** project
3. Click the **"Analytics"** tab
4. You should see "Analytics Enabled"
5. Data will appear after you get visitors (can take 24 hours)

### Speed Insights

1. In your Vercel project dashboard
2. Click the **"Speed Insights"** tab
3. You should see "Speed Insights Enabled"
4. Performance metrics will appear as users visit

---

## Part 5: Enable Auto-Deploy from GitHub

If you used **Option A (Dashboard)**, this is already set up!

Every time you push to GitHub, Vercel will automatically deploy:

```bash
# Make a change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deploy"
git push origin main
```

Go to your Vercel dashboard and watch it deploy automatically!

---

## Important Notes

### No Environment Variables Needed

Unlike many apps, StrumSense requires NO configuration:
- No API keys
- No secrets
- No environment variables
- Just deploy and it works!

### Analytics & Speed Insights

These are automatically enabled via:
- Code in `_app.js` imports Analytics and SpeedInsights components
- Packages `@vercel/analytics` and `@vercel/speed-insights` installed

No additional configuration needed in Vercel dashboard.

### Python/Conda for Production

For local development, you use the conda environment.

For Vercel production:
- Demo mode works perfectly (no Python needed)
- Full audio upload may have limitations on Vercel's free tier
- Python processing will be handled by Vercel's runtime automatically

---

## Troubleshooting

### Git push fails

If you get a permission error:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/StrumSense.git
```

Make sure you're logged into GitHub in your browser.

### Vercel build fails

1. Check the build logs in Vercel dashboard
2. Common issues:
   - Missing dependencies: Run `npm install` locally first
   - Build errors: Test with `npm run build` locally

### Can't access live URL

1. Make sure deployment shows "Ready" in Vercel dashboard
2. Try the preview URL first
3. Clear browser cache and try again

### Analytics not showing

1. Wait 24 hours for data to populate
2. Make sure you have visitors
3. Check that packages are installed: `npm list @vercel/analytics`

---

## Your Live URLs

After deployment, bookmark these:

- **Production App:** https://your-app.vercel.app
- **GitHub Repo:** https://github.com/YOUR_USERNAME/StrumSense
- **Vercel Dashboard:** https://vercel.com/YOUR_USERNAME/strumsense
- **Analytics:** https://vercel.com/YOUR_USERNAME/strumsense/analytics
- **Speed Insights:** https://vercel.com/YOUR_USERNAME/strumsense/speed-insights

---

## Next Steps

1. **Test all endpoints** - Health, demo, main app
2. **Share your URL** - Send to friends and musicians
3. **Monitor analytics** - Check after 24 hours
4. **Make updates** - Just push to GitHub and it auto-deploys
5. **Add features** - Expand the song database or improve matching

---

## Summary

You just deployed:
- A fully functional AI music app
- With analytics and speed tracking
- Auto-deploying from GitHub
- Completely free to run
- No API keys or configuration needed

**Total Time:** 5-10 minutes
**Total Cost:** $0
**Ongoing Cost:** $0

Congratulations! Your app is live and ready to help guitarists find their next cover song.
