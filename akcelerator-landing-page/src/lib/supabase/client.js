import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Diagnostic logging
console.log('🔧 Supabase Environment Check:', {
    hasUrl: !!PUBLIC_SUPABASE_URL,
    hasKey: !!PUBLIC_SUPABASE_ANON_KEY,
    urlPreview: PUBLIC_SUPABASE_URL ? PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'undefined',
    keyPreview: PUBLIC_SUPABASE_ANON_KEY ? PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'undefined'
});

// Validate environment variables
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables:', {
        PUBLIC_SUPABASE_URL: !!PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY: !!PUBLIC_SUPABASE_ANON_KEY
    });
}

// Create Supabase client
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false, // No authentication needed for anonymous feedback
        autoRefreshToken: false
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
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
        console.log('🔄 Sending feedback:', { 
            textLength: data.text?.length, 
            emotion: data.emotion, 
            rating: data.rating,
            timestamp: new Date().toISOString()
        });

        // Validate input
        if (!data.text?.trim()) {
            console.error('❌ Validation failed: No feedback text');
            return {
                success: false,
                error: 'Feedback text is required'
            };
        }

        // Validate Supabase configuration
        if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
            console.error('❌ Supabase configuration missing');
            return {
                success: false,
                error: 'Database configuration error. Please contact support.'
            };
        }

        // Test connection first
        console.log('🔗 Testing Supabase connection...');
        const connectionTest = await supabase.from('feedback').select('count').limit(1);
        
        if (connectionTest.error) {
            console.error('❌ Supabase connection failed:', {
                message: connectionTest.error.message,
                details: connectionTest.error.details,
                hint: connectionTest.error.hint,
                code: connectionTest.error.code
            });
            return {
                success: false,
                error: `Connection error: ${connectionTest.error.message}`
            };
        }

        console.log('✅ Supabase connection successful');

        // Sanitize and prepare data
        const feedbackData = {
            text: data.text.trim(),
            emotion: data.emotion?.trim() || null,
            rating: data.rating && data.rating >= 1 && data.rating <= 5 ? data.rating : null,
            created_at: new Date().toISOString()
        };

        console.log('📝 Inserting feedback data:', {
            hasText: !!feedbackData.text,
            textLength: feedbackData.text?.length,
            emotion: feedbackData.emotion,
            rating: feedbackData.rating
        });

        // Insert data into Supabase
        const { data: result, error } = await supabase
            .from('feedback')
            .insert([feedbackData])
            .select();

        if (error) {
            console.error('❌ Supabase feedback error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                fullError: error
            });
            return {
                success: false,
                error: `Database error: ${error.message || 'Failed to submit feedback. Please try again.'}`
            };
        }

        console.log('✅ Feedback submitted successfully:', {
            resultCount: result?.length,
            id: result?.[0]?.id || 'unknown'
        });

        return {
            success: true,
            message: 'Feedback submitted successfully!',
            data: result
        };

    } catch (err) {
        console.error('❌ Feedback submission error:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
            fullError: err
        });
        return {
            success: false,
            error: `Network error: ${err.message || 'Please check your connection and try again.'}`
        };
    }
}

/**
 * Test Supabase connection and configuration
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function testSupabaseConnection() {
    try {
        console.log('🧪 Testing Supabase connection...');
        
        // Check environment variables
        if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
            return {
                success: false,
                error: 'Missing environment variables'
            };
        }

        // Test basic connection
        const { data, error } = await supabase
            .from('feedback')
            .select('id, created_at')
            .limit(5)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Connection test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }

        console.log('✅ Connection test successful:', { recordCount: data?.length });
        return {
            success: true,
            data: data
        };

    } catch (err) {
        console.error('❌ Connection test error:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Get diagnostic information about the Supabase configuration
 * @returns {Object} Diagnostic information
 */
export function getDiagnostics() {
    return {
        hasUrl: !!PUBLIC_SUPABASE_URL,
        hasKey: !!PUBLIC_SUPABASE_ANON_KEY,
        urlValid: PUBLIC_SUPABASE_URL?.includes('supabase.co'),
        keyValid: PUBLIC_SUPABASE_ANON_KEY?.length > 100,
        clientCreated: !!supabase,
        environment: typeof window !== 'undefined' ? 'browser' : 'server'
    };
} 