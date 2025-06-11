import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Vercel-specific configuration
			runtime: 'nodejs18.x'
		})
	}
};

export default config; 