export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["apple-touch-icon-czech.png","favicon-czech.png","og-image-czech.jpg","success_stories.json"]),
	mimeTypes: {".png":"image/png",".jpg":"image/jpeg",".json":"application/json"},
	_: {
		client: {"start":"_app/immutable/entry/start.e037db49.js","app":"_app/immutable/entry/app.a5db30f4.js","imports":["_app/immutable/entry/start.e037db49.js","_app/immutable/chunks/scheduler.a6669ecd.js","_app/immutable/chunks/index.988aee54.js","_app/immutable/chunks/paths.7bd8008d.js","_app/immutable/entry/app.a5db30f4.js","_app/immutable/chunks/preload-helper.a4192956.js","_app/immutable/chunks/scheduler.a6669ecd.js","_app/immutable/chunks/index.c65d46c3.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
