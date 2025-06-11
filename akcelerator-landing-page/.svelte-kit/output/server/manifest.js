export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["apple-touch-icon-czech.png","favicon-czech.png","og-image-czech.jpg"]),
	mimeTypes: {".png":"image/png",".jpg":"image/jpeg"},
	_: {
		client: {"start":"_app/immutable/entry/start.430d983e.js","app":"_app/immutable/entry/app.4ddad023.js","imports":["_app/immutable/entry/start.430d983e.js","_app/immutable/chunks/scheduler.b732239f.js","_app/immutable/chunks/index.20b28d07.js","_app/immutable/chunks/paths.bbd19eee.js","_app/immutable/entry/app.4ddad023.js","_app/immutable/chunks/scheduler.b732239f.js","_app/immutable/chunks/index.0f456b86.js"],"stylesheets":[],"fonts":[]},
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
