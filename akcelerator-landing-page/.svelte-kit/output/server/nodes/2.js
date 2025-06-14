

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.49499677.js","_app/immutable/chunks/scheduler.0f241d10.js","_app/immutable/chunks/index.eb2184c8.js","_app/immutable/chunks/animations.63ee87b4.js","_app/immutable/chunks/index.6114ebb3.js","_app/immutable/chunks/preload-helper.a4192956.js"];
export const stylesheets = ["_app/immutable/assets/2.4a0bdb57.css"];
export const fonts = [];
