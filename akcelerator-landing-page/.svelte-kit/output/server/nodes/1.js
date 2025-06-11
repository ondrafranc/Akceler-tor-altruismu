

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.27e328ae.js","_app/immutable/chunks/scheduler.b732239f.js","_app/immutable/chunks/index.0f456b86.js","_app/immutable/chunks/paths.bbd19eee.js"];
export const stylesheets = ["_app/immutable/assets/1.4290aee4.css"];
export const fonts = [];
