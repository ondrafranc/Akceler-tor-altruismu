

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.4cf3b96f.js","_app/immutable/chunks/scheduler.0f241d10.js","_app/immutable/chunks/index.eb2184c8.js","_app/immutable/chunks/paths.809aa7e3.js"];
export const stylesheets = ["_app/immutable/assets/1.4290aee4.css"];
export const fonts = [];
