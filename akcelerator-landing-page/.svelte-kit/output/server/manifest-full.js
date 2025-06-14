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
		client: {"start":"_app/immutable/entry/start.2029a31b.js","app":"_app/immutable/entry/app.4275e1ea.js","imports":["_app/immutable/entry/start.2029a31b.js","_app/immutable/chunks/scheduler.0f241d10.js","_app/immutable/chunks/index.6114ebb3.js","_app/immutable/chunks/paths.809aa7e3.js","_app/immutable/entry/app.4275e1ea.js","_app/immutable/chunks/preload-helper.a4192956.js","_app/immutable/chunks/scheduler.0f241d10.js","_app/immutable/chunks/index.eb2184c8.js"],"stylesheets":[],"fonts":[]},
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
