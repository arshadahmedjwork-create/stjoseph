# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Your Supabase project credentials

## Steps to Deploy

### 1. Prepare Your Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Prepare for Vercel deployment"

# Create a GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Add Environment Variables** (Critical!):
   - Click **"Environment Variables"**
   - Add the following:
     - `VITE_SUPABASE_URL` = `https://txqawxgoazhoehpybzvj.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = Your anon key from Supabase
     - `VITE_GEMINI_API_KEY` = Your Gemini API key
   
6. Click **"Deploy"**

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your username
# - Link to existing project? No
# - Project name? st-joseph-alumni
# - Directory? ./ (current)
# - Override settings? No

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_GEMINI_API_KEY

# Deploy to production
vercel --prod
```

### 3. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **txqawxgoazhoehpybzvj**
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (for `VITE_SUPABASE_URL`)
   - **anon public** key (for `VITE_SUPABASE_ANON_KEY`)

### 4. Update Supabase Allowed Origins

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`

### 5. Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update Supabase allowed origins with your custom domain

## Project Structure
```
dist/               # Build output (auto-generated)
├── assets/         # Compiled JS/CSS
└── index.html      # Entry point
```

## Environment Variables Required
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon public key
- `VITE_GEMINI_API_KEY` - Google Gemini API key

## Automatic Deployments
Once connected to GitHub, Vercel will:
- **Auto-deploy** on every push to `main` branch
- Generate **preview deployments** for pull requests
- Show **build logs** for debugging

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility (Vercel uses Node 18+)

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding/updating environment variables
- Check for typos in variable names

### Routing Issues (404 on refresh)
- The `vercel.json` file handles this by rewriting all routes to `index.html`
- Ensure `vercel.json` is committed to your repository

### CORS Errors
- Add your Vercel domain to Supabase allowed origins
- Check Network tab in browser DevTools for error details

### Audio/Video Upload Issues
- Ensure Supabase Storage buckets are publicly accessible (if needed)
- Check storage policies in Supabase Dashboard

## Useful Commands
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs YOUR_DEPLOYMENT_URL

# Rollback to previous deployment
vercel rollback

# Remove deployment
vercel rm YOUR_DEPLOYMENT_NAME
```

## Production Checklist
- ✅ Environment variables configured
- ✅ Supabase allowed origins updated
- ✅ Build succeeds locally (`npm run build`)
- ✅ Preview build works (`npm run preview`)
- ✅ Edge Functions deployed
- ✅ Database migrations applied
- ✅ Storage buckets configured
- ✅ RLS policies enabled
- ✅ Admin accounts created
- ✅ Email templates configured

## Support
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- GitHub Issues: Create an issue in your repository
