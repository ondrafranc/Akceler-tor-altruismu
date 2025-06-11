

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.7f14dfa7.js","_app/immutable/chunks/scheduler.b732239f.js","_app/immutable/chunks/index.0f456b86.js","_app/immutable/chunks/animations.34440b85.js","_app/immutable/chunks/index.20b28d07.js"];
export const stylesheets = ["_app/immutable/assets/2.90dd22c5.css"];
export const fonts = [];
