

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.0cd57017.js","_app/immutable/chunks/scheduler.cb03456c.js","_app/immutable/chunks/index.f2a4d7c6.js","_app/immutable/chunks/animations.7b54ff3a.js","_app/immutable/chunks/index.924a55ba.js","_app/immutable/chunks/singletons.39baebe9.js","_app/immutable/chunks/paths.332597d5.js"];
export const stylesheets = ["_app/immutable/assets/0.d60a3c2b.css"];
export const fonts = [];
