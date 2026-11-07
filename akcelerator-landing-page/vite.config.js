import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['leaflet', '@vercel/analytics', '@vercel/speed-insights/sveltekit']
	},
	server: {
		port: 5173,
		host: true
	}
});
