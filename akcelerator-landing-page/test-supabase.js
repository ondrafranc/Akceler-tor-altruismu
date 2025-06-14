#!/usr/bin/env node

// Test Supabase connection
import { testSupabaseConnection } from './src/lib/supabase/client.js';

console.log('🔗 Testing Supabase connection...');

try {
  const result = await testSupabaseConnection();
  if (result.success) {
    console.log('✅ Supabase connection successful!');
    console.log(`📊 Recent feedback entries: ${result.data?.length || 0}`);
  } else {
    console.error('❌ Supabase connection failed:', result.error);
  }
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
}

process.exit(0); 