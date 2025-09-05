/**
 * Streamlit Integration Module
 * Handles communication with the Czech Altruism Accelerator Streamlit backend
 */

// Streamlit integration utilities for Czech Altruism Accelerator
// ================================================================

// Configuration
import { PUBLIC_STREAMLIT_BASE_URL } from '$env/static/public';
const STREAMLIT_BASE_URL = (PUBLIC_STREAMLIT_BASE_URL || 'https://akceler-tor-altruismu-gvf9tctpuuq4t4tpjmaesa.streamlit.app').replace(/\/$/, '');
const API_ENDPOINTS = {
  stats: '/api/stats',
  actions: '/api/recent-actions',
  users: '/api/user-count'
};
const FALLBACK_MESSAGE = 'Aplikace se načítá... Pokud se nic nestane, zkuste to za chvíli znovu.';

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

// Health check function
export async function checkStreamlitHealth() {
  try {
    await fetch(`${STREAMLIT_BASE_URL}/?healthz=1`, {
      method: 'GET',
      mode: 'no-cors'
    });
    return true;
  } catch (error) {
    try {
      await fetch(`${STREAMLIT_BASE_URL}/_stcore/health`, {
        method: 'GET',
        mode: 'no-cors'
      });
      return true;
    } catch (err) {
      console.warn('Streamlit health check failed:', err);
      return false;
    }
  }
}

// Enhanced launch function with error handling
export async function launchStreamlitApp(params = {}) {
  const {
    language = 'czech',
    region = null,
    action = null,
    source = 'landing-page'
  } = params;
  
  // Build URL with parameters
  const urlParams = new URLSearchParams({
    lang: language,
    source: source,
    utm_source: 'landing-page',
    utm_medium: 'cta-button'
  });
  
  if (region) urlParams.set('region', region);
  if (action) urlParams.set('action', action);
  
  const fullUrl = `${STREAMLIT_BASE_URL}?${urlParams.toString()}`;
  
  try {
    // Track the launch attempt
    trackStreamlitLaunch(params);
    
    // Show loading state briefly
    const loadingElement = showLoadingState();
    
    // Check if Streamlit is healthy (optional)
    const isHealthy = await checkStreamlitHealth();
    if (!isHealthy) {
      console.warn('Streamlit app may not be available');
    }
    
    // Open the app in a new tab
    const newWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer');
    
    // Clean up loading state
    setTimeout(() => {
      if (loadingElement) loadingElement.remove();
    }, 1000);
    
    // Handle popup blocker
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      throw new Error('Popup blocked');
    }
    
    return { success: true, url: fullUrl };
    
  } catch (error) {
    console.error('Failed to launch Streamlit app:', error);
    
    // Fallback: show direct link
    showFallbackDialog(fullUrl);
    
    return { success: false, error: error.message, url: fullUrl };
  }
}

// Show loading state
function showLoadingState() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'streamlit-loading';
  loadingDiv.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">${FALLBACK_MESSAGE}</p>
    </div>
  `;
  document.body.appendChild(loadingDiv);
  return loadingDiv;
}

// Show fallback dialog if opening fails
function showFallbackDialog(url) {
  const fallbackDiv = document.createElement('div');
  fallbackDiv.className = 'czech-celebration';
  fallbackDiv.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-icon">🚀</div>
      <p class="celebration-text">
        Otevřít akcelerátor altruismu
      </p>
      <a href="${url}" target="_blank" rel="noopener noreferrer" 
         class="czech-button-primary" 
         style="margin-top: 1rem; text-decoration: none;">
        Kliknout zde
      </a>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="margin-top: 0.5rem; background: transparent; border: none; color: var(--text-secondary); cursor: pointer;">
        ✕ Zavřít
      </button>
    </div>
  `;
  document.body.appendChild(fallbackDiv);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (fallbackDiv.parentElement) {
      fallbackDiv.remove();
    }
  }, 10000);
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
    embed: 'true'
  });
  
  if (region) urlParams.set('region', region);
  
  const iframe = document.createElement('iframe');
  iframe.src = `${STREAMLIT_BASE_URL}?${urlParams.toString()}`;
  iframe.style.width = width;
  iframe.style.height = height;
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
      user_id: actionData.userId || 'anonymous',
      completed_at: new Date().toISOString(),
      source: 'landing-page'
    };
    
    // In production, this would post to Streamlit's backend
    // For now, just log the completion
    console.log('Action completed:', payload);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to post action completion:', error);
    return { success: false, error: error.message };
  }
}

// Subscribe to real-time updates from Streamlit
export function subscribeToUpdates(callback) {
  // Simulate real-time updates with WebSocket-like behavior
  const interval = setInterval(async () => {
    try {
      // In production, this would connect to Streamlit's WebSocket
      const updates = await fetchStreamlitData();
      callback(updates);
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    }
  }, 30000); // Check every 30 seconds
  
  return () => clearInterval(interval);
}

// Track user interactions for analytics
function trackStreamlitLaunch(params) {
  try {
    // Log the launch attempt
    const event = {
      type: 'streamlit_launch',
      timestamp: new Date().toISOString(),
      params: params,
      user_agent: navigator.userAgent,
      referrer: document.referrer
    };
    
    console.log('Tracking event:', event);
    
    // Could integrate with Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', 'streamlit_launch', {
        event_category: 'engagement',
        event_label: params.language,
        custom_parameter_region: params.region
      });
    }
  } catch (error) {
    console.error('Failed to track launch:', error);
  }
}

// Generate deep link to specific Streamlit section
export function generateDeepLink(section, params = {}) {
  const baseParams = {
    lang: params.language || 'czech',
    section: section
  };
  
  // Add any additional parameters
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