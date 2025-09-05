import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x'
		}),
		csp: {
			mode: 'auto',
			directives: {
				"default-src": ["self"],
				"script-src": ["self", "'unsafe-inline'", "'unsafe-eval'", "https:"],
				"style-src": ["self", "'unsafe-inline'", "https:"],
				"img-src": ["self", "data:", "https:"],
				"font-src": ["self", "https:", "data:"],
				"connect-src": ["self", "https:"],
				"frame-src": ["https:"],
				"object-src": ["none"]
			}
		}
	}
};

export default config; 