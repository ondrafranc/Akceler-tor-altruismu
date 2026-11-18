import fs from 'node:fs';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const lucideIconsSrc = fs.readFileSync(
	new URL('./src/lib/icons/lucideIcons.js', import.meta.url),
	'utf8'
);
const lucideIconImports = Array.from(
	new Set(
		Array.from(
			lucideIconsSrc.matchAll(/['"](@lucide\/svelte\/icons\/[^'"]+)['"]/g),
			(m) => m[1]
		)
	)
);

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: [
			'leaflet',
			'@vercel/analytics',
			'@vercel/speed-insights/sveltekit',
			...lucideIconImports
		]
	},
	server: {
		port: 5173,
		host: true
	}
});
