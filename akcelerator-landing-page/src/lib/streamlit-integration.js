/**
 * Streamlit Integration Module
 * Handles communication with the Czech Altruism Accelerator Streamlit backend
 */

const STREAMLIT_BASE_URL = 'http://localhost:8501';
const API_ENDPOINTS = {
  stats: '/api/stats',
  actions: '/api/recent-actions',
  users: '/api/user-count'
};

// Fetch real-time data from Streamlit backend
export async function fetchStreamlitData() {
  try {
    // In a real implementation, this would call Streamlit's API
    // For now, we'll simulate with realistic Czech data
    const mockData = {
      weeklyActions: 247 + Math.floor(Math.random() * 20),
      activeUsers: 1834,
      recentActions: [
        {
          type: 'charita_dar',
          location: 'Praha',
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
        },
        {
          type: 'douccovani',
          location: 'Brno', 
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
        },
        {
          type: 'potravinova_banka',
          location: 'Ostrava',
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }
      ],
      regionalStats: {
        prague: {
          actions: 124,
          trend: '+12%'
        },
        brno: {
          actions: 89,
          trend: '+8%'
        },
        ostrava: {
          actions: 67,
          trend: '+15%'
        }
      }
    };
    
    return mockData;
  } catch (error) {
    console.error('Error fetching Streamlit data:', error);
    // Return fallback data
    return {
      weeklyActions: 247,
      activeUsers: 1800,
      recentActions: [],
      regionalStats: {
        prague: { actions: 120, trend: '+10%' },
        brno: { actions: 85, trend: '+5%' },
        ostrava: { actions: 65, trend: '+12%' }
      }
    };
  }
}

// Launch Streamlit app with specific parameters
export function launchStreamlitApp(params = {}) {
  const {
    language = 'czech',
    region = null,
    action = null,
    source = 'landing-page'
  } = params;
  
  // Build URL with parameters
  const urlParams = new URLSearchParams({
    lang: language,
    source: source
  });
  
  if (region) urlParams.append('region', region);
  if (action) urlParams.append('action', action);
  
  const streamlitUrl = `${STREAMLIT_BASE_URL}?${urlParams.toString()}`;
  
  // Open in new tab with focus
  const newWindow = window.open(streamlitUrl, '_blank');
  if (newWindow) {
    newWindow.focus();
  }
  
  // Track the launch (analytics)
  trackStreamlitLaunch(params);
  
  return streamlitUrl;
}

// Embed Streamlit app in iframe (alternative to new tab)
export function embedStreamlitApp(container, params = {}) {
  const {
    language = 'czech',
    region = null,
    width = '100%',
    height = '800px'
  } = params;
  
  const urlParams = new URLSearchParams({
    lang: language,
    embedded: 'true'
  });
  
  if (region) urlParams.append('region', region);
  
  const iframe = document.createElement('iframe');
  iframe.src = `${STREAMLIT_BASE_URL}?${urlParams.toString()}`;
  iframe.width = width;
  iframe.height = height;
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 8px 32px rgba(46, 93, 49, 0.15)';
  
  // Clear container and add iframe
  container.innerHTML = '';
  container.appendChild(iframe);
  
  return iframe;
}

// Post action completion to Streamlit backend
export async function postActionCompletion(actionData) {
  try {
    const payload = {
      action_id: actionData.id,
      action_type: actionData.type,
      user_id: actionData.userId || 'anonymous',
      timestamp: new Date().toISOString(),
      source: 'landing-page',
      language: actionData.language || 'czech'
    };
    
    // In real implementation, would POST to Streamlit API
    console.log('Action completed:', payload);
    
    // Simulate API response
    return {
      success: true,
      message: 'Akce úspěšně zaznamenána',
      impact: actionData.impact || {}
    };
  } catch (error) {
    console.error('Error posting action completion:', error);
    return {
      success: false,
      message: 'Chyba při zaznamenávání akce'
    };
  }
}

// Subscribe to real-time updates from Streamlit
export function subscribeToUpdates(callback) {
  // Simulate real-time updates with WebSocket-like behavior
  const interval = setInterval(async () => {
    try {
      const data = await fetchStreamlitData();
      callback(data);
    } catch (error) {
      console.error('Error in real-time update:', error);
    }
  }, 30000); // Update every 30 seconds
  
  // Return cleanup function
  return () => clearInterval(interval);
}

// Track user interactions for analytics
function trackStreamlitLaunch(params) {
  try {
    // In real implementation, would send to analytics service
    const event = {
      event: 'streamlit_launch',
      timestamp: new Date().toISOString(),
      params: params,
      user_agent: navigator.userAgent,
      referrer: document.referrer
    };
    
    console.log('Analytics event:', event);
    
    // Could integrate with Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', 'streamlit_launch', {
        event_category: 'engagement',
        event_label: params.language,
        custom_parameter_region: params.region
      });
    }
  } catch (error) {
    console.error('Error tracking launch:', error);
  }
}

// Check if Streamlit app is available
export async function checkStreamlitHealth() {
  try {
    const response = await fetch(`${STREAMLIT_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Streamlit health check failed:', error);
    return false;
  }
}

// Generate deep link to specific Streamlit section
export function generateDeepLink(section, params = {}) {
  const baseParams = {
    lang: params.language || 'czech',
    section: section
  };
  
  // Add additional parameters
  Object.keys(params).forEach(key => {
    if (key !== 'language') {
      baseParams[key] = params[key];
    }
  });
  
  const urlParams = new URLSearchParams(baseParams);
  return `${STREAMLIT_BASE_URL}?${urlParams.toString()}`;
}

// Czech-specific utility functions
export const czechStreamlitUtils = {
  // Map quiz results to Streamlit entry points
  mapQuizToEntry: (quizResult) => {
    const entryMap = {
      'praktik': 'quick-actions',
      'mentor': 'assessment?focus=teaching',
      'organizator': 'causes?type=community',
      'darca': 'quick-actions?type=donation'
    };
    
    return entryMap[quizResult] || 'assessment';
  },
  
  // Format Czech action data for Streamlit
  formatActionData: (action) => ({
    id: action.id,
    title: action.title,
    type: action.type,
    cause: action.cause_id,
    time_minutes: action.requirements?.time_minutes || 0,
    cost_czk: (action.requirements?.cost_usd || 0) * 25, // USD to CZK conversion
    organization: action.organization?.name || '',
    impact: action.impact?.metric_description || ''
  }),
  
  // Generate region-specific URLs
  generateRegionalUrl: (region) => {
    const regionData = {
      prague: { focus: 'tech', causes: ['technologie_pro_dobro', 'vzdelavani'] },
      brno: { focus: 'education', causes: ['vzdelavani', 'mistni_komunita'] },
      ostrava: { focus: 'social', causes: ['mistni_komunita', 'zdravi_socialni_pece'] }
    };
    
    const config = regionData[region] || regionData.prague;
    const params = new URLSearchParams({
      lang: 'czech',
      region: region,
      focus: config.focus,
      causes: config.causes.join(',')
    });
    
    return `${STREAMLIT_BASE_URL}?${params.toString()}`;
  }
};

// Export configuration
export const streamlitConfig = {
  baseUrl: STREAMLIT_BASE_URL,
  defaultLanguage: 'czech',
  healthCheckInterval: 60000, // 1 minute
  updateInterval: 30000, // 30 seconds
  timeout: 10000 // 10 seconds
}; 