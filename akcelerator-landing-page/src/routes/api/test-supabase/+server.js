import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create server-side Supabase client
function createServerSupabaseClient() {
	try {
		if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
			throw new Error('Missing Supabase environment variables');
		}
		
		return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
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
				error: 'Failed to create Supabase client',
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		// Test connection with a simple query
		const { data, error } = await supabase
			.from('feedback')
			.select('count')
			.limit(1);

		if (error) {
			console.error('❌ Supabase connection test failed:', error);
			return json({ 
				success: false, 
				error: error.message,
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		console.log('✅ Supabase connection successful');
		return json({
			success: true,
			message: 'Supabase connection working',
			timestamp: new Date().toISOString(),
			environment: 'production',
			hasValidUrl: PUBLIC_SUPABASE_URL?.includes('supabase.co'),
			urlDomain: PUBLIC_SUPABASE_URL ? new URL(PUBLIC_SUPABASE_URL).hostname : 'unknown'
		});

	} catch (error) {
		console.error('❌ API Error:', error);
		return json({ 
			success: false, 
			error: error.message,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
}

export async function POST({ request }) {
	console.log('📝 Feedback submission API called');
	
	try {
		// Parse request body
		const body = await request.json();
		console.log('📋 Request body received:', body);
		
		// Validate required fields
		if (!body.feedback_text || typeof body.feedback_text !== 'string') {
			console.error('❌ Invalid feedback text:', body.feedback_text);
			return json({ 
				success: false, 
				error: 'feedback_text is required and must be a string' 
			}, { status: 400 });
		}

		// Sanitize and validate input
		const feedbackText = body.feedback_text.trim();
		if (feedbackText.length === 0) {
			return json({ 
				success: false, 
				error: 'Feedback text cannot be empty' 
			}, { status: 400 });
		}

		if (feedbackText.length > 2000) {
			return json({ 
				success: false, 
				error: 'Feedback text is too long (max 2000 characters)' 
			}, { status: 400 });
		}

		// Create server-side Supabase client
		const supabase = createServerSupabaseClient();
		if (!supabase) {
			return json({ 
				success: false, 
				error: 'Database connection failed' 
			}, { status: 500 });
		}

		// Prepare data for insertion
		const feedbackData = {
			feedback_text: feedbackText,
			emotion: body.emotion || null,
			rating: body.rating || null,
			created_at: new Date().toISOString(),
			source: 'landing_page'
		};

		console.log('💾 Attempting to insert feedback:', feedbackData);

		// Insert feedback into database
		const { data, error } = await supabase
			.from('feedback')
			.insert([feedbackData])
			.select();

		if (error) {
			console.error('❌ Database insertion failed:', error);
			return json({ 
				success: false, 
				error: `Database error: ${error.message}`,
				details: error
			}, { status: 500 });
		}

		console.log('✅ Feedback saved successfully:', data);
		
		return json({
			success: true,
			message: 'Feedback saved successfully',
			timestamp: new Date().toISOString(),
			id: data[0]?.id
		});

	} catch (error) {
		console.error('❌ Server error in POST /api/test-supabase:', error);
		
		// Handle JSON parsing errors
		if (error instanceof SyntaxError) {
			return json({ 
				success: false, 
				error: 'Invalid JSON in request body' 
			}, { status: 400 });
		}
		
		return json({ 
			success: false, 
			error: `Server error: ${error.message}`,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
} 