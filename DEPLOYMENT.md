# 🚀 Deployment Checklist

## ✅ Before You Start
- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Gemini API key obtained
- [ ] Resend account created (optional for emails)

## 📝 Step-by-Step Deployment

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Frontend
Create `.env.local` file:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY
```

### 3️⃣ Deploy Database
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### 4️⃣ Configure Edge Function Secrets
```bash
npx supabase secrets set \
  RESEND_API_KEY=re_xxxxx \
  EMAIL_FROM=onboarding@resend.dev
```

### 5️⃣ Deploy Edge Functions
```bash
npx supabase functions deploy submit-alumni-memory --no-verify-jwt
npx supabase functions deploy create-admin --no-verify-jwt
npx supabase functions deploy get-media-signed-url --no-verify-jwt
npx supabase functions deploy export-submissions --no-verify-jwt
```

### 6️⃣ Create First Admin
Open Supabase Dashboard → SQL Editor → Run:
```sql
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES ('admin@yourdomain.com', crypt('YourSecurePassword123!', gen_salt('bf')), now(), now(), now());

INSERT INTO admin_profiles (id, email, role, first_login)
SELECT id, 'admin@yourdomain.com', 'super_admin', false
FROM auth.users WHERE email = 'admin@yourdomain.com';
```

### 7️⃣ Test Application
```bash
npm run dev
```

Visit:
- Public Portal: http://localhost:5173
- Admin Portal: http://localhost:5173/admin

## 🌐 Production Build
```bash
npm run build
npm run preview
```

## 📧 Email Configuration (Optional)
1. Go to https://resend.com/domains
2. Add your domain
3. Verify DNS records
4. Update secret: `npx supabase secrets set EMAIL_FROM=admin@yourdomain.com`
5. Redeploy create-admin function

## 🔍 Verify Deployment
- [ ] Frontend loads without errors
- [ ] Can submit alumni memory
- [ ] Can login to admin portal
- [ ] Can view submissions in dashboard
- [ ] Can approve/reject submissions
- [ ] Audio/video files play correctly
- [ ] Can create new admins

## ⚠️ Security Checklist
- [ ] `.env.local` is NOT committed to git
- [ ] Service role key only in Supabase secrets
- [ ] Admin portal requires authentication
- [ ] Storage buckets are private
- [ ] RLS policies are enabled

## 🐛 Common Issues

**401 Unauthorized on Edge Functions**
→ Redeploy with `--no-verify-jwt` flag

**Can't update submissions**
→ Run latest migrations: `npx supabase db push`

**Audio/video not loading**
→ Check storage buckets exist and are private

**Email not sending**
→ Verify Resend API key and domain (or use onboarding@resend.dev)

## 📞 Support
Check logs: Supabase Dashboard → Edge Functions → Logs
