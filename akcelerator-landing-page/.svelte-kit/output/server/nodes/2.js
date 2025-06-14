import * as server from '../entries/pages/_page.server.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.js";
export const imports = ["_app/immutable/nodes/2.ae96f9e0.js","_app/immutable/chunks/scheduler.cb03456c.js","_app/immutable/chunks/index.f2a4d7c6.js","_app/immutable/chunks/animations.7b54ff3a.js","_app/immutable/chunks/index.924a55ba.js","_app/immutable/chunks/preload-helper.a4192956.js"];
export const stylesheets = ["_app/immutable/assets/2.afa2f75a.css"];
export const fonts = [];
