

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.d8ecbb09.js","_app/immutable/chunks/scheduler.0f241d10.js","_app/immutable/chunks/index.eb2184c8.js","_app/immutable/chunks/animations.63ee87b4.js","_app/immutable/chunks/index.6114ebb3.js"];
export const stylesheets = ["_app/immutable/assets/0.d60a3c2b.css"];
export const fonts = [];
