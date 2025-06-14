# 🚀 Deployment Instructions - Dual Architecture

This platform consists of **two main components** that need to be deployed separately:

1. **SvelteKit Frontend** (Landing Page) → Vercel
2. **Streamlit Backend** (Application Engine) → Streamlit Cloud

## 🎯 Architecture Overview

```
Landing Page (Vercel) ←→ Streamlit App (Streamlit Cloud)
        ↓                       ↓
  Supabase Database ←→ User Feedback
```

---

## 1️⃣ Frontend Deployment (SvelteKit → Vercel)

### Prerequisites
- GitHub account
- Vercel account (free at https://vercel.com)
- Repository pushed to GitHub

### Deployment Steps

1. **Connect to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - **Framework**: SvelteKit
   - **Root Directory**: `akcelerator-landing-page`
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave default

3. **Environment Variables** (in Vercel Dashboard):
   ```bash
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy**: Click "Deploy" and wait for completion

5. **Custom Domain** (optional):
   - Add `akcelerator-altruismu.cz` in Vercel domain settings

### Expected Result
- **URL**: `https://your-project.vercel.app`
- **Features**: Story Garden, Feedback Modal, Crisis Support
- **Analytics**: Automatic Vercel Analytics tracking

---

## 2️⃣ Backend Deployment (Streamlit → Streamlit Cloud)

### Prerequisites
- GitHub account
- Streamlit Cloud account (free at https://streamlit.io/cloud)
- Streamlit app code in `/streamlit-app/` folder

### Deployment Steps

1. **Go to Streamlit Cloud**: https://streamlit.io/cloud

2. **Click "New app"**

3. **Configure the app**:
   - **Repository**: Select this repository
   - **Branch**: `main`
   - **Main file path**: `streamlit-app/app.py`
   - **URL**: Choose memorable URL (e.g., `akcelerator-altruismus`)

4. **Advanced Settings**:
   - **Python version**: 3.9+
   - **Requirements file**: `streamlit-app/requirements.txt`

5. **Deploy**: Click "Deploy!" and wait for completion

6. **Test**: Verify the app works at your Streamlit Cloud URL

### Expected Result
- **URL**: `https://akcelerator-altruismu.streamlit.app`
- **Features**: Assessment, Matching, Personalized Guidance

---

## 3️⃣ Integration & Testing

### Update Frontend Integration
After Streamlit deployment, update the integration URL in:

**File**: `akcelerator-landing-page/src/lib/streamlit-integration.js`

```javascript
// Update this URL to your actual Streamlit deployment
const STREAMLIT_URL = 'https://akcelerator-altruismu.streamlit.app';
```

### Test Complete Flow
1. **Landing Page**: Verify story garden and feedback work
2. **Launch Button**: Test "Spustit akcelerátor" opens Streamlit app
3. **Context Preservation**: Ensure user data flows between components
4. **Feedback Loop**: Verify feedback is collected in Supabase

---

## 4️⃣ Monitoring & Maintenance

### Frontend (Vercel)
- **Analytics**: Built-in Vercel Analytics
- **Performance**: Automatic performance monitoring
- **Deployments**: GitHub auto-deploy on push

### Backend (Streamlit Cloud)
- **Logs**: Available in Streamlit Cloud dashboard
- **Performance**: Monitor app responsiveness
- **Updates**: Auto-deploy on GitHub push

### Database (Supabase)
- **Feedback Collection**: Monitor incoming feedback
- **Storage**: Check database storage usage
- **API Limits**: Monitor API usage

---

## 5️⃣ Troubleshooting

### Common Frontend Issues
**Build Failures**:
- Check `package.json` dependencies
- Verify environment variables in Vercel

**Supabase Connection**:
- Verify environment variables are set
- Check Supabase URL and key validity

### Common Backend Issues
**Import Errors**:
- Ensure all dependencies in `streamlit-app/requirements.txt`
- Check Python version compatibility

**Data File Errors**:
- Verify `streamlit-app/data/` folder structure
- Ensure all JSON files are valid

**Performance Issues**:
- Monitor Streamlit Cloud resource usage
- Optimize data loading with `@st.cache_data`

### Integration Issues
**Launch Button Not Working**:
- Check Streamlit URL in integration file
- Verify CORS settings if needed

**Context Not Preserved**:
- Review URL parameter passing
- Check Streamlit app parameter handling

---

## 6️⃣ File Structure Reference

### Production Structure
```
/ (Project Root)
├── akcelerator-landing-page/    # → Deployed to Vercel
│   ├── src/components/          # UI components
│   ├── src/lib/supabase/        # Database integration
│   └── vercel.json              # Deployment config
├── streamlit-app/               # → Deployed to Streamlit Cloud
│   ├── app.py                   # Main application
│   ├── data/                    # Application data
│   └── requirements.txt         # Dependencies
└── legacy/                      # Development history
```

### Required Files for Deployment
**Frontend (Vercel)**:
- `akcelerator-landing-page/package.json`
- `akcelerator-landing-page/svelte.config.js`
- `akcelerator-landing-page/vercel.json`

**Backend (Streamlit Cloud)**:
- `streamlit-app/app.py`
- `streamlit-app/requirements.txt`
- `streamlit-app/.streamlit/config.toml`
- `streamlit-app/data/` (complete folder)

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Environment variables documented
- [ ] Both components tested locally

### Frontend Deployment
- [ ] Vercel project created
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] Deployment successful

### Backend Deployment
- [ ] Streamlit Cloud app created
- [ ] File paths configured correctly
- [ ] App deployed successfully
- [ ] All features working

### Integration Testing
- [ ] Landing page loads correctly
- [ ] Story garden interactive
- [ ] "Spustit akcelerátor" launches Streamlit
- [ ] Feedback system working
- [ ] Crisis support accessible

### Production Ready
- [ ] Both URLs documented
- [ ] Team has access to dashboards
- [ ] Monitoring set up
- [ ] Documentation updated

---

*This dual-architecture approach ensures scalability, maintainability, and optimal user experience across both marketing and application components.* 