import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { supabase, testSupabaseConnection, getDiagnostics } from '$lib/supabase/client.js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export async function GET() {
    console.log('🧪 Production Supabase Test API Called');
    
    try {
        // Get diagnostic information
        const diagnostics = getDiagnostics();
        console.log('📊 Diagnostics:', diagnostics);
        
        // Test the connection
        const connectionResult = await testSupabaseConnection();
        console.log('🔗 Connection Result:', connectionResult);
        
        // Additional production checks
        const productionChecks = {
            environment: 'production',
            timestamp: new Date().toISOString(),
            hasValidUrl: PUBLIC_SUPABASE_URL?.includes('supabase.co'),
            hasValidKey: PUBLIC_SUPABASE_ANON_KEY?.length > 100,
            keyFormat: PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ'),
            urlFormat: PUBLIC_SUPABASE_URL?.startsWith('https://'),
        };
        
        // Try a simple query to test actual database access
        let queryTest = { success: false, error: 'Not tested' };
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select('id')
                .limit(1);
                
            if (error) {
                queryTest = { success: false, error: error.message };
            } else {
                queryTest = { success: true, recordsFound: data?.length || 0 };
            }
        } catch (err) {
            queryTest = { success: false, error: err.message };
        }
        
        const response = {
            success: connectionResult.success && diagnostics.hasUrl && diagnostics.hasKey,
            timestamp: new Date().toISOString(),
            diagnostics,
            connectionResult,
            productionChecks,
            queryTest,
            message: connectionResult.success ? 
                '✅ Supabase connection working in production!' : 
                '❌ Supabase connection failed in production'
        };
        
        console.log('📤 API Response:', response);
        
        return json(response, {
            status: response.success ? 200 : 500,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'Content-Type': 'application/json'
            }
        });
        
    } catch (err) {
        console.error('💥 Production test API error:', err);
        
        return json({
            success: false,
            error: err.message,
            stack: err.stack,
            diagnostics: getDiagnostics(),
            timestamp: new Date().toISOString()
        }, { 
            status: 500,
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    }
}

export async function POST({ request }) {
    console.log('📝 Feedback submission API called');
    
    try {
        const data = await request.json();
        console.log('📨 Received feedback data:', {
            hasText: !!data.text,
            textLength: data.text?.length,
            emotion: data.emotion,
            rating: data.rating
        });

        // Validate input
        if (!data.text?.trim()) {
            console.log('❌ Validation failed: No feedback text');
            return json({
                success: false,
                error: 'Feedback text is required'
            }, { status: 400 });
        }

        // Validate environment variables
        if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
            console.error('❌ Missing Supabase environment variables on server');
            return json({
                success: false,
                error: 'Database configuration error. Please contact support.',
                debug: {
                    hasUrl: !!PUBLIC_SUPABASE_URL,
                    hasKey: !!PUBLIC_SUPABASE_ANON_KEY,
                    environment: 'server'
                }
            }, { status: 500 });
        }

        // Create server-side Supabase client
        console.log('🔧 Creating server-side Supabase client...');
        const serverSupabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });

        // Test connection first
        console.log('🔗 Testing server-side Supabase connection...');
        const connectionTest = await serverSupabase.from('feedback').select('count').limit(1);
        
        if (connectionTest.error) {
            console.error('❌ Server-side Supabase connection failed:', connectionTest.error);
            return json({
                success: false,
                error: `Connection error: ${connectionTest.error.message}`,
                debug: {
                    supabaseError: connectionTest.error,
                    environment: 'server'
                }
            }, { status: 500 });
        }

        console.log('✅ Server-side Supabase connection successful');

        // Sanitize and prepare data
        const feedbackData = {
            text: data.text.trim(),
            emotion: data.emotion?.trim() || null,
            rating: data.rating && data.rating >= 1 && data.rating <= 5 ? data.rating : null,
            created_at: new Date().toISOString()
        };

        console.log('📝 Inserting feedback data via server API...');

        // Insert data into Supabase
        const { data: result, error } = await serverSupabase
            .from('feedback')
            .insert([feedbackData])
            .select();

        if (error) {
            console.error('❌ Supabase feedback insertion error:', error);
            return json({
                success: false,
                error: `Database error: ${error.message || 'Failed to submit feedback. Please try again.'}`,
                debug: {
                    supabaseError: error,
                    environment: 'server'
                }
            }, { status: 500 });
        }

        console.log('✅ Feedback submitted successfully via server API:', {
            resultCount: result?.length,
            id: result?.[0]?.id || 'unknown'
        });

        return json({
            success: true,
            message: 'Feedback submitted successfully!',
            data: {
                id: result?.[0]?.id,
                timestamp: feedbackData.created_at
            }
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'Content-Type': 'application/json'
            }
        });
        
    } catch (err) {
        console.error('💥 Server-side feedback API error:', err);
        return json({
            success: false,
            error: `Network error: ${err.message || 'Please check your connection and try again.'}`,
            debug: {
                error: err.message,
                stack: err.stack,
                environment: 'server'
            },
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 