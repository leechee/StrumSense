# Deployment Guide - StrumSense

## Getting Your OpenAI API Key

### Is it Free?
OpenAI API is **NOT free**, but you get:
- **$5 free credits** when you first sign up (for new accounts)
- Credits expire after 3 months
- After free credits, you pay as you go (very affordable for personal projects)

### Typical Costs for This App:
- GPT-4 (song recognition): ~$0.03 per request
- GPT-3.5 (vibe descriptions): ~$0.002 per request
- **Estimated**: ~$0.03-0.04 per audio upload analysis

### How to Get Your API Key:

1. **Go to OpenAI Platform**
   - Visit: https://platform.openai.com/

2. **Create Account / Sign In**
   - Sign up with email or Google account
   - Verify your email address

3. **Add Payment Method** (required after free credits)
   - Go to: https://platform.openai.com/settings/organization/billing
   - Add credit card
   - Set spending limits (recommended: $5-10/month for testing)

4. **Create API Key**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name it: "StrumSense"
   - **Copy the key immediately** (you can't see it again!)
   - It looks like: `sk-proj-xxxxxxxxxxxxxxxxxxxxx`

5. **Add to Your Project**
   - Open `.env.local` in StrumSense folder
   - Replace `your_openai_api_key_here` with your actual key
   - Save the file

6. **Check Your Usage**
   - Monitor at: https://platform.openai.com/usage

---

## Part 1: Create Git Repository

### Step 1: Initialize Git Repository

```bash
cd "c:\Users\jasom\Documents\Coding Projects\StrumSense"

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: StrumSense acoustic cover recommendation app"
```

### Step 2: Create GitHub Repository

**Option A: Using GitHub CLI (if installed)**
```bash
gh repo create StrumSense --public --source=. --remote=origin --push
```

**Option B: Using GitHub Website (recommended)**

1. Go to https://github.com/new

2. **Repository settings:**
   - Name: `StrumSense`
   - Description: `AI-powered acoustic guitar cover recommendation app`
   - Visibility: Public (or Private)
   - **Don't** initialize with README (we already have one)

3. Click "Create repository"

4. **Connect your local repo:**
   ```bash
   # Replace YOUR_USERNAME with your GitHub username
   git remote add origin https://github.com/YOUR_USERNAME/StrumSense.git

   git branch -M main

   git push -u origin main
   ```

### Step 3: Verify Upload

Go to your GitHub repository URL and verify all files are there (except those in .gitignore).

---

## Part 2: Deploy to Vercel

### Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Choose your login method (GitHub, GitLab, Bitbucket, or Email).

### Step 3: Deploy from Local Directory

```bash
cd "c:\Users\jasom\Documents\Coding Projects\StrumSense"

# Deploy (this will prompt you with questions)
vercel
```

**Answer the prompts:**
- Set up and deploy? **Y**
- Which scope? (choose your account)
- Link to existing project? **N**
- What's your project's name? **strumsense** (or keep default)
- In which directory is your code located? **./** (press Enter)
- Want to override settings? **N**

This creates a **preview deployment**.

### Step 4: Deploy to Production

```bash
vercel --prod
```

You'll get a production URL like: `https://strumsense.vercel.app`

---

## Part 3: Configure Vercel Settings

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your `strumsense` project

2. **Add Environment Variables**
   - Go to: **Settings** → **Environment Variables**

   - Add `OPENAI_API_KEY`:
     - Name: `OPENAI_API_KEY`
     - Value: `sk-proj-xxxxxxxxxxxxx` (your actual key)
     - Environment: Check all (Production, Preview, Development)
     - Click "Save"

3. **Enable Analytics** (should already be enabled via vercel.json)
   - Go to: **Analytics** tab
   - Verify it shows "Analytics Enabled"
   - Click "Enable" if not already enabled

4. **Enable Speed Insights** (auto-enabled with package install)
   - Go to: **Speed Insights** tab
   - Verify it shows "Speed Insights Enabled"
   - Should be automatically enabled since we installed `@vercel/speed-insights`

5. **Set Build Settings** (if needed)
   - Go to: **Settings** → **General**
   - Build Command: `npm run build` (should be auto-detected)
   - Output Directory: `.next` (should be auto-detected)
   - Install Command: `npm install` (should be auto-detected)

6. **Redeploy** (to apply environment variables)
   - Go to: **Deployments** tab
   - Click the "..." menu on latest deployment
   - Click "Redeploy"
   - Check "Use existing Build Cache"
   - Click "Redeploy"

### Method 2: Using Vercel CLI

```bash
# Add environment variable
vercel env add OPENAI_API_KEY

# When prompted:
# - Value: [paste your OpenAI API key]
# - Environments: Select all (Production, Preview, Development)

# Redeploy to production
vercel --prod
```

---

## Part 4: Connect GitHub to Vercel (Auto-Deploy)

This enables automatic deployments when you push to GitHub.

### Step 1: Import from GitHub

1. Go to Vercel Dashboard: https://vercel.com/dashboard

2. Click "Add New..." → "Project"

3. Click "Import Git Repository"

4. Authorize GitHub access if prompted

5. Find and select your `StrumSense` repository

6. Click "Import"

7. **Configure Project:**
   - Framework Preset: Next.js (should auto-detect)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

8. **Add Environment Variables** (if not already added):
   - `OPENAI_API_KEY` = your key

9. Click "Deploy"

### Step 2: Verify Auto-Deploy

Now every time you push to GitHub, Vercel will automatically deploy!

**Test it:**
```bash
# Make a small change
echo "# Auto-deploy test" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deploy"
git push origin main
```

Go to Vercel dashboard and watch the deployment happen automatically!

---

## Part 5: Monitor Your Deployment

### Vercel Analytics
- View at: `https://vercel.com/YOUR_USERNAME/strumsense/analytics`
- Shows: Page views, visitors, top pages
- Real-time data

### Speed Insights
- View at: `https://vercel.com/YOUR_USERNAME/strumsense/speed-insights`
- Shows: Performance metrics, Core Web Vitals
- Real User Monitoring (RUM)

### OpenAI Usage
- View at: https://platform.openai.com/usage
- Monitor API costs
- Set usage alerts

---

## Important Notes

### Python/Conda on Vercel

⚠ **IMPORTANT**: Vercel serverless functions don't support conda environments directly.

**For production deployment, you have two options:**

**Option 1: Use Vercel's Python Runtime** (Recommended)
- Vercel supports Python 3.9 natively
- Librosa works on Python 3.9
- Update `requirements.txt` to use compatible versions

**Option 2: Use External API for Audio Analysis**
- Deploy Python service separately (Heroku, Railway, etc.)
- Call it from Vercel API routes
- More complex but more reliable

**For now (testing):** The demo mode will work perfectly on Vercel!

### Testing Without Audio Upload

Your app has a built-in demo mode that works on Vercel:
- Visit: `https://your-app.vercel.app/api/demo?style=slow_fingerstyle&mood=chill`
- No Python needed!
- Perfect for showcasing the recommendation engine

---

## Quick Reference Commands

```bash
# Local development
npm run dev

# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs

# Remove deployment
vercel remove strumsense

# Git workflow
git add .
git commit -m "Your message"
git push origin main  # Auto-deploys to Vercel if connected
```

---

## Troubleshooting

### Deployment fails
- Check Vercel logs: `vercel logs`
- Verify environment variables are set
- Check build command is correct

### Analytics not showing
- Wait 24 hours for data to populate
- Verify `@vercel/analytics` is installed
- Check component is imported in `_app.js`

### API key errors
- Verify key is correct in Vercel dashboard
- Check you have OpenAI credits remaining
- Redeploy after adding environment variables

### Python script fails on Vercel
- Use demo mode for now: `/api/demo`
- Consider deploying Python separately
- Or use JavaScript-based audio analysis

---

## Next Steps After Deployment

1.  Test the demo mode: `/api/demo?style=slow_fingerstyle`
2.  Share your live URL!
3.  Monitor analytics and speed insights
4.  Add custom domain (optional)
5.  Set up staging environment (optional)

Your app is now live! �
