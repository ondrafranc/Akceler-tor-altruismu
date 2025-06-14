// Debug script to test API endpoint and environment variables
// Run with: node debug-api.js

async function testAPI() {
    console.log('🧪 Testing API endpoint...');
    
    // Test 1: Check if we can reach the API endpoint locally
    const apiUrl = 'http://localhost:5173/api/test-supabase';
    
    try {
        console.log('📡 Testing local API endpoint:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            console.error('❌ API returned error status:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text);
            return;
        }
        
        const data = await response.json();
        console.log('✅ API Response:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('❌ Failed to fetch from API:', error.message);
        
        // Test 2: Check if it's a server issue
        try {
            console.log('🔍 Testing if dev server is running...');
            const healthResponse = await fetch('http://localhost:5173');
            if (healthResponse.ok) {
                console.log('✅ Dev server is running');
                console.log('❌ But API endpoint is not accessible');
            }
        } catch (serverError) {
            console.error('❌ Dev server is not running:', serverError.message);
            console.log('💡 Run: npm run dev');
        }
    }
}

// Test environment variables (if we're in Node.js environment)
if (typeof process !== 'undefined') {
    console.log('🔧 Environment Variables Check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('PUBLIC_SUPABASE_ANON_KEY:', process.env.PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
}

testAPI(); 