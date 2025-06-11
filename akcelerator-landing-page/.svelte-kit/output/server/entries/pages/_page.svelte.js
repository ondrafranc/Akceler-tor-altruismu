import { c as create_ssr_component, a as add_attribute, e as escape, b as each, v as validate_component } from "../../chunks/ssr.js";
import { c as currentLanguage$3 } from "../../chunks/animations.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
const Hero_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: ".language-flag.svelte-1hl5d6t{background:rgba(255, 255, 255, 0.9);border:2px solid transparent;border-radius:50%;width:48px;height:48px;font-size:1.5rem;cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);margin:0 4px;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0, 0, 0, 0.1)}.language-flag.svelte-1hl5d6t:hover{transform:scale(1.1);box-shadow:0 4px 16px rgba(0, 0, 0, 0.15)}.language-flag.active.svelte-1hl5d6t{border-color:var(--czech-forest);background:rgba(255, 255, 255, 1);transform:scale(1.05)}.scroll-indicator.svelte-1hl5d6t{animation:svelte-1hl5d6t-bounceGentle 2s ease-in-out infinite}@keyframes svelte-1hl5d6t-bounceGentle{0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}60%{transform:translateY(-4px)}}.floating-particle.svelte-1hl5d6t{animation:svelte-1hl5d6t-float 3s ease-in-out infinite}@keyframes svelte-1hl5d6t-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@media(max-width: 768px){.language-flag.svelte-1hl5d6t{width:40px;height:40px;font-size:1.2rem}.flex.svelte-1hl5d6t{flex-direction:column;align-items:center}.gap-4.svelte-1hl5d6t{gap:1rem}}",
  map: null
};
const Hero = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let heroContainer;
  let parallaxForest;
  let mainHeading;
  let subHeading;
  let ctaButtons;
  let languageSelector;
  let currentLanguage2 = "czech";
  const content = {
    czech: {
      heading: "Cítíš se zahlcen/a všemi problémy kolem?",
      subheading: "Nejsi v tom sám/sama. A existuje cesta vpřed.",
      description: "Najdi praktický způsob, jak pomoct – krok za krokem",
      ctaPrimary: "Najít svou cestu",
      ctaSecondary: "Rychlá pomoc",
      scrollText: "Scroll dolů pro více"
    },
    english: {
      heading: "Feeling overwhelmed by the world's problems?",
      subheading: "You're not alone. And there's a path forward.",
      description: "Transform empathetic overwhelm into meaningful action",
      ctaPrimary: "Find Your Path",
      ctaSecondary: "Quick Help",
      scrollText: "Scroll down to discover"
    }
  };
  $$result.css.add(css$4);
  return `<section class="parallax-container czech-flex-center"${add_attribute("this", heroContainer, 0)}> <div class="parallax-forest"${add_attribute("this", parallaxForest, 0)}></div>  <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 20%; left: 10%; width: 4px; height: 4px; background: var(--czech-forest-light); border-radius: 50%; opacity: 0.6;"></div> <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 30%; right: 15%; width: 3px; height: 3px; background: var(--copper-detail); border-radius: 50%; opacity: 0.4;"></div> <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 60%; left: 20%; width: 5px; height: 5px; background: var(--moravian-earth); border-radius: 50%; opacity: 0.5;"></div> <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 40%; right: 25%; width: 3px; height: 3px; background: var(--czech-forest); border-radius: 50%; opacity: 0.7;"></div>  <div class="absolute top-4 right-4 z-10"${add_attribute("this", languageSelector, 0)}><button class="${"language-flag " + escape("active", true) + " svelte-1hl5d6t"}" title="Čeština">🇨🇿</button> <button class="${"language-flag " + escape("", true) + " svelte-1hl5d6t"}" title="English">🇺🇸</button></div>  <div class="czech-container czech-text-center relative z-10"><h1 class="czech-heading-xl mb-6"${add_attribute("this", mainHeading, 0)}>${escape(content[currentLanguage2].heading)}</h1> <p class="czech-body-large mb-4 max-w-2xl mx-auto"${add_attribute("this", subHeading, 0)}>${escape(content[currentLanguage2].subheading)}</p> <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">${escape(content[currentLanguage2].description)}</p>  <div class="flex gap-4 justify-center flex-wrap svelte-1hl5d6t"${add_attribute("this", ctaButtons, 0)}><button class="czech-button-primary"><span>${escape(content[currentLanguage2].ctaPrimary)}</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button> <button class="czech-button-secondary">${escape(content[currentLanguage2].ctaSecondary)}</button></div>  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 czech-text-center"><p class="czech-body text-sm opacity-60 mb-2">${escape(content[currentLanguage2].scrollText)}</p> <div class="scroll-indicator svelte-1hl5d6t" data-svelte-h="svelte-j9xrzi"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--czech-forest)" stroke-width="2"><path d="M7 13l3 3 7-7M7 6l3 3 7-7"></path></svg></div></div></div> </section>`;
});
const SolidarityGarden_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".garden-wrapper.svelte-3pzjdk{position:relative;max-width:800px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(46, 93, 49, 0.1);background:var(--warm-stone)}.garden-placeholder.svelte-3pzjdk{min-height:400px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, var(--bg-accent) 0%, var(--bohemian-mist) 100%);border:2px dashed var(--subtle-border)}.placeholder-content.svelte-3pzjdk{text-align:center;padding:3rem 2rem;max-width:500px}.placeholder-icon.svelte-3pzjdk{font-size:4rem;margin-bottom:1rem;opacity:0.7}.placeholder-title.svelte-3pzjdk{font-size:1.5rem;color:var(--czech-forest);margin-bottom:1rem;font-weight:500}.placeholder-description.svelte-3pzjdk{color:var(--text-secondary);margin-bottom:2rem;line-height:1.6}.community-stats.svelte-3pzjdk{text-align:center;margin:2rem 0}.stat-circle.svelte-3pzjdk{display:inline-block;background:var(--bg-accent);border:3px solid var(--czech-forest-light);border-radius:50%;width:120px;height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 1rem}.stat-number.svelte-3pzjdk{font-size:2rem;font-weight:600;color:var(--czech-forest)}.stat-label.svelte-3pzjdk{font-size:0.8rem;color:var(--text-secondary);text-align:center;line-height:1.2}.havel-quote.svelte-3pzjdk{background:var(--bg-accent);border-left:4px solid var(--copper-detail);padding:1.5rem;border-radius:8px;text-align:center;margin-top:3rem;max-width:600px;margin-left:auto;margin-right:auto}@media(max-width: 768px){.garden-placeholder.svelte-3pzjdk{min-height:300px}.placeholder-content.svelte-3pzjdk{padding:2rem 1rem}.stat-circle.svelte-3pzjdk{width:100px;height:100px}.stat-number.svelte-3pzjdk{font-size:1.5rem}.havel-quote.svelte-3pzjdk{padding:1rem;margin-top:2rem}}@media(max-width: 900px){.garden-wrapper.svelte-3pzjdk{max-width:100%}}",
  map: null
};
let totalCommunityActions = 247;
let currentLanguage$2 = "czech";
const SolidarityGarden = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  gsap.registerPlugin(ScrollTrigger);
  let gardenContainer;
  const content = {
    czech: {
      title: "Zahrada solidarity",
      subtitle: "Interaktivní vizualizace vaší pomoci",
      comingSoon: "Již brzy...",
      description: "Zde si budete moci vizuálně sledovat dopad vaší pomoci na komunitu.",
      counter: "lidí pomohlo tento týden"
    },
    english: {
      title: "Solidarity Garden",
      subtitle: "Interactive visualization of your help",
      comingSoon: "Coming soon...",
      description: "Here you'll be able to visually track the impact of your help on the community.",
      counter: "people helped this week"
    }
  };
  $$result.css.add(css$3);
  return `<section id="solidarity-garden" class="czech-section"${add_attribute("this", gardenContainer, 0)}><div class="czech-container"><div class="czech-text-center mb-12"><h2 class="czech-heading-lg mb-4">${escape(content[currentLanguage$2].title)}</h2> <p class="czech-body-large mb-6 max-w-2xl mx-auto">${escape(content[currentLanguage$2].subtitle)}</p></div>  <div class="garden-wrapper svelte-3pzjdk"><div class="garden-placeholder svelte-3pzjdk"><div class="placeholder-content svelte-3pzjdk"><div class="placeholder-icon svelte-3pzjdk" data-svelte-h="svelte-10hqxw1">🌱</div> <h3 class="placeholder-title svelte-3pzjdk">${escape(content[currentLanguage$2].comingSoon)}</h3> <p class="placeholder-description svelte-3pzjdk">${escape(content[currentLanguage$2].description)}</p>  <div class="community-stats svelte-3pzjdk"><div class="stat-circle svelte-3pzjdk"><div class="stat-number svelte-3pzjdk">${escape(totalCommunityActions)}</div> <div class="stat-label svelte-3pzjdk">${escape(content[currentLanguage$2].counter)}</div></div></div>  <div class="havel-quote svelte-3pzjdk"><p class="czech-body italic">${escape(
    '"Naděje není přesvědčení, že se něco povede, ale jistota, že má smysl." - Václav Havel'
  )}</p></div></div></div></div></div> </section>`;
});
const CzechMap_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: ".map-container.svelte-jwly34.svelte-jwly34{display:grid;grid-template-columns:1fr 1fr;gap:3rem;max-width:1000px;margin:0 auto;align-items:start}.czech-map-svg.svelte-jwly34.svelte-jwly34{position:relative}.country-outline.svelte-jwly34.svelte-jwly34{transition:all var(--timing-medium) var(--ease-gentle)}.country-outline.svelte-jwly34.svelte-jwly34:hover{fill:var(--warm-stone)}.regional-pulse.svelte-jwly34.svelte-jwly34{cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2))}.regional-pulse.svelte-jwly34.svelte-jwly34:hover{transform:scale(1.2);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))}.regional-pulse.svelte-jwly34.svelte-jwly34:focus{outline:3px solid var(--copper-detail);outline-offset:2px}.region-label.svelte-jwly34.svelte-jwly34{pointer-events:none;font-family:'Inter', sans-serif}.solidarity-network.svelte-jwly34.svelte-jwly34{animation:svelte-jwly34-networkPulse 4s ease-in-out infinite}@keyframes svelte-jwly34-networkPulse{0%,100%{opacity:0.2}50%{opacity:0.5}}.region-info.svelte-jwly34.svelte-jwly34{background:var(--bg-primary);border:1px solid var(--subtle-border);border-radius:16px;padding:2rem;box-shadow:0 8px 32px rgba(46, 93, 49, 0.1)}.info-header.svelte-jwly34.svelte-jwly34{border-bottom:1px solid var(--subtle-border);padding-bottom:1.5rem;margin-bottom:1.5rem}.stat-badge.svelte-jwly34.svelte-jwly34{background:var(--quiet-celebration);padding:0.5rem 1rem;border-radius:20px;font-size:0.9rem;font-weight:500;color:var(--czech-forest)}.action-list.svelte-jwly34.svelte-jwly34{list-style:none;padding:0;margin:0}.action-item.svelte-jwly34.svelte-jwly34{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;font-size:0.95rem;color:var(--text-secondary)}.action-bullet.svelte-jwly34.svelte-jwly34{width:8px;height:8px;border-radius:50%;flex-shrink:0}.map-placeholder.svelte-jwly34.svelte-jwly34{background:var(--bg-secondary);border:2px dashed var(--subtle-border);border-radius:16px;padding:3rem 2rem;text-align:center;height:300px;display:flex;align-items:center;justify-content:center}.pulse-demo.svelte-jwly34.svelte-jwly34{display:flex;gap:1rem;justify-content:center;margin-bottom:1rem}.demo-pulse.svelte-jwly34.svelte-jwly34{width:16px;height:16px;border-radius:50%;animation:svelte-jwly34-demoPulse 2s ease-in-out infinite}@keyframes svelte-jwly34-demoPulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.2);opacity:1}}.historical-context.svelte-jwly34.svelte-jwly34{display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;margin-top:4rem}.context-card.svelte-jwly34.svelte-jwly34{display:flex;align-items:start;gap:1rem;background:var(--bg-accent);padding:1.5rem;border-radius:12px;border:1px solid var(--subtle-border);transition:all var(--timing-medium) var(--ease-gentle)}.context-card.svelte-jwly34.svelte-jwly34:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(46, 93, 49, 0.1)}.context-icon.svelte-jwly34.svelte-jwly34{font-size:2rem;flex-shrink:0}.context-text.svelte-jwly34 h4.svelte-jwly34{margin-bottom:0.5rem;color:var(--czech-forest)}@media(max-width: 768px){.map-container.svelte-jwly34.svelte-jwly34{grid-template-columns:1fr;gap:2rem}.region-info.svelte-jwly34.svelte-jwly34{padding:1.5rem}.map-placeholder.svelte-jwly34.svelte-jwly34{height:200px;padding:2rem 1rem}.historical-context.svelte-jwly34.svelte-jwly34{grid-template-columns:1fr;margin-top:2rem}.context-card.svelte-jwly34.svelte-jwly34{padding:1rem}.regional-pulse.svelte-jwly34.svelte-jwly34{r:10}.region-label.svelte-jwly34.svelte-jwly34{font-size:12px}}@media(max-width: 1024px) and (min-width: 769px){.map-container.svelte-jwly34.svelte-jwly34{gap:2rem}}",
  map: null
};
let currentLanguage$1 = "czech";
const CzechMap = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  gsap.registerPlugin(ScrollTrigger);
  let mapContainer;
  const regions = {
    prague: {
      name: "Praha",
      title: "Pražská inovace v pomoci",
      description: "Tech komunita spojuje síly pro sociální změnu",
      stats: "124 akcí tento měsíc",
      actions: [
        "Doučování programování pro děti",
        "IT podpora pro neziskovky",
        "Startupové mentorství"
      ],
      color: "#4A7C59",
      x: 340,
      y: 180
    },
    brno: {
      name: "Brno",
      title: "Moravská tradice vzájemnosti",
      description: "Univerzitní město s bohatou kulturou solidarity",
      stats: "89 akcí tento měsíc",
      actions: ["Studentské doučování", "Kulturní akce pro seniory", "Komunitní zahrady"],
      color: "#B08D57",
      x: 380,
      y: 260
    },
    ostrava: {
      name: "Ostrava",
      title: "Slezská solidarita",
      description: "Průmyslové město s velkým srdcem",
      stats: "67 akcí tento měsíc",
      actions: [
        "Podpora horníků v nouzi",
        "Rekvalifikační kurzy",
        "Pomoc ukrajinským rodinám"
      ],
      color: "#8B7355",
      x: 450,
      y: 200
    }
  };
  const content = {
    czech: {
      title: "Pomoc napříč Českem",
      subtitle: "Každý region má svou jedinečnou kulturu solidarity",
      selectRegion: "Klikni na region a poznej místní iniciativy",
      viewActions: "Zobrazit akce"
    },
    english: {
      title: "Help Across Czechia",
      subtitle: "Each region has its unique culture of solidarity",
      selectRegion: "Click on a region to discover local initiatives",
      viewActions: "View Actions"
    }
  };
  $$result.css.add(css$2);
  return `<section id="czech-map" class="czech-section"${add_attribute("this", mapContainer, 0)}><div class="czech-container"> <div class="czech-text-center mb-12"><h2 class="czech-heading-lg mb-4">${escape(content[currentLanguage$1].title)}</h2> <p class="czech-body-large mb-2 max-w-2xl mx-auto">${escape(content[currentLanguage$1].subtitle)}</p> <p class="czech-body opacity-70">${escape(content[currentLanguage$1].selectRegion)}</p></div>  <div class="map-container svelte-jwly34"> <div class="czech-map-svg svelte-jwly34"><svg viewBox="0 0 800 500" class="w-full h-auto"><path d="M120,200 L180,150 L250,140 L320,160 L380,150 L450,170 L520,160 L580,180 L620,220 L600,280 L550,320 L480,340 L420,350 L360,340 L300,330 L240,320 L180,300 L140,260 Z" fill="var(--bohemian-mist)" stroke="var(--czech-forest-light)" stroke-width="2" class="country-outline svelte-jwly34"></path>${each(Object.entries(regions), ([key, region]) => {
    return `<circle${add_attribute("cx", region.x, 0)}${add_attribute("cy", region.y, 0)} r="12"${add_attribute("fill", region.color, 0)} class="regional-pulse svelte-jwly34"${add_attribute("data-region", key, 0)} tabindex="0" role="button"${add_attribute("aria-label", `Select ${region.name}`, 0)}></circle>  <text${add_attribute("x", region.x, 0)}${add_attribute("y", region.y + 25, 0)} text-anchor="middle" class="region-label svelte-jwly34" fill="var(--text-primary)" font-size="14" font-weight="500">${escape(region.name)}</text>`;
  })}<g class="solidarity-network svelte-jwly34" opacity="0.3"><line x1="340" y1="180" x2="380" y2="260" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line><line x1="380" y1="260" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line><line x1="340" y1="180" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line></g></svg></div>  ${`<div class="map-placeholder svelte-jwly34" data-svelte-h="svelte-9ve3ef"><div class="placeholder-content"><div class="pulse-demo svelte-jwly34"><div class="demo-pulse svelte-jwly34" style="background-color: var(--czech-forest);"></div> <div class="demo-pulse svelte-jwly34" style="background-color: var(--copper-detail); animation-delay: 0.5s;"></div> <div class="demo-pulse svelte-jwly34" style="background-color: var(--moravian-earth); animation-delay: 1s;"></div></div> <p class="czech-body opacity-70 mt-4">Klikni na kterékoli město na mapě</p></div></div>`}</div>  <div class="historical-context svelte-jwly34" data-svelte-h="svelte-1d3n03q"><div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34">🏘️</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">Tradice pomoci sousedům</h4> <p class="text-sm opacity-80">Od moravských brigád po pražské sokolstvo - Čechům pomoc není cizí</p></div></div> <div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34">🤝</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">Moderní solidarita</h4> <p class="text-sm opacity-80">Tech komunity, studentské organizace a občanské iniciativy spojují síly</p></div></div> <div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34">💪</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">Praktický přístup</h4> <p class="text-sm opacity-80">Méně řečí, více činů - český způsob dělání dobra</p></div></div></div></div> </section>`;
});
const CTASection_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".cta-section.svelte-et5uaz.svelte-et5uaz{background:linear-gradient(135deg, var(--czech-forest-dark) 0%, var(--czech-forest) 100%);color:var(--warm-stone);padding:5rem 0;position:relative;overflow:hidden}.background-elements.svelte-et5uaz.svelte-et5uaz{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0.1}.floating-element.svelte-et5uaz.svelte-et5uaz{position:absolute;font-size:3rem}.element-1.svelte-et5uaz.svelte-et5uaz{top:20%;left:10%}.element-2.svelte-et5uaz.svelte-et5uaz{top:30%;right:15%}.element-3.svelte-et5uaz.svelte-et5uaz{bottom:30%;left:20%}.element-4.svelte-et5uaz.svelte-et5uaz{bottom:20%;right:10%}.cta-content.svelte-et5uaz.svelte-et5uaz{text-align:center;position:relative;z-index:2}.cta-header.svelte-et5uaz h2.svelte-et5uaz{color:var(--warm-stone)}.cta-buttons.svelte-et5uaz.svelte-et5uaz{display:flex;gap:1.5rem;justify-content:center;align-items:center;margin-bottom:3rem;flex-wrap:wrap}.cta-primary.svelte-et5uaz.svelte-et5uaz{font-size:1.2rem;padding:1rem 2rem;background:var(--copper-detail);box-shadow:0 4px 20px rgba(176, 141, 87, 0.3)}.cta-primary.svelte-et5uaz.svelte-et5uaz:hover{background:var(--copper-light);transform:translateY(-2px);box-shadow:0 6px 30px rgba(176, 141, 87, 0.4)}.cta-secondary.svelte-et5uaz.svelte-et5uaz{border-color:var(--warm-stone);color:var(--warm-stone)}.cta-secondary.svelte-et5uaz.svelte-et5uaz:hover{background:var(--warm-stone);color:var(--czech-forest)}.trust-indicators.svelte-et5uaz.svelte-et5uaz{display:flex;gap:2rem;justify-content:center;align-items:center;margin-bottom:3rem;flex-wrap:wrap}.guarantee.svelte-et5uaz.svelte-et5uaz,.privacy.svelte-et5uaz.svelte-et5uaz{display:flex;align-items:center;gap:0.5rem;font-size:0.9rem;opacity:0.9}.guarantee-icon.svelte-et5uaz.svelte-et5uaz,.privacy-icon.svelte-et5uaz.svelte-et5uaz{color:var(--copper-detail);font-weight:bold}.community-stats.svelte-et5uaz.svelte-et5uaz{display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:2rem;max-width:800px;margin:0 auto 3rem;padding:2rem;background:rgba(245, 241, 232, 0.1);border-radius:16px;backdrop-filter:blur(8px)}.stat-item.svelte-et5uaz.svelte-et5uaz{text-align:center}.stat-number.svelte-et5uaz.svelte-et5uaz{font-size:2.5rem;font-weight:700;color:var(--copper-detail);line-height:1;margin-bottom:0.5rem}.stat-label.svelte-et5uaz.svelte-et5uaz{font-size:0.9rem;opacity:0.8;font-weight:500}.final-message.svelte-et5uaz.svelte-et5uaz{text-align:center}.message-content.svelte-et5uaz.svelte-et5uaz{max-width:600px;margin:0 auto;padding:2rem;background:rgba(245, 241, 232, 0.05);border-radius:12px;border:1px solid rgba(245, 241, 232, 0.2)}.hearts.svelte-et5uaz.svelte-et5uaz{font-size:1.5rem;margin-top:1rem;opacity:0.8}@media(max-width: 768px){.cta-section.svelte-et5uaz.svelte-et5uaz{padding:3rem 0}.cta-buttons.svelte-et5uaz.svelte-et5uaz{flex-direction:column;align-items:stretch;gap:1rem}.cta-primary.svelte-et5uaz.svelte-et5uaz,.cta-secondary.svelte-et5uaz.svelte-et5uaz{width:100%;max-width:300px;margin:0 auto}.trust-indicators.svelte-et5uaz.svelte-et5uaz{flex-direction:column;gap:1rem}.community-stats.svelte-et5uaz.svelte-et5uaz{grid-template-columns:1fr;gap:1.5rem;padding:1.5rem}.stat-number.svelte-et5uaz.svelte-et5uaz{font-size:2rem}.floating-element.svelte-et5uaz.svelte-et5uaz{font-size:2rem}.message-content.svelte-et5uaz.svelte-et5uaz{padding:1.5rem}}@media(max-width: 1024px) and (min-width: 769px){.community-stats.svelte-et5uaz.svelte-et5uaz{grid-template-columns:repeat(3, 1fr)}}",
  map: null
};
let currentLanguage = "czech";
const CTASection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  gsap.registerPlugin(ScrollTrigger);
  let ctaContainer;
  const content = {
    czech: {
      title: "Začni svou cestu k smysluplné pomoci",
      subtitle: "Připoj se k tisícům Čechů, kteří už pomáhají",
      description: "Stačí 5 minut, abys našel/našla svou první akci. Každý krok počítá.",
      primaryCTA: "Spustit akcelerátor",
      secondaryCTA: "Rychlá akce za 2 minuty",
      stats: {
        users: "1,834 aktivních pomocníků",
        actions: "247 akcí tento týden",
        impact: "12 regionů zapojeno"
      },
      guarantee: "100% transparentní organizace",
      privacy: "Žádný spam, jen smysluplná pomoc"
    },
    english: {
      title: "Start your journey to meaningful help",
      subtitle: "Join thousands of Czechs who are already helping",
      description: "Just 5 minutes to find your first action. Every step counts.",
      primaryCTA: "Launch accelerator",
      secondaryCTA: "Quick 2-minute action",
      stats: {
        users: "1,834 active helpers",
        actions: "247 actions this week",
        impact: "12 regions involved"
      },
      guarantee: "100% transparent organizations",
      privacy: "No spam, just meaningful help"
    }
  };
  $$result.css.add(css$1);
  return `<section id="final-cta" class="cta-section svelte-et5uaz"${add_attribute("this", ctaContainer, 0)}><div class="czech-container"> <div class="background-elements svelte-et5uaz" data-svelte-h="svelte-k5ugyx"><div class="floating-element element-1 svelte-et5uaz">🌱</div> <div class="floating-element element-2 svelte-et5uaz">🤝</div> <div class="floating-element element-3 svelte-et5uaz">💚</div> <div class="floating-element element-4 svelte-et5uaz">🌍</div></div>  <div class="cta-content svelte-et5uaz"><div class="cta-header svelte-et5uaz"><h2 class="czech-heading-lg mb-4 svelte-et5uaz">${escape(content[currentLanguage].title)}</h2> <p class="czech-body-large mb-6 max-w-2xl mx-auto">${escape(content[currentLanguage].subtitle)}</p> <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">${escape(content[currentLanguage].description)}</p></div>  <div class="cta-buttons svelte-et5uaz"><button class="czech-button-primary cta-primary svelte-et5uaz"><span>${escape(content[currentLanguage].primaryCTA)}</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button> <button class="czech-button-secondary cta-secondary svelte-et5uaz">${escape(content[currentLanguage].secondaryCTA)}</button></div>  <div class="trust-indicators svelte-et5uaz"><div class="guarantee svelte-et5uaz"><span class="guarantee-icon svelte-et5uaz" data-svelte-h="svelte-1g63c70">✓</span> ${escape(content[currentLanguage].guarantee)}</div> <div class="privacy svelte-et5uaz"><span class="privacy-icon svelte-et5uaz" data-svelte-h="svelte-1h2sshi">🔒</span> ${escape(content[currentLanguage].privacy)}</div></div></div>  <div class="community-stats svelte-et5uaz"><div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-g4bb93">1,834</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.users)}</div></div> <div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-nzwmfo">247</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.actions)}</div></div> <div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-put88">12</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.impact)}</div></div></div>  <div class="final-message svelte-et5uaz"><div class="message-content svelte-et5uaz"><p class="czech-body italic">${escape(
    '"Každý velký sen začíná malým krokem. Váš krok může změnit svět."'
  )}</p> <div class="hearts svelte-et5uaz" data-svelte-h="svelte-1inp17v">💚 💚 💚</div></div></div></div> </section>`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".czech-nav.svelte-8jvaqq.svelte-8jvaqq{position:fixed;top:0;left:0;right:0;background:rgba(245, 241, 232, 0.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--subtle-border);z-index:100;transition:all var(--timing-medium) var(--ease-gentle)}.nav-container.svelte-8jvaqq.svelte-8jvaqq{max-width:1200px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:70px}.nav-logo.svelte-8jvaqq.svelte-8jvaqq{display:flex;align-items:center;gap:0.75rem;text-decoration:none;color:var(--czech-forest);font-weight:600;font-size:1.1rem}.logo-icon.svelte-8jvaqq.svelte-8jvaqq{font-size:1.5rem}.nav-links.svelte-8jvaqq.svelte-8jvaqq{display:flex;align-items:center;gap:2rem}.nav-link.svelte-8jvaqq.svelte-8jvaqq{text-decoration:none;color:var(--text-secondary);font-weight:500;transition:color var(--timing-medium) var(--ease-gentle);position:relative}.nav-link.svelte-8jvaqq.svelte-8jvaqq:hover,.nav-link.svelte-8jvaqq.svelte-8jvaqq:focus{color:var(--czech-forest)}.nav-link.svelte-8jvaqq.svelte-8jvaqq::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--copper-detail);transition:width var(--timing-medium) var(--ease-gentle)}.nav-link.svelte-8jvaqq.svelte-8jvaqq:hover::after{width:100%}.nav-actions.svelte-8jvaqq.svelte-8jvaqq{display:flex;align-items:center;gap:1rem}.language-selector.svelte-8jvaqq.svelte-8jvaqq{display:flex;background:var(--bg-secondary);border-radius:8px;padding:2px;border:1px solid var(--subtle-border)}.lang-button.svelte-8jvaqq.svelte-8jvaqq{background:transparent;border:none;padding:0.5rem;border-radius:6px;cursor:pointer;font-size:1rem;transition:all var(--timing-medium) var(--ease-gentle)}.lang-button.active.svelte-8jvaqq.svelte-8jvaqq{background:var(--czech-forest);transform:scale(1.1)}.nav-cta.svelte-8jvaqq.svelte-8jvaqq{background:var(--czech-forest);color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.5rem;transition:all var(--timing-medium) var(--ease-gentle)}.nav-cta.svelte-8jvaqq.svelte-8jvaqq:hover{background:var(--czech-forest-dark);transform:translateY(-1px)}.landing-page.svelte-8jvaqq.svelte-8jvaqq{padding-top:70px}.story-section.svelte-8jvaqq.svelte-8jvaqq{padding:5rem 0}.story-content.svelte-8jvaqq.svelte-8jvaqq{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.story-paragraphs.svelte-8jvaqq.svelte-8jvaqq{margin-bottom:2rem}.story-stats.svelte-8jvaqq.svelte-8jvaqq{display:flex;gap:2rem}.stat-item.svelte-8jvaqq.svelte-8jvaqq{text-align:center}.stat-number.svelte-8jvaqq.svelte-8jvaqq{font-size:2.5rem;font-weight:700;color:var(--czech-forest);line-height:1;margin-bottom:0.5rem}.stat-label.svelte-8jvaqq.svelte-8jvaqq{font-size:0.9rem;color:var(--text-secondary);font-weight:500}.visual-elements.svelte-8jvaqq.svelte-8jvaqq{display:flex;flex-direction:column;gap:2rem}.element.svelte-8jvaqq.svelte-8jvaqq{display:flex;align-items:center;gap:1rem;padding:1.5rem;background:var(--bg-accent);border:1px solid var(--subtle-border);border-radius:12px;transition:all var(--timing-medium) var(--ease-gentle)}.element.svelte-8jvaqq.svelte-8jvaqq:hover{transform:translateX(8px);box-shadow:0 8px 24px rgba(46, 93, 49, 0.1)}.element-icon.svelte-8jvaqq.svelte-8jvaqq{font-size:2rem;flex-shrink:0}.element-text.svelte-8jvaqq.svelte-8jvaqq{font-weight:500;color:var(--czech-forest);margin:0}.czech-footer.svelte-8jvaqq.svelte-8jvaqq{background:var(--czech-forest-dark);color:var(--warm-stone);padding:3rem 0 1rem;margin-top:4rem}.footer-content.svelte-8jvaqq.svelte-8jvaqq{display:grid;grid-template-columns:2fr 3fr;gap:3rem;margin-bottom:2rem}.footer-logo.svelte-8jvaqq.svelte-8jvaqq{display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;font-weight:600;font-size:1.2rem}.footer-description.svelte-8jvaqq.svelte-8jvaqq{color:rgba(245, 241, 232, 0.8);line-height:1.6;max-width:400px}.footer-links.svelte-8jvaqq.svelte-8jvaqq{display:grid;grid-template-columns:repeat(3, 1fr);gap:2rem}.footer-title.svelte-8jvaqq.svelte-8jvaqq{color:var(--warm-stone);font-weight:600;margin-bottom:1rem;font-size:1rem}.footer-list.svelte-8jvaqq.svelte-8jvaqq{list-style:none;padding:0;margin:0}.footer-list.svelte-8jvaqq li.svelte-8jvaqq{margin-bottom:0.5rem}.footer-list.svelte-8jvaqq a.svelte-8jvaqq{color:rgba(245, 241, 232, 0.7);text-decoration:none;transition:color var(--timing-medium) var(--ease-gentle)}.footer-list.svelte-8jvaqq a.svelte-8jvaqq:hover{color:var(--warm-stone)}.footer-bottom.svelte-8jvaqq.svelte-8jvaqq{border-top:1px solid rgba(245, 241, 232, 0.2);padding-top:1rem;display:flex;justify-content:space-between;align-items:center;font-size:0.9rem}.footer-copyright.svelte-8jvaqq.svelte-8jvaqq{color:rgba(245, 241, 232, 0.6);margin:0}.footer-meta.svelte-8jvaqq.svelte-8jvaqq{display:flex;align-items:center;gap:1rem;color:rgba(245, 241, 232, 0.6)}.footer-meta.svelte-8jvaqq a.svelte-8jvaqq{color:rgba(245, 241, 232, 0.7);text-decoration:none}.footer-meta.svelte-8jvaqq a.svelte-8jvaqq:hover{color:var(--warm-stone)}.divider.svelte-8jvaqq.svelte-8jvaqq{opacity:0.5}@media(max-width: 768px){.nav-container.svelte-8jvaqq.svelte-8jvaqq{padding:0 1rem;height:60px}.nav-links.svelte-8jvaqq.svelte-8jvaqq{display:none}.nav-actions.svelte-8jvaqq.svelte-8jvaqq{gap:0.5rem}.landing-page.svelte-8jvaqq.svelte-8jvaqq{padding-top:60px}.story-content.svelte-8jvaqq.svelte-8jvaqq{grid-template-columns:1fr;gap:2rem}.story-stats.svelte-8jvaqq.svelte-8jvaqq{justify-content:center}.visual-elements.svelte-8jvaqq.svelte-8jvaqq{order:-1}.element.svelte-8jvaqq.svelte-8jvaqq{flex-direction:column;text-align:center;padding:1rem}.footer-content.svelte-8jvaqq.svelte-8jvaqq{grid-template-columns:1fr;gap:2rem}.footer-links.svelte-8jvaqq.svelte-8jvaqq{grid-template-columns:1fr;gap:1.5rem}.footer-bottom.svelte-8jvaqq.svelte-8jvaqq{flex-direction:column;gap:1rem;text-align:center}}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let language = "czech";
  currentLanguage$3.subscribe((value) => {
    language = value;
  });
  const content = {
    czech: {
      nav: {
        home: "Domů",
        how: "Jak to funguje",
        regions: "Regiony",
        launch: "Spustit akcelerátor"
      },
      sections: {
        story: "Příběh solidarity",
        garden: "Zahrada solidarity",
        map: "Pomoc napříč Českem",
        cta: "Začni pomáhat"
      }
    },
    english: {
      nav: {
        home: "Home",
        how: "How it works",
        regions: "Regions",
        launch: "Launch accelerator"
      },
      sections: {
        story: "Story of solidarity",
        garden: "Solidarity garden",
        map: "Help across Czechia",
        cta: "Start helping"
      }
    }
  };
  $$result.css.add(css);
  return ` <nav class="czech-nav svelte-8jvaqq"><div class="nav-container svelte-8jvaqq"> <div class="nav-logo svelte-8jvaqq"><div class="logo-icon svelte-8jvaqq" data-svelte-h="svelte-a96uxz">🤝</div> <span class="logo-text">${escape(language === "czech" ? "Akcelerátor altruismu" : "Altruism Accelerator")}</span></div>  <div class="nav-links svelte-8jvaqq"><a href="#hero" class="nav-link svelte-8jvaqq" data-section="hero">${escape(content[language].nav.home)}</a> <a href="#solidarity-garden" class="nav-link svelte-8jvaqq" data-section="solidarity-garden">${escape(content[language].sections.garden)}</a> <a href="#czech-map" class="nav-link svelte-8jvaqq" data-section="czech-map">${escape(content[language].sections.map)}</a></div>  <div class="nav-actions svelte-8jvaqq"><div class="language-selector svelte-8jvaqq"><button class="${"lang-button " + escape(language === "czech" ? "active" : "", true) + " svelte-8jvaqq"}" aria-label="Česky">🇨🇿</button> <button class="${"lang-button " + escape(language === "english" ? "active" : "", true) + " svelte-8jvaqq"}" aria-label="English">🇺🇸</button></div> <button class="nav-cta svelte-8jvaqq">${escape(content[language].nav.launch)} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button></div></div></nav>  <div class="landing-page svelte-8jvaqq"> ${validate_component(Hero, "Hero").$$render($$result, {}, {}, {})}  <section id="story" class="story-section czech-section svelte-8jvaqq"><div class="czech-container"><div class="story-content svelte-8jvaqq"><div class="story-text"><h2 class="czech-heading-lg mb-6">${escape(language === "czech" ? "Od empatie k akci – česky a prakticky" : "From empathy to action – Czech and practical")}</h2> ${language === "czech" ? `<div class="story-paragraphs svelte-8jvaqq" data-svelte-h="svelte-np8txc"><p class="czech-body-large mb-4">Václav Havel říkal: &quot;Naděje není přesvědčení, že se něco povede, 
                ale jistota, že má smysl, bez ohledu na to, jak to dopadne.&quot;</p> <p class="czech-body mb-4">Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. 
                Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.</p> <p class="czech-body mb-6">Od pomoci sousedům po podporu ukrajinských rodin, od doučování dětí 
                po péči o seniory – každá akce je propojená s důvěryhodnými 
                českými organizacemi.</p></div>` : `<div class="story-paragraphs svelte-8jvaqq" data-svelte-h="svelte-1p4o3qu"><p class="czech-body-large mb-4">Václav Havel said: &quot;Hope is not the conviction that something will turn out well, 
                but the certainty that something makes sense, regardless of how it turns out.&quot;</p> <p class="czech-body mb-4">This platform was born from understanding that Czechs don&#39;t want grand gestures 
                and empty words. We want <strong>practical steps</strong> that truly help.</p> <p class="czech-body mb-6">From helping neighbors to supporting Ukrainian families, from tutoring children 
                to caring for seniors – every action is connected with trustworthy 
                Czech organizations.</p></div>`} <div class="story-stats svelte-8jvaqq"><div class="stat-item svelte-8jvaqq"><div class="stat-number svelte-8jvaqq" data-svelte-h="svelte-nzwmfo">247</div> <div class="stat-label svelte-8jvaqq">${escape(language === "czech" ? "akcí tento týden" : "actions this week")}</div></div> <div class="stat-item svelte-8jvaqq"><div class="stat-number svelte-8jvaqq" data-svelte-h="svelte-g4bb93">1,834</div> <div class="stat-label svelte-8jvaqq">${escape(language === "czech" ? "aktivních lidí" : "active helpers")}</div></div> <div class="stat-item svelte-8jvaqq"><div class="stat-number svelte-8jvaqq" data-svelte-h="svelte-put88">12</div> <div class="stat-label svelte-8jvaqq">${escape(language === "czech" ? "regionů" : "regions")}</div></div></div></div> <div class="story-visual"><div class="visual-elements svelte-8jvaqq"><div class="element element-1 svelte-8jvaqq"><div class="element-icon svelte-8jvaqq" data-svelte-h="svelte-1uxqtms">🤝</div> <p class="element-text svelte-8jvaqq">${escape(language === "czech" ? "Soused pomáhá sousedovi" : "Neighbor helps neighbor")}</p></div> <div class="element element-2 svelte-8jvaqq"><div class="element-icon svelte-8jvaqq" data-svelte-h="svelte-x26xhe">🌱</div> <p class="element-text svelte-8jvaqq">${escape(language === "czech" ? "Malé kroky, velký dopad" : "Small steps, big impact")}</p></div> <div class="element element-3 svelte-8jvaqq"><div class="element-icon svelte-8jvaqq" data-svelte-h="svelte-1o2krzy">💚</div> <p class="element-text svelte-8jvaqq">${escape(language === "czech" ? "Praktická solidarita" : "Practical solidarity")}</p></div></div></div></div></div></section>  ${validate_component(SolidarityGarden, "SolidarityGarden").$$render($$result, {}, {}, {})}  ${validate_component(CzechMap, "CzechMap").$$render($$result, {}, {}, {})}  ${validate_component(CTASection, "CTASection").$$render($$result, {}, {}, {})}  <footer class="czech-footer svelte-8jvaqq"><div class="czech-container"><div class="footer-content svelte-8jvaqq"><div class="footer-main"><div class="footer-logo svelte-8jvaqq" data-svelte-h="svelte-4jde00"><div class="logo-icon svelte-8jvaqq">🤝</div> <span class="logo-text">Akcelerátor altruismu</span></div> <p class="footer-description svelte-8jvaqq">${escape(language === "czech" ? "Praktická cesta od empatie k akci. Pomáháme tisícům Čechů najít svou cestu k smysluplné pomoci." : "Practical path from empathy to action. Helping thousands of Czechs find their way to meaningful help.")}</p></div> <div class="footer-links svelte-8jvaqq"><div class="footer-section"><h4 class="footer-title svelte-8jvaqq">${escape(language === "czech" ? "Platforma" : "Platform")}</h4> <ul class="footer-list svelte-8jvaqq"><li class="svelte-8jvaqq"><a href="#how-it-works" class="svelte-8jvaqq">${escape(language === "czech" ? "Jak to funguje" : "How it works")}</a></li> <li class="svelte-8jvaqq"><a href="#privacy" class="svelte-8jvaqq">${escape(language === "czech" ? "Soukromí" : "Privacy")}</a></li> <li class="svelte-8jvaqq"><a href="#about" class="svelte-8jvaqq">${escape(language === "czech" ? "O projektu" : "About")}</a></li></ul></div> <div class="footer-section"><h4 class="footer-title svelte-8jvaqq">${escape(language === "czech" ? "Pomoc" : "Help")}</h4> <ul class="footer-list svelte-8jvaqq"><li class="svelte-8jvaqq" data-svelte-h="svelte-lpk1xi"><a href="#faq" class="svelte-8jvaqq">FAQ</a></li> <li class="svelte-8jvaqq"><a href="#contact" class="svelte-8jvaqq">${escape(language === "czech" ? "Kontakt" : "Contact")}</a></li> <li class="svelte-8jvaqq"><a href="#support" class="svelte-8jvaqq">${escape(language === "czech" ? "Podpora" : "Support")}</a></li></ul></div> <div class="footer-section"><h4 class="footer-title svelte-8jvaqq">${escape(language === "czech" ? "Partneři" : "Partners")}</h4> <ul class="footer-list svelte-8jvaqq" data-svelte-h="svelte-nf87zv"><li class="svelte-8jvaqq"><a href="https://charita.cz" target="_blank" rel="noopener" class="svelte-8jvaqq">Charita ČR</a></li> <li class="svelte-8jvaqq"><a href="https://dobrovolnik.cz" target="_blank" rel="noopener" class="svelte-8jvaqq">Dobrovolník.cz</a></li> <li class="svelte-8jvaqq"><a href="https://adra.cz" target="_blank" rel="noopener" class="svelte-8jvaqq">ADRA</a></li></ul></div></div></div> <div class="footer-bottom svelte-8jvaqq"><p class="footer-copyright svelte-8jvaqq">© 2024 Akcelerátor altruismu. 
          ${escape(language === "czech" ? "Vytvořeno s láskou pro českou komunitu." : "Made with love for the Czech community.")}</p> <div class="footer-meta svelte-8jvaqq"><a href="#privacy" class="svelte-8jvaqq">${escape(language === "czech" ? "Ochrana soukromí" : "Privacy Policy")}</a> <span class="divider svelte-8jvaqq" data-svelte-h="svelte-fhej52">•</span> <a href="#terms" class="svelte-8jvaqq">${escape(language === "czech" ? "Podmínky" : "Terms")}</a></div></div></div></footer> </div>`;
});
export {
  Page as default
};
