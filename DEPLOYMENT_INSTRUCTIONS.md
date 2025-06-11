# Streamlit App Deployment Instructions

## Deploy to Streamlit Cloud

### 1. Prerequisites
- GitHub account
- Streamlit Cloud account (free at https://streamlit.io/cloud)
- This repository pushed to GitHub

### 2. Deployment Steps

1. **Go to Streamlit Cloud**: https://streamlit.io/cloud
2. **Click "New app"**
3. **Connect your GitHub repository**: Select this repository
4. **Configure the app**:
   - **Main file path**: `app_czech_enhanced.py`
   - **URL**: Choose a memorable URL (e.g., `akcelerator-altruismus`)
   - **Branch**: `main` (or your current branch)
   - **Python version**: 3.9+

5. **Advanced settings** (optional):
   - Set environment variables if needed
   - Configure secrets if using external APIs

6. **Deploy**: Click "Deploy!"

### 3. Expected Deployment URL
Your app will be deployed to:
```
https://YOUR_APP_NAME.streamlit.app
```

### 4. Post-Deployment
1. Test the app functionality
2. Update the landing page to use the new URL
3. Test the integration between landing page and Streamlit app

### 5. Troubleshooting

**Common Issues:**
- **File not found errors**: Ensure all data files are in the correct paths
- **Import errors**: Check that all dependencies are in `requirements.txt`
- **Encoding issues**: Ensure all files are UTF-8 encoded

**File Structure Required:**
```
├── app_czech_enhanced.py          # Main app file
├── requirements.txt               # Dependencies
├── .streamlit/
│   └── config.toml               # Theme configuration
├── data/
│   ├── czech/
│   │   ├── causes_czech.json
│   │   ├── actions_czech.json
│   │   └── encouragement_czech.json
│   └── international/
│       ├── causes.json
│       ├── actions.json
│       └── encouragement_messages.json
```

### 6. Update Landing Page
After successful deployment, update the Streamlit URL in:
- `akcelerator-landing-page/src/lib/streamlit-integration.js`

Replace the URL with your actual deployment URL. 