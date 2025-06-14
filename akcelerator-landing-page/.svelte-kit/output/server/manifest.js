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
		client: {"start":"_app/immutable/entry/start.a568bc09.js","app":"_app/immutable/entry/app.df871aa7.js","imports":["_app/immutable/entry/start.a568bc09.js","_app/immutable/chunks/scheduler.11a3b940.js","_app/immutable/chunks/index.70a84795.js","_app/immutable/chunks/paths.2d6e24d5.js","_app/immutable/entry/app.df871aa7.js","_app/immutable/chunks/preload-helper.a4192956.js","_app/immutable/chunks/scheduler.11a3b940.js","_app/immutable/chunks/index.435d0ed3.js"],"stylesheets":[],"fonts":[]},
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
