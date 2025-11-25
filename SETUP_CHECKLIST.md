# Setup Checklist

##  Local Development Setup

- [x] Node.js dependencies installed (`npm install`)
- [x] Conda environment created (`strumsense` with Python 3.11)
- [x] Python libraries installed (librosa, numpy, scipy)
- [x] Project directories created (uploads/, data/)
- [ ] **OpenAI API key added to `.env.local`**
- [ ] Test local development (`npm run dev`)

---

## ù Getting OpenAI API Key

### Quick Steps:
1. Go to https://platform.openai.com/api-keys
2. Sign up / Log in
3. Add payment method (required after free $5 credits)
4. Create API key named "StrumSense"
5. Copy the key (starts with `sk-proj-...`)
6. Paste into `.env.local` file

### Cost Info:
- Free: $5 credits for new accounts
- Usage: ~$0.03-0.04 per audio analysis
- Monitor at: https://platform.openai.com/usage

---

## Ä Git & GitHub Setup

### Initialize and Push to GitHub

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Initial commit
git commit -m "Initial commit: StrumSense app"

# 4. Create GitHub repo at https://github.com/new
#    Name: StrumSense
#    Don't initialize with README

# 5. Connect and push (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/StrumSense.git
git branch -M main
git push -u origin main
```

**Checklist:**
- [ ] Git repository initialized
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Repository is public (or private if preferred)

---

##  Vercel Deployment

### Deploy to Vercel

```bash
# 1. Login to Vercel
vercel login

# 2. Deploy preview
vercel

# 3. Deploy production
vercel --prod
```

**Checklist:**
- [ ] Vercel account created
- [ ] Project deployed to Vercel
- [ ] Production URL working

---

## ‚öô Vercel Configuration

### In Vercel Dashboard (https://vercel.com/dashboard)

1. **Add Environment Variables:**
   - [ ] Go to Settings ‚Üí Environment Variables
   - [ ] Add `OPENAI_API_KEY` (paste your key)
   - [ ] Select all environments (Production, Preview, Development)
   - [ ] Save

2. **Enable Analytics:**
   - [ ] Go to Analytics tab
   - [ ] Should show "Enabled" (auto-enabled via vercel.json)

3. **Verify Speed Insights:**
   - [ ] Go to Speed Insights tab
   - [ ] Should show "Enabled" (auto-enabled via package)

4. **Redeploy:**
   - [ ] Go to Deployments tab
   - [ ] Redeploy to apply environment variables

---

## ó Connect GitHub Auto-Deploy (Optional)

### Steps:
1. [ ] Go to Vercel Dashboard ‚Üí Add New ‚Üí Project
2. [ ] Click "Import Git Repository"
3. [ ] Authorize GitHub
4. [ ] Select StrumSense repository
5. [ ] Add environment variables if needed
6. [ ] Deploy

**Result:** Every `git push` auto-deploys to Vercel!

---

##  Testing Your Deployment

### Test Demo Mode (No Upload Required):
```
https://your-app.vercel.app/api/demo?style=slow_fingerstyle&mood=chill
```

**Test checklist:**
- [ ] Demo API returns recommendations
- [ ] Health check works: `/api/health`
- [ ] Main page loads
- [ ] Analytics tracking works (check in 24h)

---

## ä Monitoring

### Check These URLs:

**OpenAI Usage:**
- https://platform.openai.com/usage

**Vercel Analytics:**
- https://vercel.com/YOUR_USERNAME/strumsense/analytics

**Speed Insights:**
- https://vercel.com/YOUR_USERNAME/strumsense/speed-insights

**Vercel Logs:**
```bash
vercel logs
```

---

## Ø Final Checklist

- [ ] OpenAI API key configured
- [ ] Local dev working (`npm run dev`)
- [ ] Code on GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] Analytics enabled
- [ ] Speed Insights enabled
- [ ] Demo mode tested
- [ ] Shared URL with friends! ∏

---

## ± Your Live URLs

After deployment, you'll have:

- **Production:** `https://strumsense.vercel.app`
- **Demo API:** `https://strumsense.vercel.app/api/demo?style=slow_fingerstyle&mood=chill`
- **Health Check:** `https://strumsense.vercel.app/api/health`
- **GitHub:** `https://github.com/YOUR_USERNAME/StrumSense`

---

## ò Quick Troubleshooting

**OpenAI errors:**
- Check key in Vercel environment variables
- Verify credits remaining at platform.openai.com/usage

**Deployment fails:**
- Check `vercel logs`
- Verify all dependencies in package.json

**Analytics not showing:**
- Wait 24 hours for initial data
- Verify `@vercel/analytics` installed
- Check `_app.js` has Analytics component

**Need help?**
- Vercel docs: https://vercel.com/docs
- OpenAI docs: https://platform.openai.com/docs

---

Ready to deploy! Ä
