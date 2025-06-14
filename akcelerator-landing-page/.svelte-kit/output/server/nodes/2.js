

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.50b751c3.js","_app/immutable/chunks/scheduler.11a3b940.js","_app/immutable/chunks/index.435d0ed3.js","_app/immutable/chunks/animations.448f0c86.js","_app/immutable/chunks/index.70a84795.js","_app/immutable/chunks/preload-helper.a4192956.js"];
export const stylesheets = ["_app/immutable/assets/2.df99fe25.css"];
export const fonts = [];
