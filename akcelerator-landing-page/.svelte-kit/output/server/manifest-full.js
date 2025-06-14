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
		client: {"start":"_app/immutable/entry/start.bc7dc6f4.js","app":"_app/immutable/entry/app.bd5c0887.js","imports":["_app/immutable/entry/start.bc7dc6f4.js","_app/immutable/chunks/scheduler.cb03456c.js","_app/immutable/chunks/singletons.26a1c78c.js","_app/immutable/chunks/index.924a55ba.js","_app/immutable/chunks/paths.dd0eb9fd.js","_app/immutable/entry/app.bd5c0887.js","_app/immutable/chunks/preload-helper.a4192956.js","_app/immutable/chunks/scheduler.cb03456c.js","_app/immutable/chunks/index.f2a4d7c6.js"],"stylesheets":[],"fonts":[]},
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
