import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Validate required environment variables
if (!PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env var: PUBLIC_SUPABASE_URL');
}

if (!PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env var: PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false, // No authentication needed for anonymous feedback
        autoRefreshToken: false
    }
});

/**
 * Submit anonymous feedback to Supabase
 * GDPR-friendly: stores no personal information
 * @param {Object} data - Feedback data
 * @param {string} data.text - Feedback text
 * @param {string} [data.emotion] - Optional emotion
 * @param {number} [data.rating] - Optional rating (1-5)
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export async function sendFeedback(data) {
    try {
        // Validate input
        if (!data.text?.trim()) {
            return {
                success: false,
                error: 'Feedback text is required'
            };
        }

        // Sanitize and prepare data
        const feedbackData = {
            text: data.text.trim(),
            emotion: data.emotion?.trim() || null,
            rating: data.rating && data.rating >= 1 && data.rating <= 5 ? data.rating : null,
            created_at: new Date().toISOString()
        };

        console.log('Sending feedback to Supabase:', { 
            url: PUBLIC_SUPABASE_URL, 
            dataLength: feedbackData.text.length 
        });

        // Insert into Supabase
        const { data: result, error } = await supabase
            .from('feedback')
            .insert([feedbackData])
            .select();

        if (error) {
            console.error('Supabase feedback error:', error);
            return {
                success: false,
                error: 'Failed to submit feedback. Please try again.'
            };
        }

        console.log('Feedback saved successfully:', result);
        
        return {
            success: true,
            message: 'Thank you for your feedback! 🌱'
        };

    } catch (err) {
        console.error('Feedback submission error:', err);
        return {
            success: false,
            error: 'Network error. Please check your connection and try again.'
        };
    }
}

/**
 * Test Supabase connection and configuration
 * @returns {Promise<{connected: boolean, configured: boolean, message: string}>}
 */
export async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection to:', PUBLIC_SUPABASE_URL);
        
        const { data, error } = await supabase
            .from('feedback')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('Supabase connection test failed:', error);
            return {
                connected: false,
                configured: true,
                message: `Connection failed: ${error.message}`
            };
        }
        
        console.log('Supabase connection successful');
        
        return {
            connected: true,
            configured: true,
            message: 'Supabase connection successful'
        };
    } catch (err) {
        console.error('Supabase connection test error:', err);
        return {
            connected: false,
            configured: true,
            message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`
        };
    }
} 