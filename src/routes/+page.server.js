import { supabase } from "$lib/supabaseClient";

export async function load() {
  console.log('🔗 Testing Supabase connection from server...');
  
  try {
    // First try to get countries (from the documentation example)
    const { data: countries, error: countriesError } = await supabase.from("countries").select();
    
    if (!countriesError && countries) {
      console.log('✅ Countries table found:', countries.length, 'entries');
      return {
        countries: countries ?? [],
        connectionTest: { success: true, table: 'countries' }
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
        connectionTest: { success: true, table: 'feedback' }
      };
    }
    
    // If both fail, return the error
    const error = feedbackError || countriesError;
    console.error('❌ Database connection failed:', error);
    return {
      countries: [],
      connectionTest: { success: false, error: error.message }
    };
    
  } catch (err) {
    console.error('💥 Server load error:', err);
    return {
      countries: [],
      connectionTest: { success: false, error: err.message }
    };
  }
} 