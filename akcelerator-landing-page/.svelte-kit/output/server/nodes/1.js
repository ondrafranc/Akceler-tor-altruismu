

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.bdab4eae.js","_app/immutable/chunks/scheduler.a6669ecd.js","_app/immutable/chunks/index.c65d46c3.js","_app/immutable/chunks/paths.af08ebfe.js"];
export const stylesheets = ["_app/immutable/assets/1.4290aee4.css"];
export const fonts = [];
