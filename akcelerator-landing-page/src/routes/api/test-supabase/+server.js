import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client using process.env for better compatibility with Vercel
function createServerSupabaseClient() {
	try {
		// Access environment variables directly from process.env
		const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
		const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
					 process.env.SUPABASE_ANON_KEY || 
					 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
		
		console.log('🔍 Environment Variables Check:', {
			hasSupabaseUrl: !!url,
			hasSupabaseKey: !!key,
			urlSource: process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL',
			keySource: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 
					  process.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
			availableEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
		});
		
		if (!url || !key) {
			console.error('❌ Missing environment variables:', { 
				hasUrl: !!url, 
				hasKey: !!key,
				availableSupabaseVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
			});
			throw new Error('Missing Supabase environment variables');
		}
		
		console.log('✅ Creating Supabase client with URL:', url.substring(0, 30) + '...');
		return createClient(url, key);
	} catch (error) {
		console.error('❌ Failed to create Supabase client:', error);
		return null;
	}
}

export async function GET() {
	console.log('🧪 Production Supabase Test API Called');
	
	try {
		const supabase = createServerSupabaseClient();
		if (!supabase) {
			return json({ 
				success: false, 
				error: 'Failed to initialize Supabase client',
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		// Test database connection with a simple query
		console.log('📝 Testing database connection...');
		const { data, error } = await supabase
			.from('feedback')
			.select('count')
			.limit(1);

		if (error) {
			console.error('❌ Database query failed:', error);
			return json({ 
				success: false, 
				error: `Database error: ${error.message}`,
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		console.log('✅ Database connection successful');
		return json({ 
			success: true, 
			message: 'Supabase connection working',
			timestamp: new Date().toISOString(),
			dataAvailable: !!data
		});

	} catch (error) {
		console.error('❌ Unexpected error:', error);
		return json({ 
			success: false, 
			error: `Server error: ${error.message}`,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
}

export async function POST({ request }) {
	console.log('📝 Feedback submission request received');
	
	try {
		const supabase = createServerSupabaseClient();
		if (!supabase) {
			return json({ 
				success: false, 
				error: 'Failed to initialize Supabase client',
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		// Parse and validate the request body
		const body = await request.json();
		const { feedback_text, emotion, rating } = body;

		console.log('📋 Feedback data received:', { 
			hasText: !!feedback_text, 
			emotion, 
			rating,
			textLength: feedback_text?.length 
		});

		// Validate required fields
		if (!feedback_text || typeof feedback_text !== 'string') {
			return json({ 
				success: false, 
				error: 'feedback_text is required and must be a string',
				timestamp: new Date().toISOString()
			}, { status: 400 });
		}

		// Validate text length (max 2000 characters)
		if (feedback_text.length > 2000) {
			return json({ 
				success: false, 
				error: 'feedback_text must be 2000 characters or less',
				timestamp: new Date().toISOString()
			}, { status: 400 });
		}

		// Prepare data for insertion
		const feedbackData = {
			feedback_text: feedback_text.trim(),
			emotion: emotion || null,
			rating: rating || null,
			created_at: new Date().toISOString()
		};

		console.log('💾 Inserting feedback into database...');
		
		// Insert feedback into the database
		const { data, error } = await supabase
			.from('feedback')
			.insert([feedbackData])
			.select()
			.single();

		if (error) {
			console.error('❌ Database insertion failed:', error);
			return json({ 
				success: false, 
				error: `Database error: ${error.message}`,
				timestamp: new Date().toISOString(),
				details: error
			}, { status: 500 });
		}

		console.log('✅ Feedback successfully saved:', data?.id);
		return json({ 
			success: true, 
			message: 'Feedback saved successfully',
			feedbackId: data?.id,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('❌ Unexpected error in POST:', error);
		return json({ 
			success: false, 
			error: `Server error: ${error.message}`,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
} 