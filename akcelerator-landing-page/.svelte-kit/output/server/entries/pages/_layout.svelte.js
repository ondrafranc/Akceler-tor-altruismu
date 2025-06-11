import { c as create_ssr_component, e as escape, a as add_attribute } from "../../chunks/ssr.js";
import { c as currentLanguage } from "../../chunks/animations.js";
const czechTheme = "";
const _layout_svelte_svelte_type_style_lang = "";
const css = {
  code: "html{scroll-behavior:smooth;font-family:'Source Sans Pro', sans-serif}body{margin:0;padding:0;background:var(--bg-primary);color:var(--text-primary);line-height:1.6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}*{box-sizing:border-box}.streamlit-loading{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(245, 241, 232, 0.95);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(4px)}.loading-content{text-align:center;color:var(--czech-forest)}.loading-spinner{width:40px;height:40px;border:3px solid var(--subtle-border);border-top:3px solid var(--czech-forest);border-radius:50%;animation:svelte-1cvh4w9-spin 1s linear infinite;margin:0 auto 1rem}.loading-text{font-size:1.1rem;font-weight:500;margin:0}@keyframes svelte-1cvh4w9-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.czech-celebration{position:fixed;top:50%;left:50%;transform:translate(-50%, -50%);background:var(--bg-primary);border:2px solid var(--czech-forest-light);border-radius:16px;padding:2rem;text-align:center;box-shadow:0 12px 40px rgba(46, 93, 49, 0.2);z-index:1000;max-width:90vw;backdrop-filter:blur(8px)}.celebration-content{color:var(--czech-forest)}.celebration-icon{font-size:2rem;margin-bottom:0.5rem}.celebration-text{font-size:1.2rem;font-weight:500}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border:0}:focus-visible{outline:3px solid var(--copper-detail);outline-offset:2px}*{transition:color var(--timing-quick) var(--ease-gentle),\r\n                background-color var(--timing-quick) var(--ease-gentle),\r\n                border-color var(--timing-quick) var(--ease-gentle)}@media print{.language-selector,.interactive-element{display:none !important}body{background:white !important;color:black !important}}@media(prefers-contrast: high){body{background:white !important;color:black !important}}@media(prefers-reduced-motion: reduce){*{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important}html{scroll-behavior:auto}}",
  map: null
};
function updateMetaTag(name, content) {
  let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  if (meta) {
    meta.setAttribute("content", content);
  } else {
    meta = document.createElement("meta");
    meta.setAttribute(name.startsWith("og:") ? "property" : "name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
}
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const siteData = {
    czech: {
      title: "Akcelerátor altruismu - Praktická cesta k pomoci",
      description: "Najdi svou cestu od empatie k praktické akci. Připoj se k tisícům Čechů, kteří už pomáhají.",
      keywords: "altruismus, pomoc, dobrovolnictví, charita, česká solidarita"
    },
    english: {
      title: "Altruism Accelerator - From Overwhelm to Action",
      description: "Transform empathetic overwhelm into meaningful action. Join thousands making a difference.",
      keywords: "altruism, helping, volunteering, charity, social impact"
    }
  };
  let language = "czech";
  currentLanguage.subscribe((value) => {
    language = value;
    updatePageMeta(value);
  });
  function updatePageMeta(lang) {
    if (typeof document !== "undefined") {
      const data = siteData[lang];
      document.title = data.title;
      updateMetaTag("description", data.description);
      updateMetaTag("keywords", data.keywords);
      updateMetaTag("og:title", data.title);
      updateMetaTag("og:description", data.description);
      updateMetaTag("og:locale", lang === "czech" ? "cs_CZ" : "en_US");
    }
  }
  $$result.css.add(css);
  return `${$$result.head += `<!-- HEAD_svelte-gkjm9y_START -->${$$result.title = `<title>${escape(siteData[language].title)}</title>`, ""}<meta name="title"${add_attribute("content", siteData[language].title, 0)}><meta name="description"${add_attribute("content", siteData[language].description, 0)}><meta name="keywords"${add_attribute("content", siteData[language].keywords, 0)}><meta name="author" content="Akcelerátor altruismu"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta property="og:type" content="website"><meta property="og:url" content="https://akcelerator-altruismu.cz"><meta property="og:title"${add_attribute("content", siteData[language].title, 0)}><meta property="og:description"${add_attribute("content", siteData[language].description, 0)}><meta property="og:image" content="/og-image-czech.jpg"><meta property="og:locale"${add_attribute("content", language === "czech" ? "cs_CZ" : "en_US", 0)}><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url" content="https://akcelerator-altruismu.cz"><meta property="twitter:title"${add_attribute("content", siteData[language].title, 0)}><meta property="twitter:description"${add_attribute("content", siteData[language].description, 0)}><meta property="twitter:image" content="/og-image-czech.jpg"><link rel="icon" type="image/png" href="/favicon-czech.png"><link rel="apple-touch-icon" href="/apple-touch-icon-czech.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Source+Sans+Pro:wght@400;500;600&amp;display=swap" rel="stylesheet"><script type="application/ld+json" data-svelte-h="svelte-1btovn7">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": siteData[language].title,
      "description": siteData[language].description,
      "url": "https://akcelerator-altruismu.cz",
      "inLanguage": language === 'czech' ? 'cs' : 'en',
      "publisher": {
        "@type": "Organization",
        "name": "Akcelerátor altruismu",
        "description": "Platforma pro praktickou pomoc a solidaritu v České republice"
      }
    })}<\/script><!-- HEAD_svelte-gkjm9y_END -->`, ""}    <main class="app-container">${slots.default ? slots.default({}) : ``}</main> `;
});
export {
  Layout as default
};
