# 🚀 Vercel Production Setup for Supabase

## ✅ **Current Status: CONFIGURED**

Your Supabase connection is now properly configured for Vercel production deployment. Follow these steps to ensure everything works correctly.

## 🔧 **Step 1: Configure Environment Variables in Vercel Dashboard**

### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and open your project
2. Navigate to **Settings** → **Environment Variables**
3. Add these **exact** variables:

```bash
# Variable Name: PUBLIC_SUPABASE_URL
# Value: https://YOUR_PROJECT.supabase.co
# Environment: Production, Preview, Development

# Variable Name: PUBLIC_SUPABASE_ANON_KEY  
# Value: YOUR_SUPABASE_ANON_KEY
# Environment: Production, Preview, Development
```

**⚠️ IMPORTANT:**
- Variable names must be **exactly** `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- Make sure to select **all environments** (Production, Preview, Development)
- No extra spaces or characters in the values

### Option B: Vercel CLI
```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add PUBLIC_SUPABASE_URL production
# Enter: https://YOUR_PROJECT.supabase.co

vercel env add PUBLIC_SUPABASE_ANON_KEY production
# Enter: YOUR_SUPABASE_ANON_KEY
```

## 🔧 **Step 2: Deploy and Test**

### Deploy to Vercel
```bash
# Option 1: Auto-deploy (if connected to GitHub)
git add .
git commit -m "Configure Supabase for production"
git push origin main

# Option 2: Manual deploy
vercel --prod
```

### Test Production Connection
After deployment, test these URLs:

1. **API Test Endpoint:**
   ```
   https://your-domain.vercel.app/api/test-supabase
   ```
   
2. **Test Page:**
   ```
   https://your-domain.vercel.app/app
   ```

## 🧪 **Step 3: Verify Connection**

### Expected Results:
✅ **Successful Response:**
```json
{
  "success": true,
  "message": "✅ Supabase connection working in production!",
  "diagnostics": {
    "hasUrl": true,
    "hasKey": true,
    "urlValid": true,
    "keyValid": true,
    "clientCreated": true
  },
  "queryTest": {
    "success": true,
    "recordsFound": 0
  }
}
```

❌ **Failed Response Example:**
```json
{
  "success": false,
  "error": "Invalid API key",
  "diagnostics": {
    "hasUrl": true,
    "hasKey": false
  }
}
```

## 🔍 **Troubleshooting Common Issues**

### Issue 1: "Invalid API key" 
**Cause:** Wrong environment variables
**Solution:**
1. Check Vercel dashboard environment variables
2. Ensure variable names are exactly: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy after making changes

### Issue 2: "Failed to fetch"
**Cause:** Network/CORS issues
**Solution:**
1. Check Supabase project settings
2. Verify URL is correct and accessible
3. Check if project is paused in Supabase

### Issue 3: "Environment variables undefined"
**Cause:** Incorrect variable names or missing variables
**Solution:**
1. Variables must start with `PUBLIC_` for client-side access
2. Check spelling exactly: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
3. Restart Vercel project after adding variables

### Issue 4: "Connection timeout"
**Cause:** Network connectivity
**Solution:**
1. Check Supabase service status
2. Verify project is not paused
3. Test with curl:
   ```bash
   curl -X GET "https://YOUR_PROJECT.supabase.co/rest/v1/feedback" \
        -H "apikey: YOUR_ANON_KEY" \
        -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

## 🔐 **Security Best Practices**

1. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use Vercel dashboard for production secrets
   - Rotate keys regularly

2. **Supabase Security:**
   - Use Row Level Security (RLS) policies
   - Never expose service_role key
   - Monitor usage in Supabase dashboard

3. **CORS Configuration:**
   - Already configured in `vercel.json`
   - Supabase allows all origins by default for anon key

## 📝 **Testing Checklist**

Before going live, verify:

- [ ] Environment variables set in Vercel dashboard
- [ ] API test endpoint returns success
- [ ] Feedback form works on production site
- [ ] No console errors in browser dev tools
- [ ] Supabase logs show successful connections
- [ ] Database records are being created

## 🚨 **Emergency Recovery**

If production breaks:

1. **Quick Fix:**
   ```bash
   # Revert to working state
   git revert HEAD
   git push origin main
   ```

2. **Environment Reset:**
   - Delete all Vercel environment variables
   - Re-add them from this guide
   - Redeploy

3. **Supabase Reset:**
   - Generate new anon key in Supabase dashboard
   - Update Vercel environment variables
   - Redeploy

## 📞 **Support**

If issues persist:
1. Check Vercel deployment logs
2. Check Supabase project logs
3. Test API endpoint directly
4. Compare with this configuration guide

---

**✅ Configuration Complete!** Your Supabase connection should now work perfectly in production. 