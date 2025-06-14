import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
    console.log('🔗 Testing Supabase connection...');
    
    try {
        // Create Supabase client on server-side
        const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
        
        console.log('📡 Supabase URL:', PUBLIC_SUPABASE_URL);
        console.log('🔑 Supabase Key:', PUBLIC_SUPABASE_ANON_KEY ? `${PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` : 'MISSING');
        
        // Test connection by querying feedback table
        const { data: feedbackData, error: feedbackError } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (feedbackError) {
            console.error('❌ Supabase connection failed:', feedbackError);
            return {
                supabaseStatus: {
                    connected: false,
                    error: feedbackError.message,
                    table: 'feedback'
                }
            };
        }
        
        console.log('✅ Supabase connection successful!');
        console.log('📊 Recent feedback entries:', feedbackData?.length || 0);
        
        if (feedbackData && feedbackData.length > 0) {
            console.log('📝 Sample feedback entries:');
            feedbackData.forEach((entry, index) => {
                console.log(`   ${index + 1}. ${entry.text?.substring(0, 50)}${entry.text?.length > 50 ? '...' : ''} (${entry.emotion || 'no emotion'}, ${entry.rating || 'no rating'})`);
            });
        } else {
            console.log('📝 No feedback entries found in database');
        }
        
        return {
            supabaseStatus: {
                connected: true,
                feedbackCount: feedbackData?.length || 0,
                recentFeedback: feedbackData || []
            }
        };
        
    } catch (error) {
        console.error('💥 Server-side Supabase test failed:', error);
        return {
            supabaseStatus: {
                connected: false,
                error: error.message || 'Unknown connection error'
            }
        };
    }
} 