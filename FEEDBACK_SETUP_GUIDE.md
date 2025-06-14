# 🔄 Anonymous Feedback System Setup Guide

This guide will help you add a secure, GDPR-friendly anonymous feedback form to your SvelteKit application.

## 📋 Prerequisites

- SvelteKit application (already set up ✅)
- Supabase project
- Node.js environment

## 🗄️ 1. Supabase Database Setup

### Create the Feedback Table

In your Supabase SQL Editor, run the following SQL:

```sql
-- Create feedback table
CREATE TABLE feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    emotion TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts only
CREATE POLICY "Allow anonymous feedback submission" ON feedback
    FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Create policy to prevent reads (feedback is write-only for users)
CREATE POLICY "No public reads on feedback" ON feedback
    FOR SELECT 
    TO anon 
    USING (false);

-- Optional: Create policy for authenticated admin reads
CREATE POLICY "Allow authenticated admin reads" ON feedback
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Create indexes for performance
CREATE INDEX idx_feedback_timestamp ON feedback(timestamp DESC);
CREATE INDEX idx_feedback_rating ON feedback(rating) WHERE rating IS NOT NULL;
```

### Get Your Supabase Credentials

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy your Project URL and Public anon key

## 🔧 2. Install Dependencies

In your `akcelerator-landing-page/` directory:

```bash
npm install @supabase/supabase-js
```

## 🔐 3. Environment Variables

Create or update your `.env` file in `akcelerator-landing-page/`:

```env
# Supabase Configuration for Anonymous Feedback
# These are public environment variables (safe to expose to client-side)
PUBLIC_SUPABASE_URL=https://raoramjgbdkgidpyfngu.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhb3JhbWpnYmRrZ2lkcHlmbmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTgwMjEsImV4cCI6MjA2NTQzNDAyMX0.f-cGbr1hwmJ5K0xLs6sQEqyEAu6gGOFkNDzjXPrupIg

# Note: Service role key is stored securely and not exposed to client
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhb3JhbWpnYmRrZ2lkcHlmbmd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTg1ODAyMSwiZXhwIjoyMDY1NDM0MDIxfQ.5XZOl2dQpxOGUDNRv2rKmxCa1PmVcSyhhiaFqpgYOPk
```

**Important:** 
- Replace `your_supabase_project_url` with your actual Supabase URL
- Replace `your_supabase_anon_key` with your actual public anon key
- These are prefixed with `PUBLIC_` so they're accessible client-side in SvelteKit

## 📁 4. Files Created/Modified

The following files have been created or modified:

### New Files:
- ✅ `src/lib/supabase/client.ts` - Supabase client and feedback functions
- ✅ `src/components/FeedbackForm.svelte` - Feedback form component
- ✅ `supabase_setup.sql` - Database setup script

### Modified Files:
- ✅ `src/routes/+page.svelte` - Added feedback form to main page

## 🧪 5. Testing the Setup

### Test Supabase Connection

You can test if your Supabase connection works by opening the browser console and running:

```javascript
// This should not throw any errors
import { testSupabaseConnection } from './src/lib/supabase/client.js';
testSupabaseConnection().then(console.log);
```

### Test Feedback Submission

1. Visit your application
2. Scroll to the feedback section (after the CTA section)
3. Fill in the feedback form
4. Submit and check if you get a success message
5. Verify in your Supabase dashboard that the feedback was recorded

## 🔒 6. Security & Privacy Features

### GDPR Compliance
- ✅ **No personal data**: Only feedback text, optional emotion, and rating
- ✅ **Anonymous**: No user identification or tracking
- ✅ **No cookies**: No persistent data stored in browser
- ✅ **Minimal data**: Only what's necessary for feedback

### Security Features
- ✅ **Row Level Security**: Enabled on feedback table
- ✅ **Insert-only access**: Users can only submit, not read feedback
- ✅ **Input validation**: Text limits and sanitization
- ✅ **Error handling**: Graceful degradation if Supabase is unreachable

## 🎨 7. Customization

### Styling
The feedback form uses your existing Czech theme variables:
- `--czech-forest` for primary colors
- `--bg-accent` for backgrounds
- `--subtle-border` for borders
- Responsive design included

### Language Support
The form automatically supports Czech/English based on your `currentLanguage` store:
- Czech: Full Czech translations
- English: Full English translations

### Form Fields
You can customize the emotion options by editing the `emotions` object in `FeedbackForm.svelte`:

```javascript
emotions: {
    '': 'Vyberte...',
    'grateful': 'Vděčný/á',
    'hopeful': 'Plný/á naděje',
    // Add more emotions as needed
}
```

## 🚀 8. Deployment

### Vercel Deployment
Your environment variables will work automatically with Vercel. Just make sure to:

1. Add environment variables in Vercel dashboard
2. Rebuild and deploy

### Environment Variables in Production
Set these in your Vercel project settings:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

## 📊 9. Viewing Feedback Data

### As Admin (Optional)
If you want to view feedback as an authenticated user:

1. Create a Supabase auth user (admin account)
2. Log in through Supabase Auth
3. Query the feedback table directly in Supabase dashboard

### SQL Query for Analytics
```sql
-- Get feedback summary
SELECT 
    COUNT(*) as total_feedback,
    AVG(rating) as avg_rating,
    COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
    DATE_TRUNC('day', timestamp) as day
FROM feedback 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day DESC;

-- Get emotion breakdown
SELECT emotion, COUNT(*) as count
FROM feedback 
WHERE emotion IS NOT NULL
GROUP BY emotion
ORDER BY count DESC;
```

## 🛠️ 10. Troubleshooting

### Common Issues

1. **"Cannot find module '@supabase/supabase-js'"**
   - Run `npm install @supabase/supabase-js`

2. **"Cannot find module '$env/static/public'"**
   - Make sure your `.env` file has the correct variables
   - Restart your dev server: `npm run dev`

3. **Feedback not saving**
   - Check browser console for errors
   - Verify Supabase URL and anon key
   - Check if RLS policies are set up correctly

4. **Form not showing**
   - Check browser console for component errors
   - Verify import path in `+page.svelte`

### Debug Mode
Add this to your Supabase client for debugging:

```javascript
export const supabase = createClient(
    PUBLIC_SUPABASE_URL, 
    PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
        // Add for debugging
        db: { schema: 'public' },
        global: { headers: { 'x-client-info': 'feedback-form' } }
    }
);
```

## ✅ 11. Success Checklist

- [ ] Supabase table created with RLS policies
- [ ] Dependencies installed (`@supabase/supabase-js`)
- [ ] Environment variables set up
- [ ] Feedback form appears on your site
- [ ] Form submits successfully (test with sample feedback)
- [ ] Success message appears after submission
- [ ] Feedback appears in Supabase dashboard
- [ ] Error handling works (test with invalid Supabase URL)

## 🌱 12. Next Steps

- Consider adding feedback analytics dashboard
- Set up email notifications for new feedback
- Add more emotion options or custom fields
- Implement feedback export functionality

---

**🎉 Congratulations!** You now have a secure, anonymous feedback system that respects user privacy while helping you improve your altruism accelerator platform. 