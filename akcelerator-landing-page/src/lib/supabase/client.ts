import { createClient } from '@supabase/supabase-js';

// Environment variables for Vercel deployment
// These come from your Vercel project settings
declare const PUBLIC_SUPABASE_URL: string | undefined;
declare const PUBLIC_SUPABASE_ANON_KEY: string | undefined;

const supabaseUrl = typeof PUBLIC_SUPABASE_URL !== 'undefined' 
    ? PUBLIC_SUPABASE_URL 
    : 'https://your-project.supabase.co';
    
const supabaseKey = typeof PUBLIC_SUPABASE_ANON_KEY !== 'undefined' 
    ? PUBLIC_SUPABASE_ANON_KEY 
    : 'your-anon-key';

// Create Supabase client for anonymous operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // No authentication needed for anonymous feedback
        autoRefreshToken: false
    }
});

export interface FeedbackData {
    text: string;
    emotion?: string;
    rating?: number;
}

export interface FeedbackResponse {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Submit anonymous feedback to Supabase
 * GDPR-friendly: stores no personal information
 */
export async function sendFeedback(data: FeedbackData): Promise<FeedbackResponse> {
    try {
        // Check if Supabase is properly configured
        if (supabaseUrl === 'https://your-project.supabase.co' || supabaseKey === 'your-anon-key') {
            console.warn('Supabase not configured - environment variables missing');
            console.info('To enable feedback storage, create .env file with:');
            console.info('PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
            console.info('PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
            
            // Return success for demo purposes but indicate demo mode
            return {
                success: true,
                message: 'Feedback received (demo mode - check console for setup info)'
            };
        }

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
            rating: data.rating && data.rating >= 1 && data.rating <= 5 ? data.rating : null
        };

        // Insert into Supabase
        const { error } = await supabase
            .from('feedback')
            .insert([feedbackData]);

        if (error) {
            console.error('Supabase feedback error:', error);
            return {
                success: false,
                error: 'Failed to submit feedback. Please try again.'
            };
        }

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
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; configured: boolean; message: string }> {
    const configured = supabaseUrl !== 'https://your-project.supabase.co' && supabaseKey !== 'your-anon-key';
    
    if (!configured) {
        return {
            connected: false,
            configured: false,
            message: 'Environment variables not configured. Create .env file with PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY'
        };
    }
    
    try {
        const { error } = await supabase
            .from('feedback')
            .select('id')
            .limit(1);
        
        if (error) {
            return {
                connected: false,
                configured: true,
                message: `Supabase connection failed: ${error.message}`
            };
        }
        
        return {
            connected: true,
            configured: true,
            message: 'Supabase connection successful'
        };
    } catch (err) {
        return {
            connected: false,
            configured: true,
            message: `Network error: ${err instanceof Error ? err.message : 'Unknown error'}`
        };
    }
} 