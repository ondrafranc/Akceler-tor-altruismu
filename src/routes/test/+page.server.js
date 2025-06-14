import { supabase } from "$lib/supabaseClient";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

export async function load() {
  console.log('🔗 Testing Supabase connection from test route...');
  
  // Debug environment variables
  console.log('🔧 Environment Variables Check:');
  console.log(`📡 URL: ${PUBLIC_SUPABASE_URL ? 'Found' : 'Missing'} - ${PUBLIC_SUPABASE_URL?.substring(0, 30)}...`);
  console.log(`🔑 Key: ${PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing'} - ${PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`);
  
  try {
    // Test basic connection first
    console.log('🧪 Testing basic Supabase connection...');
    const { data, error: authError } = await supabase.auth.getSession();
    console.log('📊 Auth test result:', { hasData: !!data, error: authError?.message });

    // First try to get countries (from the documentation example)
    const { data: countries, error: countriesError } = await supabase.from("countries").select();
    
    if (!countriesError && countries) {
      console.log('✅ Countries table found:', countries.length, 'entries');
      return {
        countries: countries ?? [],
        connectionTest: { success: true, table: 'countries', envCheck: 'OK' }
      };
    }
    
    // If no countries table, try feedback table as fallback
    console.log('📝 Countries table not found, trying feedback table...');
    const { data: feedback, error: feedbackError } = await supabase.from("feedback").select().limit(5);
    
    if (!feedbackError && feedback) {
      console.log('✅ Feedback table connection successful:', feedback.length, 'entries');
      return {
        countries: [], // Empty for now
        feedback: feedback ?? [],
        connectionTest: { success: true, table: 'feedback', envCheck: 'OK' }
      };
    }
    
    // If both fail, return the error with debug info
    const finalError = feedbackError || countriesError;
    console.error('❌ Database connection failed:', finalError);
    return {
      countries: [],
      connectionTest: { 
        success: false, 
        error: finalError.message,
        envCheck: {
          hasUrl: !!PUBLIC_SUPABASE_URL,
          hasKey: !!PUBLIC_SUPABASE_ANON_KEY,
          urlPreview: PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          keyPreview: PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
        }
      }
    };
    
  } catch (err) {
    console.error('💥 Server load error:', err);
    return {
      countries: [],
      connectionTest: { 
        success: false, 
        error: err.message,
        envCheck: {
          hasUrl: !!PUBLIC_SUPABASE_URL,
          hasKey: !!PUBLIC_SUPABASE_ANON_KEY
        }
      }
    };
  }
} 