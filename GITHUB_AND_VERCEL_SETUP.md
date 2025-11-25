# GitHub and Vercel Deployment Guide

## Step-by-Step Instructions

### Part 1: Create GitHub Repository and Push Code

#### Step 1: Initialize Git Repository

Open your terminal and navigate to the project:

```bash
cd "c:\Users\jasom\Documents\Coding Projects\StrumSense"
```

Initialize git:

```bash
git init
```

Add all files:

```bash
git add .
```

Create your first commit:

```bash
git commit -m "Initial commit: StrumSense - free AI acoustic cover recommendation app"
```

#### Step 2: Create GitHub Repository

1. Go to https://github.com/new in your web browser

2. Fill in the repository details:
   - **Repository name**: `StrumSense`
   - **Description**: `AI-powered acoustic guitar cover recommendation app - 100% free`
   - **Visibility**: Choose Public or Private
   - **IMPORTANT**: Do NOT check "Initialize with README" (you already have one)

3. Click "Create repository"

#### Step 3: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/StrumSense.git
```

Set the branch to main:

```bash
git branch -M main
```

Push your code to GitHub:

```bash
git push -u origin main
```

#### Step 4: Verify Upload

Go to your GitHub repository URL:
```
https://github.com/YOUR_USERNAME/StrumSense
```

You should see all your files there!

---

### Part 2: Deploy to Vercel

You have two options: via Dashboard (easier) or via CLI.

#### Option A: Deploy via Vercel Dashboard (Recommended)

**Step 1: Sign Up / Login to Vercel**

1. Go to https://vercel.com/
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

**Step 2: Import Your Repository**

1. Click "Add New..." button (top right)
2. Select "Project"
3. You'll see your GitHub repositories
4. Find "StrumSense" and click "Import"

**Step 3: Configure Project**

Vercel will auto-detect Next.js. The default settings are perfect:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./`
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `.next` (auto-filled)
- **Install Command**: `npm install` (auto-filled)

**Environment Variables**: None needed! Just leave this section empty.

**Step 4: Deploy**

1. Click "Deploy" button
2. Wait 2-3 minutes for the build to complete
3. You'll see "Congratulations!" when done

**Step 5: Get Your Live URL**

Your app is now live at:
```
https://strumsense.vercel.app
```

Or a similar URL like:
```
https://strumsense-username.vercel.app
```

#### Option B: Deploy via CLI

**Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: Login to Vercel**

```bash
vercel login
```

Choose your preferred login method (Email, GitHub, GitLab, or Bitbucket).

**Step 3: Deploy Preview**

```bash
vercel
```

Answer the prompts:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- What's your project's name? **strumsense** (or press Enter for default)
- In which directory is your code? **./** (press Enter)
- Want to override settings? **N**

**Step 4: Deploy to Production**

```bash
vercel --prod
```

Your app is now live! The CLI will show you the URL.

---

### Part 3: Verify Deployment

#### Check Health Endpoint

Visit:
```
https://your-app.vercel.app/api/health
```

You should see:
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

#### Test Demo Mode

Visit:
```
https://your-app.vercel.app/api/demo?style=slow_fingerstyle&mood=chill
```

You should get JSON with song recommendations.

#### Test Main App

Visit:
```
https://your-app.vercel.app
```

You should see the upload interface!

---

### Part 4: Enable Analytics and Speed Insights

**Good news**: These are already configured and will work automatically!

#### Verify Analytics

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your "strumsense" project
3. Click "Analytics" tab
4. You should see "Analytics Enabled"
5. Data will appear after 24 hours of use

#### Verify Speed Insights

1. In your Vercel project dashboard
2. Click "Speed Insights" tab
3. You should see "Speed Insights Enabled"
4. Real-time performance data will appear as users visit

---

### Part 5: Connect GitHub for Auto-Deploy (Optional but Recommended)

If you used Option A (Dashboard), this is already done!

If you used Option B (CLI), you can connect it:

1. Go to https://vercel.com/dashboard
2. Find your "strumsense" project
3. Go to Settings > Git
4. Click "Connect Git Repository"
5. Select your GitHub repository
6. Click "Connect"

**Now**: Every time you push to GitHub, Vercel automatically deploys!

Test it:
```bash
# Make a small change
echo "# Auto-deploy test" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deploy"
git push origin main
```

Go to Vercel dashboard and watch it deploy automatically!

---

### Part 6: Important Notes

#### No Environment Variables Needed

Unlike the old version with OpenAI:
- No API keys to configure
- No secrets to manage
- Just works out of the box

#### Python/Conda in Production

For local development, you use the conda environment.

For Vercel production, Python will be handled automatically by Vercel's runtime. However, note:

**Important**: Full audio upload may not work on Vercel's free tier due to Python environment limitations. But the demo mode and recommendation engine will work perfectly!

For full functionality with audio uploads, you have two options:
1. Use demo mode (works perfectly on Vercel)
2. Deploy Python separately (Railway, Heroku, etc.) and call it from Vercel

#### Free Tier Limits

Vercel Free Tier includes:
- 100GB bandwidth per month
- Unlimited deployments
- Unlimited API requests
- Perfect for this app!

---

## Quick Reference Commands

### Git Commands
```bash
# Initialize repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Your message"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/StrumSense.git

# Push to GitHub
git push -u origin main

# Future pushes
git push
```

### Vercel Commands
```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

---

## Troubleshooting

### Git push fails - Permission denied

Run:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/StrumSense.git
```

Make sure you're logged into GitHub in your browser.

### Vercel build fails

Check the build logs in the Vercel dashboard. Common issues:
- Missing dependencies: Run `npm install` locally first
- Build errors: Run `npm run build` locally to test

### Analytics not showing

- Wait 24 hours for data to populate
- Verify you have visitors
- Check that `@vercel/analytics` is in package.json

### Can't access Vercel URL

- Make sure deployment finished successfully
- Check Vercel dashboard for deployment status
- Try the preview URL first before production URL

---

## Your URLs After Deployment

- **Production**: `https://strumsense.vercel.app`
- **GitHub Repo**: `https://github.com/YOUR_USERNAME/StrumSense`
- **Vercel Dashboard**: `https://vercel.com/YOUR_USERNAME/strumsense`
- **Analytics**: `https://vercel.com/YOUR_USERNAME/strumsense/analytics`
- **Speed Insights**: `https://vercel.com/YOUR_USERNAME/strumsense/speed-insights`

---

## Next Steps After Deployment

1. Test all endpoints (health, demo, main app)
2. Share your URL with friends
3. Monitor analytics after 24 hours
4. Make improvements and push to auto-deploy
5. Add more song patterns to improve recognition

---

## Summary

What you just did:
1. Created a Git repository
2. Pushed code to GitHub
3. Deployed to Vercel (free tier)
4. Enabled analytics and speed insights
5. Set up auto-deploy from GitHub

Total cost: $0
Total time: 5-10 minutes

Your app is now live and free for everyone to use!
