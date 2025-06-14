

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.be747c7d.js","_app/immutable/chunks/scheduler.a6669ecd.js","_app/immutable/chunks/index.c65d46c3.js","_app/immutable/chunks/animations.fd85db94.js","_app/immutable/chunks/index.988aee54.js","_app/immutable/chunks/preload-helper.a4192956.js"];
export const stylesheets = ["_app/immutable/assets/2.33890437.css"];
export const fonts = [];
