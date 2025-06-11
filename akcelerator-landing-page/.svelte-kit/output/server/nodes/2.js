

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.40513e17.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.18a0b267.js","_app/immutable/chunks/animations.7fe4b5c3.js","_app/immutable/chunks/index.0378bb41.js"];
export const stylesheets = ["_app/immutable/assets/2.7d3f9fd6.css"];
export const fonts = [];
