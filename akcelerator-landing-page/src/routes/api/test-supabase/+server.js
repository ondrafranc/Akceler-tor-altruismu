import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { 
	SUPABASE_URL,
	SUPABASE_ANON_KEY,
	SUPABASE_SERVICE_ROLE_KEY 
} from '$env/static/private';

// Create server-side Supabase client
function createServerSupabaseClient() {
	try {
		// Try to use the service role key first (more permissions for server-side operations)
		const url = SUPABASE_URL;
		const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
		
		if (!url || !key) {
			console.error('❌ Missing environment variables:', { 
				hasUrl: !!url, 
				hasKey: !!key,
				availableVars: { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY }
			});
			throw new Error('Missing Supabase environment variables');
		}
		
		console.log('✅ Creating Supabase client with URL:', url);
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
				error: 'Failed to create Supabase client',
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		// Test connection
		const { data, error } = await supabase
			.from('feedback')
			.select('count')
			.limit(1);

		if (error) {
			console.error('❌ Supabase query error:', error);
			return json({ 
				success: false, 
				error: error.message,
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		console.log('✅ Supabase connection successful');
		return json({ 
			success: true, 
			message: 'Supabase connection working!',
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('❌ Server error:', error);
		return json({ 
			success: false, 
			error: 'Server error: ' + error.message,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
}

export async function POST({ request }) {
	console.log('📝 Feedback submission started');
	
	try {
		const supabase = createServerSupabaseClient();
		if (!supabase) {
			return json({ 
				success: false, 
				error: 'Failed to create Supabase client' 
			}, { status: 500 });
		}

		const body = await request.json();
		console.log('📥 Received feedback data:', body);

		// Validate required field
		if (!body.feedback_text || typeof body.feedback_text !== 'string') {
			return json({ 
				success: false, 
				error: 'Missing or invalid feedback_text field' 
			}, { status: 400 });
		}

		// Validate feedback length
		if (body.feedback_text.length > 2000) {
			return json({ 
				success: false, 
				error: 'Feedback text too long (max 2000 characters)' 
			}, { status: 400 });
		}

		// Prepare data for insertion
		const feedbackData = {
			feedback_text: body.feedback_text.trim(),
			emotion: body.emotion || null,
			rating: body.rating ? parseInt(body.rating) : null,
			created_at: new Date().toISOString()
		};

		console.log('💾 Inserting feedback:', feedbackData);

		// Insert feedback into database
		const { data, error } = await supabase
			.from('feedback')
			.insert([feedbackData])
			.select();

		if (error) {
			console.error('❌ Database insertion error:', error);
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
			id: data[0]?.id
		});

	} catch (error) {
		console.error('❌ POST handler error:', error);
		return json({ 
			success: false, 
			error: 'Server error: ' + error.message 
		}, { status: 500 });
	}
} 