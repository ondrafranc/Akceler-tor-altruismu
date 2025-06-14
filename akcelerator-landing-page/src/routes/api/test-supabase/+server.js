import { json } from '@sveltejs/kit';
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
    console.log('🧪 Testing feedback submission in production');
    
    try {
        const data = await request.json();
        
        // Test feedback submission
        const { sendFeedback } = await import('$lib/supabase/client.js');
        const result = await sendFeedback({
            text: data.text || 'Production API test feedback',
            emotion: data.emotion || 'testing',
            rating: data.rating || 5
        });
        
        return json({
            success: result.success,
            message: result.success ? 'Feedback test successful!' : result.error,
            result,
            timestamp: new Date().toISOString()
        }, {
            status: result.success ? 200 : 500,
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
        
    } catch (err) {
        console.error('💥 Feedback test error:', err);
        return json({
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 