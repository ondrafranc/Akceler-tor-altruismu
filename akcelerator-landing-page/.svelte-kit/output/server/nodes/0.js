

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.6ba28ee6.js","_app/immutable/chunks/scheduler.11a3b940.js","_app/immutable/chunks/index.435d0ed3.js","_app/immutable/chunks/animations.448f0c86.js","_app/immutable/chunks/index.70a84795.js"];
export const stylesheets = ["_app/immutable/assets/0.d60a3c2b.css"];
export const fonts = [];
