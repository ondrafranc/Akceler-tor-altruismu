

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.9ddb248d.js","_app/immutable/chunks/scheduler.cb03456c.js","_app/immutable/chunks/index.f2a4d7c6.js","_app/immutable/chunks/paths.48f7e47e.js"];
export const stylesheets = ["_app/immutable/assets/1.4290aee4.css"];
export const fonts = [];
