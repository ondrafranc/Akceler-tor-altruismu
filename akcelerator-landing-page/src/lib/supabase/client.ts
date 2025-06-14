import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Get environment variables with fallbacks for development
const supabaseUrl = env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

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
            console.warn('Supabase not configured - feedback would be sent here');
            // Return success for demo purposes
            return {
                success: true,
                message: 'Feedback received (demo mode - Supabase not configured)'
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
 * Test Supabase connection (optional utility)
 */
export async function testSupabaseConnection(): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('feedback')
            .select('id')
            .limit(1);
        
        return !error;
    } catch {
        return false;
    }
} 