import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import adapter from '@sveltejs/adapter-vercel';

const vercelAdapter = adapter({
	runtime: 'nodejs24.x'
});

/**
 * Wraps @sveltejs/adapter-vercel so local Windows builds without Developer Mode
 * fall back to NTFS directory junctions instead of failing with EPERM on symlinkSync,
 * while Vercel Linux builds run 100% unmodified.
 * @type {import('@sveltejs/kit').Adapter}
 */
const safeVercelAdapter = {
	...vercelAdapter,
	async adapt(builder) {
		if (process.platform !== 'win32' || process.env.VERCEL) {
			return vercelAdapter.adapt(builder);
		}
		const origSymlinkSync = fs.symlinkSync;
		fs.symlinkSync = function patchedSymlinkSync(target, linkPath, type) {
			try {
				return origSymlinkSync.call(fs, target, linkPath, type);
			} catch (err) {
				if (err && /** @type {any} */ (err).code === 'EPERM') {
					const absTarget = path.resolve(path.dirname(String(linkPath)), String(target));
					return origSymlinkSync.call(fs, absTarget, linkPath, 'junction');
				}
				throw err;
			}
		};
		try {
			return await vercelAdapter.adapt(builder);
		} finally {
			fs.symlinkSync = origSymlinkSync;
		}
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: safeVercelAdapter,
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'https://va.vercel-scripts.com'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': [
					'self',
					'data:',
					'blob:',
					'https://*.tile.openstreetmap.org',
					'https://tile.openstreetmap.org',
					'https://*.basemaps.cartocdn.com'
				],
				'font-src': ['self', 'data:'],
				'connect-src': [
					'self',
					'https://*.supabase.co',
					'https://va.vercel-scripts.com',
					'https://*.tile.openstreetmap.org',
					'https://tile.openstreetmap.org'
				],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'object-src': ['none'],
				'upgrade-insecure-requests': true
			}
		}
	}
};

export default config;
