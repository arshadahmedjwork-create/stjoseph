# 🎓 St. Joseph Alumni Portal

## 📦 Quick Setup (5 Minutes)

### Step 1: Install
```bash
npm install
```

### Step 2: Configure Environment
Create `.env.local` with these values:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
```

Get credentials:
- Supabase: https://supabase.com/dashboard → Project Settings → API
- Gemini: https://makersuite.google.com/app/apikey

### Step 3: Deploy Database
```bash
npx supabase db push
```

### Step 4: Deploy Edge Functions
```bash
# Set secrets
npx supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM=onboarding@resend.dev

# Deploy functions
npx supabase functions deploy submit-alumni-memory --no-verify-jwt
npx supabase functions deploy create-admin --no-verify-jwt
npx supabase functions deploy get-media-signed-url --no-verify-jwt
npx supabase functions deploy export-submissions --no-verify-jwt
```

### Step 5: Run
```bash
npm run dev
```

## 🔐 Create First Admin

Use Supabase Dashboard → SQL Editor:
```sql
-- Create user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@example.com', crypt('ChangeMe123!', gen_salt('bf')), now(), now(), now());

-- Make them admin
INSERT INTO admin_profiles (id, email, role, first_login)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'admin@example.com',
  'super_admin',
  false
);
```

Login at: `http://localhost:5173/admin`

## 📁 Structure

```
pages/AlumniPortal/    → Public submission pages
pages/AdminPortal/     → Admin dashboard
supabase/migrations/   → Database schema
supabase/functions/    → Serverless API
```

## 🛠️ Tech Stack

React + TypeScript + Supabase + Gemini AI + Resend

## 📧 Email (Optional)

Get free Resend API key: https://resend.com/api-keys
- 3,000 emails/month free
- Use `onboarding@resend.dev` for testing

## ⚠️ Important

Never commit `.env.local` to version control!
