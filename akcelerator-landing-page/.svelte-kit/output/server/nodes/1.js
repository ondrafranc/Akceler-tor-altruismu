

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.465035cb.js","_app/immutable/chunks/scheduler.11a3b940.js","_app/immutable/chunks/index.435d0ed3.js","_app/immutable/chunks/paths.c4aaa6c5.js"];
export const stylesheets = ["_app/immutable/assets/1.4290aee4.css"];
export const fonts = [];
