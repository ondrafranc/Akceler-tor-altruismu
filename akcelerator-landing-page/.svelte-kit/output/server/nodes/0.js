

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.f789c842.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.18a0b267.js","_app/immutable/chunks/animations.7fe4b5c3.js","_app/immutable/chunks/index.0378bb41.js"];
export const stylesheets = ["_app/immutable/assets/0.d60a3c2b.css"];
export const fonts = [];
