

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.08f9ed06.js","_app/immutable/chunks/scheduler.e108d1fd.js","_app/immutable/chunks/index.18a0b267.js","_app/immutable/chunks/singletons.ff1c2eaa.js","_app/immutable/chunks/index.0378bb41.js"];
export const stylesheets = [];
export const fonts = [];
