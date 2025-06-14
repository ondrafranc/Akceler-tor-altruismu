import { c as create_ssr_component, a as add_attribute, e as escape, b as createEventDispatcher, o as onDestroy, v as validate_component, d as each } from "../../chunks/ssr.js";
import { c as currentLanguage$1 } from "../../chunks/animations.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import "../../chunks/client.js";
const Hero_svelte_svelte_type_style_lang = "";
const css$8 = {
  code: ".scroll-indicator.svelte-1yhxkcy{animation:svelte-1yhxkcy-bounceGentle 2s ease-in-out infinite}@keyframes svelte-1yhxkcy-bounceGentle{0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}60%{transform:translateY(-4px)}}.particle-container.svelte-1yhxkcy{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1}.floating-particle{box-shadow:0 0 6px rgba(176, 141, 87, 0.4),\r\n      0 0 12px rgba(46, 93, 49, 0.2),\r\n      0 0 18px rgba(255, 255, 255, 0.1);filter:drop-shadow(0 0 3px rgba(176, 141, 87, 0.3))\r\n      drop-shadow(0 0 6px rgba(46, 93, 49, 0.2));transition:all 0.3s ease}.floating-particle:before{content:'';position:absolute;top:-2px;left:-2px;right:-2px;bottom:-2px;background:radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);border-radius:50%;pointer-events:none}.czech-button-primary,.czech-button-secondary{opacity:1 !important;transform:translateY(0) !important}.czech-container.svelte-1yhxkcy{padding:0 2rem}.czech-heading-xl.svelte-1yhxkcy{margin-bottom:2rem}.czech-body-large.svelte-1yhxkcy{margin-bottom:1.5rem}.flex.gap-4.svelte-1yhxkcy{gap:1.5rem;margin-bottom:3rem}@media(max-width: 768px){.flex.svelte-1yhxkcy{flex-direction:column;align-items:center;gap:1rem}.czech-container.svelte-1yhxkcy{padding:0 1.5rem}.czech-heading-xl.svelte-1yhxkcy{font-size:2rem;line-height:1.2;margin-bottom:1.5rem}.czech-body-large.svelte-1yhxkcy{font-size:1.1rem;margin-bottom:1rem}.floating-particle{opacity:0.6 !important;transform:scale(0.8) !important}}@media(prefers-reduced-motion: reduce){.floating-particle{animation:none !important;opacity:0.3 !important}}@media(prefers-contrast: high){.floating-particle{opacity:0.8 !important;filter:none;box-shadow:none}}",
  map: null
};
const Hero = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let heroContainer;
  let parallaxForest;
  let mainHeading;
  let subHeading;
  let ctaButtons;
  let particleContainer;
  let language = "czech";
  currentLanguage$1.subscribe((value) => {
    language = value;
  });
  const content = {
    czech: {
      heading: "Cítíš se zahlcen/a všemi problémy kolem?",
      subheading: "Nejsi v tom sám/sama. A existuje cesta vpřed.",
      description: "Nalezni praktický způsob, jak udělat rozdíl – krok za krokem, společně",
      ctaPrimary: "Najít svou cestu",
      ctaSecondary: "Rychlá pomoc",
      scrollText: "Pokračuj níže pro více inspirace"
    },
    english: {
      heading: "Feeling overwhelmed by the world's problems?",
      subheading: "You're not alone. And there's a path forward.",
      description: "Find practical ways to make a difference – step by step, together",
      ctaPrimary: "Find Your Path",
      ctaSecondary: "I Need Help Now",
      scrollText: "Continue below for more inspiration"
    }
  };
  $$result.css.add(css$8);
  return `<section class="parallax-container czech-flex-center"${add_attribute("this", heroContainer, 0)}> <div class="parallax-forest"${add_attribute("this", parallaxForest, 0)}></div>  <div class="particle-container svelte-1yhxkcy"${add_attribute("this", particleContainer, 0)}></div>  <div class="czech-container czech-text-center relative z-10 svelte-1yhxkcy"><h1 class="czech-heading-xl mb-6 svelte-1yhxkcy"${add_attribute("this", mainHeading, 0)}>${escape(content[language].heading)}</h1> <p class="czech-body-large mb-4 max-w-2xl mx-auto svelte-1yhxkcy"${add_attribute("this", subHeading, 0)}>${escape(content[language].subheading)}</p> <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">${escape(content[language].description)}</p>  <div class="flex gap-4 justify-center flex-wrap svelte-1yhxkcy"${add_attribute("this", ctaButtons, 0)}><button class="czech-button-primary"><span>${escape(content[language].ctaPrimary)}</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button> <button class="czech-button-secondary">${escape(content[language].ctaSecondary)}</button></div>  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 czech-text-center"><p class="czech-body text-sm opacity-60 mb-2">${escape(content[language].scrollText)}</p> <div class="scroll-indicator svelte-1yhxkcy" data-svelte-h="svelte-j9xrzi"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--czech-forest)" stroke-width="2"><path d="M7 13l3 3 7-7M7 6l3 3 7-7"></path></svg></div></div></div> </section>`;
});
const StoryModal_svelte_svelte_type_style_lang = "";
const css$7 = {
  code: ".modal-overlay.svelte-1ecb3es.svelte-1ecb3es{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0, 0, 0, 0.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;backdrop-filter:blur(4px);animation:svelte-1ecb3es-fadeIn 0.3s ease-out}@keyframes svelte-1ecb3es-fadeIn{from{opacity:0}to{opacity:1}}.modal-content.svelte-1ecb3es.svelte-1ecb3es{background:white;border-radius:20px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0, 0, 0, 0.3);animation:svelte-1ecb3es-slideIn 0.3s ease-out;position:relative}@keyframes svelte-1ecb3es-slideIn{from{opacity:0;transform:translateY(-20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}.modal-header.svelte-1ecb3es.svelte-1ecb3es{display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0;position:relative}.story-icon.svelte-1ecb3es.svelte-1ecb3es{font-size:3rem;text-align:center;background:var(--bg-accent);border-radius:50%;width:80px;height:80px;display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 4px 12px rgba(46, 93, 49, 0.2)}.modal-close.svelte-1ecb3es.svelte-1ecb3es{position:absolute;top:0;right:0;background:none;border:none;font-size:1.5rem;color:var(--text-secondary);cursor:pointer;padding:8px;border-radius:50%;transition:all var(--timing-quick) var(--ease-gentle);width:40px;height:40px;display:flex;align-items:center;justify-content:center}.modal-close.svelte-1ecb3es.svelte-1ecb3es:hover{background:var(--bg-accent);color:var(--czech-forest);transform:scale(1.1)}.modal-body.svelte-1ecb3es.svelte-1ecb3es{padding:24px;text-align:center}.story-title.svelte-1ecb3es.svelte-1ecb3es{font-size:1.8rem;color:var(--czech-forest);margin:16px 0 8px;font-weight:600}.story-location.svelte-1ecb3es.svelte-1ecb3es{color:var(--text-secondary);font-size:0.9rem;margin-bottom:24px;padding:8px 16px;background:var(--bg-accent);border-radius:20px;display:inline-block}.story-action.svelte-1ecb3es.svelte-1ecb3es,.story-impact.svelte-1ecb3es.svelte-1ecb3es{margin-bottom:20px;text-align:left;background:var(--bg-accent);padding:16px;border-radius:12px;border:1px solid var(--subtle-border)}.story-action.svelte-1ecb3es h3.svelte-1ecb3es,.story-impact.svelte-1ecb3es h3.svelte-1ecb3es{color:var(--czech-forest);font-size:1rem;margin:0 0 8px 0;font-weight:600}.story-action.svelte-1ecb3es p.svelte-1ecb3es,.story-impact.svelte-1ecb3es p.svelte-1ecb3es{margin:0;color:var(--text-primary);line-height:1.5}.impact-text.svelte-1ecb3es.svelte-1ecb3es{font-weight:500;color:var(--czech-forest) !important}.story-inspiration.svelte-1ecb3es.svelte-1ecb3es{background:linear-gradient(135deg, var(--bg-accent) 0%, rgba(255, 255, 255, 0.8) 100%);padding:16px;border-radius:12px;margin:20px 0;border:2px solid var(--copper-detail)}.inspiration-text.svelte-1ecb3es.svelte-1ecb3es{margin:0;color:var(--czech-forest);font-size:1rem;line-height:1.5}.action-hint.svelte-1ecb3es.svelte-1ecb3es{background:rgba(46, 93, 49, 0.05);padding:12px 16px;border-radius:8px;margin:16px 0;border-left:3px solid var(--copper-detail)}.hint-text.svelte-1ecb3es.svelte-1ecb3es{margin:0;color:var(--text-secondary);font-size:0.9rem;line-height:1.4;font-style:italic}.modal-actions.svelte-1ecb3es.svelte-1ecb3es{margin-top:24px;display:flex;flex-direction:column;gap:12px}.primary-button.svelte-1ecb3es.svelte-1ecb3es{background:linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);color:#fff;border:none;padding:12px 24px;border-radius:25px;font-weight:600;font-size:1rem;cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);box-shadow:0 4px 12px rgba(46, 93, 49, 0.3);min-width:200px}.primary-button.svelte-1ecb3es.svelte-1ecb3es:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(46, 93, 49, 0.4);background:linear-gradient(135deg, var(--czech-forest-light) 0%, var(--czech-forest) 100%)}.secondary-button.svelte-1ecb3es.svelte-1ecb3es{background:transparent;color:var(--text-secondary);border:1px solid var(--subtle-border);padding:10px 24px;border-radius:25px;font-weight:500;font-size:0.9rem;cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);min-width:160px}.secondary-button.svelte-1ecb3es.svelte-1ecb3es:hover{background:var(--bg-accent);color:var(--czech-forest);border-color:var(--czech-forest);transform:translateY(-1px)}@media(max-width: 768px){.modal-content.svelte-1ecb3es.svelte-1ecb3es{margin:10px;max-height:95vh;border-radius:16px}.modal-header.svelte-1ecb3es.svelte-1ecb3es,.modal-body.svelte-1ecb3es.svelte-1ecb3es{padding:16px}.story-title.svelte-1ecb3es.svelte-1ecb3es{font-size:1.5rem}.story-icon.svelte-1ecb3es.svelte-1ecb3es{width:60px;height:60px;font-size:2.5rem}.primary-button.svelte-1ecb3es.svelte-1ecb3es,.secondary-button.svelte-1ecb3es.svelte-1ecb3es{width:100%;min-width:auto}.modal-actions.svelte-1ecb3es.svelte-1ecb3es{gap:8px}}@media(prefers-contrast: high){.modal-overlay.svelte-1ecb3es.svelte-1ecb3es{background:rgba(0, 0, 0, 0.8)}.modal-content.svelte-1ecb3es.svelte-1ecb3es{border:2px solid var(--czech-forest)}}@media(prefers-reduced-motion: reduce){.modal-overlay.svelte-1ecb3es.svelte-1ecb3es,.modal-content.svelte-1ecb3es.svelte-1ecb3es,.modal-close.svelte-1ecb3es.svelte-1ecb3es,.primary-button.svelte-1ecb3es.svelte-1ecb3es{animation:none;transition:none}}",
  map: null
};
const StoryModal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const dispatch = createEventDispatcher();
  let { isOpen = false } = $$props;
  let { story = null } = $$props;
  let modalElement;
  let previouslyFocused;
  let language = "czech";
  currentLanguage$1.subscribe((value) => {
    language = value;
  });
  const content = {
    czech: {
      closeLabel: "Zavřít příběh",
      whatDid: "Co udělal/a:",
      impact: "Jaký to mělo dopad:",
      inspiration: "I ty můžeš udělat rozdíl! Každá malá akce má svůj význam.",
      ctaButton: "Najít mou cestu k akci",
      ctaSecondary: "Zavřít příběh",
      actionHint: "Spusťte akcelerátor a najděte vlastní způsob, jak pomoci"
    },
    english: {
      closeLabel: "Close story",
      whatDid: "What they did:",
      impact: "What impact it had:",
      inspiration: "You can make a difference too! Every small action has its meaning.",
      ctaButton: "Find my path to action",
      ctaSecondary: "Close story",
      actionHint: "Launch the accelerator to find your own way to help"
    }
  };
  function handleKeydown(event) {
    if (event.key === "Escape") {
      closeModal();
    }
  }
  function closeModal() {
    dispatch("close");
    if (previouslyFocused) {
      previouslyFocused.focus();
    }
  }
  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
    }
  });
  if ($$props.isOpen === void 0 && $$bindings.isOpen && isOpen !== void 0)
    $$bindings.isOpen(isOpen);
  if ($$props.story === void 0 && $$bindings.story && story !== void 0)
    $$bindings.story(story);
  $$result.css.add(css$7);
  {
    if (isOpen && modalElement && typeof document !== "undefined") {
      previouslyFocused = document.activeElement;
      modalElement.focus();
    }
  }
  {
    if (typeof document !== "undefined") {
      if (isOpen) {
        document.addEventListener("keydown", handleKeydown);
        document.body.style.overflow = "hidden";
      } else {
        document.removeEventListener("keydown", handleKeydown);
        document.body.style.overflow = "";
      }
    }
  }
  return ` ${isOpen && story ? `<div class="modal-overlay svelte-1ecb3es" role="dialog" aria-modal="true" aria-labelledby="story-title" tabindex="-1"${add_attribute("this", modalElement, 0)}><div class="modal-content svelte-1ecb3es" role="document"> <div class="modal-header svelte-1ecb3es"><div class="story-icon svelte-1ecb3es">${escape(story.icon)}</div> <button class="modal-close svelte-1ecb3es"${add_attribute("aria-label", content[language].closeLabel, 0)} type="button">✕</button></div>  <div class="modal-body svelte-1ecb3es"><h2 id="story-title" class="story-title svelte-1ecb3es">${escape(language === "czech" ? story.name : story.nameEn || story.name)}</h2> <div class="story-location svelte-1ecb3es">📍 ${escape(story.location)}</div> <div class="story-action svelte-1ecb3es"><h3 class="svelte-1ecb3es">${escape(content[language].whatDid)}</h3> <p class="svelte-1ecb3es">${escape(typeof story.action === "object" ? story.action[language] : story.action)}</p></div> <div class="story-impact svelte-1ecb3es"><h3 class="svelte-1ecb3es">${escape(content[language].impact)}</h3> <p class="impact-text svelte-1ecb3es">${escape(typeof story.impact === "object" ? story.impact[language] : story.impact)}</p></div> <div class="story-inspiration svelte-1ecb3es"><p class="inspiration-text svelte-1ecb3es">✨ <strong>${escape(content[language].inspiration)}</strong></p></div> <div class="action-hint svelte-1ecb3es"><p class="hint-text svelte-1ecb3es">💡 ${escape(content[language].actionHint)}</p></div> <div class="modal-actions svelte-1ecb3es"><button class="primary-button svelte-1ecb3es">${escape(content[language].ctaButton)} 🚀</button> <button class="secondary-button svelte-1ecb3es">${escape(content[language].ctaSecondary)}</button></div></div></div></div>` : ``}`;
});
const SolidarityGarden_svelte_svelte_type_style_lang = "";
const css$6 = {
  code: ".garden-wrapper.svelte-vgo93k.svelte-vgo93k{position:relative;max-width:900px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(46, 93, 49, 0.15);background:var(--warm-stone);transition:all 0.6s ease}.garden-wrapper.spring.svelte-vgo93k.svelte-vgo93k{background:linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%)}.garden-wrapper.summer.svelte-vgo93k.svelte-vgo93k{background:linear-gradient(135deg, #fff9e6 0%, #f5f0e8 100%)}.garden-wrapper.autumn.svelte-vgo93k.svelte-vgo93k{background:linear-gradient(135deg, #faf5f0 0%, #f0e6d6 100%)}.garden-wrapper.winter.svelte-vgo93k.svelte-vgo93k{background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)}.seasonal-header.svelte-vgo93k.svelte-vgo93k{text-align:center;padding:1.5rem 2rem 0;background:rgba(255, 255, 255, 0.7);backdrop-filter:blur(10px)}.season-indicator.svelte-vgo93k.svelte-vgo93k{font-size:1.1rem;color:var(--czech-forest);font-weight:500;padding:0.5rem 1rem;background:var(--bg-accent);border-radius:20px;border:1px solid var(--subtle-border)}.garden-canvas.svelte-vgo93k.svelte-vgo93k{position:relative;min-height:400px;padding:2rem;overflow:hidden}.garden-background.svelte-vgo93k.svelte-vgo93k{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1}.hills.svelte-vgo93k.svelte-vgo93k{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg, transparent 0%, var(--bohemian-mist) 100%);border-radius:50% 50% 0 0}.sky.svelte-vgo93k.svelte-vgo93k{position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg, rgba(173, 216, 230, 0.3) 0%, transparent 100%)}.garden-floor.svelte-vgo93k.svelte-vgo93k{position:relative;z-index:2;display:grid;grid-template-columns:repeat(auto-fit, minmax(80px, 1fr));gap:1.5rem;align-items:end;padding:1rem 0;min-height:200px}.garden-element.svelte-vgo93k.svelte-vgo93k{font-size:2.5rem;text-align:center;cursor:pointer;transition:all 0.3s ease;filter:drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));transform-origin:bottom center;position:relative}.garden-element.svelte-vgo93k.svelte-vgo93k:hover{transform:scale(1.2) translateY(-5px);filter:drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))}.story-trigger.svelte-vgo93k.svelte-vgo93k{position:relative;outline:none}.story-trigger.svelte-vgo93k.svelte-vgo93k:focus{outline:2px solid var(--czech-forest);outline-offset:4px}.story-trigger.svelte-vgo93k.svelte-vgo93k::after{content:'✨';position:absolute;top:-10px;right:-10px;font-size:1rem;opacity:0;animation:svelte-vgo93k-sparkle-hint 2s ease-in-out infinite}.story-trigger.svelte-vgo93k.svelte-vgo93k:hover::after{opacity:1;animation:svelte-vgo93k-sparkle-pulse 0.5s ease-in-out infinite}@keyframes svelte-vgo93k-sparkle-hint{0%,80%,100%{opacity:0}40%{opacity:0.6}}@keyframes svelte-vgo93k-sparkle-pulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.2);opacity:1}}.tree.svelte-vgo93k.svelte-vgo93k{font-size:3rem;grid-row:span 2}.flower.svelte-vgo93k.svelte-vgo93k{font-size:2rem;animation:svelte-vgo93k-gentle-sway 3s ease-in-out infinite}.sprout.svelte-vgo93k.svelte-vgo93k{font-size:1.8rem;opacity:0.8}@keyframes svelte-vgo93k-gentle-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}.garden-controls.svelte-vgo93k.svelte-vgo93k{position:relative;z-index:3;display:flex;gap:1rem;justify-content:center;margin:2rem 0;flex-wrap:wrap}.garden-controls.svelte-vgo93k button.svelte-vgo93k{font-size:0.9rem;padding:0.75rem 1.25rem;border-radius:25px;transition:all 0.3s ease}.garden-controls.svelte-vgo93k button.svelte-vgo93k:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(46, 93, 49, 0.3)}.community-garden-stats.svelte-vgo93k.svelte-vgo93k{display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:1.5rem;padding:2rem;background:rgba(255, 255, 255, 0.6);backdrop-filter:blur(10px);border-radius:16px 16px 0 0;margin-top:2rem}.stat-plant.svelte-vgo93k.svelte-vgo93k{text-align:center;padding:1rem;background:var(--bg-accent);border-radius:12px;border:1px solid var(--subtle-border);transition:all 0.3s ease}.stat-plant.svelte-vgo93k.svelte-vgo93k:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(46, 93, 49, 0.15)}.plant-icon.svelte-vgo93k.svelte-vgo93k{font-size:2rem;margin-bottom:0.5rem}.stat-number.svelte-vgo93k.svelte-vgo93k{font-size:1.8rem;font-weight:600;color:var(--czech-forest);line-height:1;margin-bottom:0.25rem}.stat-label.svelte-vgo93k.svelte-vgo93k{font-size:0.85rem;color:var(--text-secondary);font-weight:500}.enhanced-quote.svelte-vgo93k.svelte-vgo93k{background:linear-gradient(135deg, var(--bg-accent) 0%, rgba(255, 255, 255, 0.8) 100%);border:none;border-radius:16px;padding:2rem;margin:0;backdrop-filter:blur(10px);display:flex;align-items:center;gap:1rem}.quote-decoration.svelte-vgo93k.svelte-vgo93k{font-size:1.5rem;opacity:0.6;color:var(--czech-forest)}@keyframes svelte-vgo93k-sparkle-fade{0%{opacity:1;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(180deg)}100%{opacity:0;transform:scale(0) rotate(360deg)}}@media(max-width: 768px){.garden-canvas.svelte-vgo93k.svelte-vgo93k{padding:1.5rem 1rem;min-height:300px}.garden-floor.svelte-vgo93k.svelte-vgo93k{grid-template-columns:repeat(3, 1fr);gap:1rem}.garden-element.svelte-vgo93k.svelte-vgo93k{font-size:2rem}.tree.svelte-vgo93k.svelte-vgo93k{font-size:2.5rem}.garden-controls.svelte-vgo93k.svelte-vgo93k{flex-direction:column;align-items:center}.garden-controls.svelte-vgo93k button.svelte-vgo93k{width:200px}.community-garden-stats.svelte-vgo93k.svelte-vgo93k{grid-template-columns:1fr;gap:1rem;padding:1.5rem}.enhanced-quote.svelte-vgo93k.svelte-vgo93k{flex-direction:column;text-align:center;padding:1.5rem}}@media(max-width: 900px){.garden-wrapper.svelte-vgo93k.svelte-vgo93k{max-width:100%;border-radius:16px}}.story-cta-banner.svelte-vgo93k.svelte-vgo93k{background:linear-gradient(135deg, rgba(46, 93, 49, 0.1) 0%, rgba(46, 93, 49, 0.05) 100%);border:2px solid var(--czech-forest-light);border-radius:12px;padding:1rem 2rem;margin:1.5rem auto;max-width:600px;text-align:center;animation:svelte-vgo93k-gentle-pulse 3s ease-in-out infinite}@keyframes svelte-vgo93k-gentle-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}.story-tooltip.svelte-vgo93k.svelte-vgo93k{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:var(--czech-forest);color:white;padding:0.5rem 0.75rem;border-radius:6px;font-size:0.75rem;white-space:nowrap;opacity:0;pointer-events:none;transition:all 0.3s ease;z-index:1000;margin-bottom:8px}.story-tooltip.svelte-vgo93k.svelte-vgo93k::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border:4px solid transparent;border-top-color:var(--czech-forest)}.story-trigger.svelte-vgo93k:hover .story-tooltip.svelte-vgo93k,.story-trigger.svelte-vgo93k:focus .story-tooltip.svelte-vgo93k{opacity:1;transform:translateX(-50%) translateY(-4px)}@media(max-width: 768px){.story-cta-banner.svelte-vgo93k.svelte-vgo93k{padding:0.75rem 1rem;margin:1rem auto;font-size:0.9rem}.story-tooltip.svelte-vgo93k.svelte-vgo93k{font-size:0.7rem;padding:0.4rem 0.6rem}}",
  map: null
};
const SolidarityGarden = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  gsap.registerPlugin(ScrollTrigger);
  let gardenContainer;
  let totalCommunityActions = 247;
  let language = "czech";
  let plantedSeeds = 0;
  let communityFlowers = 0;
  currentLanguage$1.subscribe((value) => {
    language = value;
  });
  let isStoryModalOpen = false;
  let currentStory = null;
  let currentSeason = "spring";
  const content = {
    czech: {
      title: "Zahrada inspirativních příběhů",
      subtitle: "Objevte skutečné příběhy naděje a solidarity",
      description: "Každá rostlina v této zahradě představuje skutečný příběh pomoce. Kliknutím na rostliny objevíte, jak lidé kolem nás mění svět k lepšímu.",
      callToAction: "🌱 Klikněte na rostliny a objevte příběhy naděje",
      counter: "lidí pomohlo tento týden",
      plantSeed: "Zasadit semínko",
      waterPlant: "Zalít rostlinu",
      watchGrow: "Sledovat růst",
      storyPrompt: "Klikněte pro inspirativní příběh",
      seasonInfo: {
        spring: "🌸 Jarní obnova - čas nových začátků",
        summer: "☀️ Letní energie - čas akcí",
        autumn: "🍂 Podzimní sklizeň - čas díkůvzdání",
        winter: "❄️ Zimní péče - čas solidarity"
      }
    },
    english: {
      title: "Garden of Inspiring Stories",
      subtitle: "Discover real stories of hope and solidarity",
      description: "Every plant in this garden represents a real story of help. Click on the plants to discover how people around us are changing the world for the better.",
      callToAction: "🌱 Click on plants to discover stories of hope",
      counter: "people helped this week",
      plantSeed: "Plant a seed",
      waterPlant: "Water plant",
      watchGrow: "Watch grow",
      storyPrompt: "Click for inspiring story",
      seasonInfo: {
        spring: "🌸 Spring renewal - time for new beginnings",
        summer: "☀️ Summer energy - time for action",
        autumn: "🍂 Autumn harvest - time for gratitude",
        winter: "❄️ Winter care - time for solidarity"
      }
    }
  };
  $$result.css.add(css$6);
  return `<section id="solidarity-garden" class="czech-section"${add_attribute("this", gardenContainer, 0)}><div class="czech-container"><div class="czech-text-center mb-12"><h2 class="czech-heading-lg mb-4">${escape(content[language].title)}</h2> <p class="czech-body-large mb-6 max-w-2xl mx-auto">${escape(content[language].subtitle)}</p> <p class="czech-body mb-6 max-w-3xl mx-auto">${escape(content[language].description)}</p>  <div class="story-cta-banner svelte-vgo93k"><p class="czech-body-large font-semibold text-czech-forest">${escape(content[language].callToAction)}</p></div></div>  <div class="${[
    "garden-wrapper svelte-vgo93k",
    "spring   "
  ].join(" ").trim()}"> <div class="seasonal-header svelte-vgo93k"><span class="season-indicator svelte-vgo93k">${escape(content[language].seasonInfo[currentSeason])}</span></div> <div class="garden-canvas svelte-vgo93k"> <div class="garden-background svelte-vgo93k" data-svelte-h="svelte-1p5fyaq"><div class="hills svelte-vgo93k"></div> <div class="sky svelte-vgo93k"></div></div>  <div class="garden-floor svelte-vgo93k"> <div class="garden-element tree interactive-element floating-element story-trigger svelte-vgo93k"${add_attribute("title", content[language].storyPrompt, 0)} role="button" tabindex="0">🌳
            <div class="story-tooltip svelte-vgo93k">${escape(content[language].storyPrompt)}</div></div> <div class="garden-element tree interactive-element floating-element story-trigger svelte-vgo93k"${add_attribute("title", content[language].storyPrompt, 0)} role="button" tabindex="0">🌲
            <div class="story-tooltip svelte-vgo93k">${escape(content[language].storyPrompt)}</div></div>  <div class="garden-element flower interactive-element floating-element seed-1 story-trigger svelte-vgo93k"${add_attribute("title", content[language].storyPrompt, 0)} role="button" tabindex="0">🌸
            <div class="story-tooltip svelte-vgo93k">${escape(content[language].storyPrompt)}</div></div> <div class="garden-element flower interactive-element floating-element seed-2 story-trigger svelte-vgo93k"${add_attribute("title", content[language].storyPrompt, 0)} role="button" tabindex="0">🌺
            <div class="story-tooltip svelte-vgo93k">${escape(content[language].storyPrompt)}</div></div> <div class="garden-element flower interactive-element floating-element seed-3 story-trigger svelte-vgo93k"${add_attribute("title", content[language].storyPrompt, 0)} role="button" tabindex="0">🌻
            <div class="story-tooltip svelte-vgo93k">${escape(content[language].storyPrompt)}</div></div>  <div class="garden-element sprout interactive-element floating-element story-trigger svelte-vgo93k"${add_attribute("title", content[language].storyPrompt, 0)} role="button" tabindex="0">🌱
            <div class="story-tooltip svelte-vgo93k">${escape(content[language].storyPrompt)}</div></div> <div class="garden-element sprout interactive-element floating-element story-trigger svelte-vgo93k"${add_attribute("title", content[language].storyPrompt, 0)} role="button" tabindex="0">🌿
            <div class="story-tooltip svelte-vgo93k">${escape(content[language].storyPrompt)}</div></div></div>  <div class="garden-controls svelte-vgo93k"><button class="czech-button-secondary interactive-element svelte-vgo93k">🌱 ${escape(content[language].plantSeed)}</button> <button class="czech-button-secondary interactive-element svelte-vgo93k">💧 ${escape(content[language].waterPlant)}</button></div>  <div class="community-garden-stats svelte-vgo93k"><div class="stat-plant svelte-vgo93k"><div class="plant-icon svelte-vgo93k" data-svelte-h="svelte-2lxhln">🌳</div> <div class="stat-number svelte-vgo93k">${escape(totalCommunityActions)}</div> <div class="stat-label svelte-vgo93k">${escape(content[language].counter)}</div></div> <div class="stat-plant svelte-vgo93k"><div class="plant-icon svelte-vgo93k" data-svelte-h="svelte-1xdyt2">🌸</div> <div class="stat-number svelte-vgo93k">${escape(plantedSeeds + communityFlowers)}</div> <div class="stat-label svelte-vgo93k">${escape(language === "czech" ? "zasazených semínek" : "planted seeds")}</div></div> <div class="stat-plant svelte-vgo93k"><div class="plant-icon svelte-vgo93k" data-svelte-h="svelte-10dscil">💚</div> <div class="stat-number svelte-vgo93k">${escape(Math.floor(totalCommunityActions / 10))}</div> <div class="stat-label svelte-vgo93k">${escape(language === "czech" ? "aktivních komunit" : "active communities")}</div></div></div></div>  <div class="havel-quote enhanced-quote svelte-vgo93k"><div class="quote-decoration svelte-vgo93k" data-svelte-h="svelte-2ak0yx">🌱</div> <p class="czech-body italic">${escape(language === "czech" ? '"Naděje není to přesvědčení, že něco dobře dopadne, ale jistota, že má něco smysl – bez ohledu na to, jak to dopadne." - Václav Havel' : '"Hope is not the conviction that something will turn out well, but the certainty that something is meaningful – no matter how it turns out." - Václav Havel')}</p> <div class="quote-decoration svelte-vgo93k" data-svelte-h="svelte-2ak0yx">🌱</div></div></div></div>  ${validate_component(StoryModal, "StoryModal").$$render(
    $$result,
    {
      isOpen: isStoryModalOpen,
      story: currentStory
    },
    {},
    {}
  )} </section>`;
});
const CzechMap_svelte_svelte_type_style_lang = "";
const css$5 = {
  code: ".map-container.svelte-jwly34.svelte-jwly34{display:grid;grid-template-columns:1fr 1fr;gap:3rem;max-width:1000px;margin:0 auto;align-items:start}.czech-map-svg.svelte-jwly34.svelte-jwly34{position:relative}.country-outline.svelte-jwly34.svelte-jwly34{transition:all var(--timing-medium) var(--ease-gentle)}.country-outline.svelte-jwly34.svelte-jwly34:hover{fill:var(--warm-stone)}.regional-pulse.svelte-jwly34.svelte-jwly34{cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2))}.regional-pulse.svelte-jwly34.svelte-jwly34:hover{transform:scale(1.2);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))}.regional-pulse.svelte-jwly34.svelte-jwly34:focus{outline:3px solid var(--copper-detail);outline-offset:2px}.region-label.svelte-jwly34.svelte-jwly34{pointer-events:none;font-family:'Inter', sans-serif}.solidarity-network.svelte-jwly34.svelte-jwly34{animation:svelte-jwly34-networkPulse 4s ease-in-out infinite}@keyframes svelte-jwly34-networkPulse{0%,100%{opacity:0.2}50%{opacity:0.5}}.region-info.svelte-jwly34.svelte-jwly34{background:var(--bg-primary);border:1px solid var(--subtle-border);border-radius:16px;padding:2rem;box-shadow:0 8px 32px rgba(46, 93, 49, 0.1)}.info-header.svelte-jwly34.svelte-jwly34{border-bottom:1px solid var(--subtle-border);padding-bottom:1.5rem;margin-bottom:1.5rem}.stat-badge.svelte-jwly34.svelte-jwly34{background:var(--quiet-celebration);padding:0.5rem 1rem;border-radius:20px;font-size:0.9rem;font-weight:500;color:var(--czech-forest)}.action-list.svelte-jwly34.svelte-jwly34{list-style:none;padding:0;margin:0}.action-item.svelte-jwly34.svelte-jwly34{display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;font-size:0.95rem;color:var(--text-secondary)}.action-bullet.svelte-jwly34.svelte-jwly34{width:8px;height:8px;border-radius:50%;flex-shrink:0}.map-placeholder.svelte-jwly34.svelte-jwly34{background:var(--bg-secondary);border:2px dashed var(--subtle-border);border-radius:16px;padding:3rem 2rem;text-align:center;height:300px;display:flex;align-items:center;justify-content:center}.pulse-demo.svelte-jwly34.svelte-jwly34{display:flex;gap:1rem;justify-content:center;margin-bottom:1rem}.demo-pulse.svelte-jwly34.svelte-jwly34{width:16px;height:16px;border-radius:50%;animation:svelte-jwly34-demoPulse 2s ease-in-out infinite}@keyframes svelte-jwly34-demoPulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.2);opacity:1}}.historical-context.svelte-jwly34.svelte-jwly34{display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;margin-top:4rem}.context-card.svelte-jwly34.svelte-jwly34{display:flex;align-items:start;gap:1rem;background:var(--bg-accent);padding:1.5rem;border-radius:12px;border:1px solid var(--subtle-border);transition:all var(--timing-medium) var(--ease-gentle)}.context-card.svelte-jwly34.svelte-jwly34:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(46, 93, 49, 0.1)}.context-icon.svelte-jwly34.svelte-jwly34{font-size:2rem;flex-shrink:0}.context-text.svelte-jwly34 h4.svelte-jwly34{margin-bottom:0.5rem;color:var(--czech-forest)}@media(max-width: 768px){.map-container.svelte-jwly34.svelte-jwly34{grid-template-columns:1fr;gap:2rem}.region-info.svelte-jwly34.svelte-jwly34{padding:1.5rem}.map-placeholder.svelte-jwly34.svelte-jwly34{height:200px;padding:2rem 1rem}.historical-context.svelte-jwly34.svelte-jwly34{grid-template-columns:1fr;margin-top:2rem}.context-card.svelte-jwly34.svelte-jwly34{padding:1rem}.regional-pulse.svelte-jwly34.svelte-jwly34{r:10}.region-label.svelte-jwly34.svelte-jwly34{font-size:12px}}@media(max-width: 1024px) and (min-width: 769px){.map-container.svelte-jwly34.svelte-jwly34{gap:2rem}}",
  map: null
};
const CzechMap = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  gsap.registerPlugin(ScrollTrigger);
  let mapContainer;
  let language = "czech";
  currentLanguage$1.subscribe((value) => {
    language = value;
  });
  const regions = {
    prague: {
      name: { czech: "Praha", english: "Prague" },
      title: {
        czech: "Pražská inovace v pomoci",
        english: "Prague Innovation in Helping"
      },
      description: {
        czech: "Tech komunita spojuje síly pro sociální změnu",
        english: "Tech community joins forces for social change"
      },
      stats: {
        czech: "124 akcí tento měsíc",
        english: "124 actions this month"
      },
      actions: {
        czech: [
          "Doučování programování pro děti",
          "IT podpora pro neziskovky",
          "Startupové mentorství"
        ],
        english: [
          "Programming tutoring for children",
          "IT support for nonprofits",
          "Startup mentorship"
        ]
      },
      color: "#4A7C59",
      x: 340,
      y: 180
    },
    brno: {
      name: { czech: "Brno", english: "Brno" },
      title: {
        czech: "Moravská tradice vzájemnosti",
        english: "Moravian Tradition of Solidarity"
      },
      description: {
        czech: "Univerzitní město s bohatou kulturou solidarity",
        english: "University city with rich culture of solidarity"
      },
      stats: {
        czech: "89 akcí tento měsíc",
        english: "89 actions this month"
      },
      actions: {
        czech: ["Studentské doučování", "Kulturní akce pro seniory", "Komunitní zahrady"],
        english: ["Student tutoring", "Cultural events for seniors", "Community gardens"]
      },
      color: "#B08D57",
      x: 380,
      y: 260
    },
    ostrava: {
      name: { czech: "Ostrava", english: "Ostrava" },
      title: {
        czech: "Slezská solidarita",
        english: "Silesian Solidarity"
      },
      description: {
        czech: "Průmyslové město s velkým srdcem",
        english: "Industrial city with a big heart"
      },
      stats: {
        czech: "67 akcí tento měsíc",
        english: "67 actions this month"
      },
      actions: {
        czech: [
          "Podpora horníků v nouzi",
          "Rekvalifikační kurzy",
          "Pomoc ukrajinským rodinám"
        ],
        english: [
          "Support for miners in need",
          "Retraining courses",
          "Help for Ukrainian families"
        ]
      },
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
      viewActions: "Zobrazit akce",
      localInitiatives: "Místní iniciativy:",
      clickAnyCity: "Klikni na kterékoli město na mapě",
      historicalContext: {
        neighborHelp: {
          title: "Tradice pomoci sousedům",
          subtitle: "Od moravských brigád po pražské sokolstvo - Čechům pomoc není cizí"
        },
        modernSolidarity: {
          title: "Moderní solidarita",
          subtitle: "Tech komunity, studentské organizace a občanské iniciativy spojují síly"
        },
        practicalApproach: {
          title: "Praktický přístup",
          subtitle: "Méně řečí, více činů - český způsob dělání dobra"
        }
      }
    },
    english: {
      title: "Help Across Czechia",
      subtitle: "Each region has its unique culture of solidarity",
      selectRegion: "Click on a region to discover local initiatives",
      viewActions: "View Actions",
      localInitiatives: "Local initiatives:",
      clickAnyCity: "Click on any city on the map",
      historicalContext: {
        neighborHelp: {
          title: "Tradition of Helping Neighbors",
          subtitle: "From Moravian brigades to Prague sokol movement - helping is not foreign to Czechs"
        },
        modernSolidarity: {
          title: "Modern Solidarity",
          subtitle: "Tech communities, student organizations and civic initiatives join forces"
        },
        practicalApproach: {
          title: "Practical Approach",
          subtitle: "Less talk, more action - the Czech way of doing good"
        }
      }
    }
  };
  $$result.css.add(css$5);
  return `<section id="czech-map" class="czech-section"${add_attribute("this", mapContainer, 0)}><div class="czech-container"> <div class="czech-text-center mb-12"><h2 class="czech-heading-lg mb-4">${escape(content[language].title)}</h2> <p class="czech-body-large mb-2 max-w-2xl mx-auto">${escape(content[language].subtitle)}</p> <p class="czech-body opacity-70">${escape(content[language].selectRegion)}</p></div>  <div class="map-container svelte-jwly34"> <div class="czech-map-svg svelte-jwly34"><svg viewBox="0 0 800 500" class="w-full h-auto"><path d="M120,200 L180,150 L250,140 L320,160 L380,150 L450,170 L520,160 L580,180 L620,220 L600,280 L550,320 L480,340 L420,350 L360,340 L300,330 L240,320 L180,300 L140,260 Z" fill="var(--bohemian-mist)" stroke="var(--czech-forest-light)" stroke-width="2" class="country-outline svelte-jwly34"></path>${each(Object.entries(regions), ([key, region]) => {
    return `<circle${add_attribute("cx", region.x, 0)}${add_attribute("cy", region.y, 0)} r="12"${add_attribute("fill", region.color, 0)} class="regional-pulse svelte-jwly34"${add_attribute("data-region", key, 0)} tabindex="0" role="button"${add_attribute(
      "aria-label",
      language === "czech" ? `Vybrat ${region.name[language]}` : `Select ${region.name[language]}`,
      0
    )}></circle>  <text${add_attribute("x", region.x, 0)}${add_attribute("y", region.y + 25, 0)} text-anchor="middle" class="region-label svelte-jwly34" fill="var(--text-primary)" font-size="14" font-weight="500">${escape(region.name[language])}</text>`;
  })}<g class="solidarity-network svelte-jwly34" opacity="0.3"><line x1="340" y1="180" x2="380" y2="260" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line><line x1="380" y1="260" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line><line x1="340" y1="180" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line></g></svg></div>  ${`<div class="map-placeholder svelte-jwly34"><div class="placeholder-content"><div class="pulse-demo svelte-jwly34" data-svelte-h="svelte-1hl3g9o"><div class="demo-pulse svelte-jwly34" style="background-color: var(--czech-forest);"></div> <div class="demo-pulse svelte-jwly34" style="background-color: var(--copper-detail); animation-delay: 0.5s;"></div> <div class="demo-pulse svelte-jwly34" style="background-color: var(--moravian-earth); animation-delay: 1s;"></div></div> <p class="czech-body opacity-70 mt-4">${escape(content[language].clickAnyCity)}</p></div></div>`}</div>  <div class="historical-context svelte-jwly34"><div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34" data-svelte-h="svelte-1vatxvd">🏘️</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">${escape(content[language].historicalContext.neighborHelp.title)}</h4> <p class="text-sm opacity-80">${escape(content[language].historicalContext.neighborHelp.subtitle)}</p></div></div> <div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34" data-svelte-h="svelte-kgjzy9">🤝</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">${escape(content[language].historicalContext.modernSolidarity.title)}</h4> <p class="text-sm opacity-80">${escape(content[language].historicalContext.modernSolidarity.subtitle)}</p></div></div> <div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34" data-svelte-h="svelte-14o1c63">💪</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">${escape(content[language].historicalContext.practicalApproach.title)}</h4> <p class="text-sm opacity-80">${escape(content[language].historicalContext.practicalApproach.subtitle)}</p></div></div></div></div> </section>`;
});
const ImmediateHelp_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: ".immediate-help.svelte-14n3mku.svelte-14n3mku{position:fixed;bottom:20px;right:20px;background:var(--bg-primary);border:2px solid var(--copper-detail);border-radius:16px;box-shadow:0 8px 32px rgba(46, 93, 49, 0.15);z-index:40;max-width:400px;transition:all var(--timing-medium) var(--ease-gentle);backdrop-filter:blur(8px)}.expanded.svelte-14n3mku.svelte-14n3mku{max-width:500px;max-height:80vh;overflow-y:auto}.help-header.svelte-14n3mku.svelte-14n3mku{display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;cursor:pointer;transition:all var(--timing-quick) var(--ease-gentle)}.help-header.svelte-14n3mku.svelte-14n3mku:hover{background:var(--bg-accent)}.help-icon.svelte-14n3mku.svelte-14n3mku{font-size:1.5rem;flex-shrink:0}.help-text.svelte-14n3mku.svelte-14n3mku{flex:1}.help-text.svelte-14n3mku h4.svelte-14n3mku{margin:0 0 0.25rem 0;color:var(--czech-forest);font-size:1rem;font-weight:600}.help-text.svelte-14n3mku p.svelte-14n3mku{margin:0;color:var(--text-secondary);font-size:0.9rem}.toggle-button.svelte-14n3mku.svelte-14n3mku{background:none;border:none;cursor:pointer;color:var(--czech-forest);transition:transform var(--timing-quick) var(--ease-gentle)}.chevron.svelte-14n3mku.svelte-14n3mku{transition:transform var(--timing-medium) var(--ease-gentle)}.chevron.rotated.svelte-14n3mku.svelte-14n3mku{transform:rotate(180deg)}.help-content.svelte-14n3mku.svelte-14n3mku{border-top:1px solid var(--subtle-border);padding:1.5rem}.resources-grid.svelte-14n3mku.svelte-14n3mku{display:grid;gap:1rem;margin-bottom:1.5rem}.resource-card.svelte-14n3mku.svelte-14n3mku{padding:1rem;background:var(--bg-accent);border-radius:8px;border:1px solid var(--subtle-border)}.resource-header.svelte-14n3mku.svelte-14n3mku{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem}.resource-name.svelte-14n3mku.svelte-14n3mku{color:var(--czech-forest);font-size:0.95rem}.resource-availability.svelte-14n3mku.svelte-14n3mku{font-size:0.8rem;color:var(--text-muted);text-align:right}.resource-phone.svelte-14n3mku.svelte-14n3mku{display:inline-block;color:var(--czech-forest);text-decoration:none;font-weight:600;font-size:1.1rem;margin-bottom:0.5rem;transition:color var(--timing-quick) var(--ease-gentle)}.resource-phone.svelte-14n3mku.svelte-14n3mku:hover{color:var(--copper-detail)}.resource-description.svelte-14n3mku.svelte-14n3mku{margin:0;color:var(--text-secondary);font-size:0.9rem}.emergency-note.svelte-14n3mku.svelte-14n3mku{display:flex;align-items:flex-start;gap:0.75rem;padding:1rem;background:rgba(176, 141, 87, 0.1);border-radius:8px;border-left:4px solid var(--copper-detail)}.emergency-icon.svelte-14n3mku.svelte-14n3mku{font-size:1.2rem;flex-shrink:0}.emergency-note.svelte-14n3mku p.svelte-14n3mku{margin:0;color:var(--text-primary);font-size:0.9rem;font-weight:500}@media(max-width: 768px){.immediate-help.svelte-14n3mku.svelte-14n3mku{bottom:10px;right:10px;left:10px;max-width:none}.expanded.svelte-14n3mku.svelte-14n3mku{max-width:none}.help-header.svelte-14n3mku.svelte-14n3mku{padding:1rem}.help-content.svelte-14n3mku.svelte-14n3mku{padding:1rem}.resources-grid.svelte-14n3mku.svelte-14n3mku{grid-template-columns:1fr}}@media(prefers-reduced-motion: reduce){.immediate-help.svelte-14n3mku.svelte-14n3mku,.help-header.svelte-14n3mku.svelte-14n3mku,.toggle-button.svelte-14n3mku.svelte-14n3mku,.chevron.svelte-14n3mku.svelte-14n3mku{transition:none}}@media(prefers-contrast: high){.immediate-help.svelte-14n3mku.svelte-14n3mku{border-width:3px}.resource-card.svelte-14n3mku.svelte-14n3mku{border-width:2px}}",
  map: null
};
const ImmediateHelp = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let language = "czech";
  currentLanguage$1.subscribe((value) => {
    language = value;
  });
  const helpResources = {
    czech: {
      title: "Potřebujete okamžitou pomoc?",
      subtitle: "Důvěryhodné linky a služby dostupné 24/7",
      resources: [
        {
          name: "Linka bezpečí",
          phone: "116 111",
          description: "Pro děti a mladé do 26 let",
          available: "24/7 zdarma"
        },
        {
          name: "Krizová intervence",
          phone: "283 892 772",
          description: "Praha - psychologická pomoc",
          available: "24/7"
        },
        {
          name: "Centrum krizové intervence",
          phone: "241 484 149",
          description: "Ostrava - krizová pomoc",
          available: "24/7"
        },
        {
          name: "SOS linka",
          phone: "596 618 908",
          description: "Brno - psychosociální pomoc",
          available: "24/7"
        },
        {
          name: "Člověk v tísni",
          phone: "775 285 088",
          description: "Sociální poradenství",
          available: "Po-Pá 9-17"
        }
      ],
      toggleText: "Zobrazit linky pomoci",
      emergencyNote: "V akutní nouzi volejte 155 (záchranná služba) nebo 158 (policie)"
    },
    english: {
      title: "Need immediate help?",
      subtitle: "Trusted 24/7 support services",
      resources: [
        {
          name: "Safety Line",
          phone: "116 111",
          description: "For children and youth up to 26",
          available: "24/7 free"
        },
        {
          name: "Crisis Intervention",
          phone: "283 892 772",
          description: "Prague - psychological help",
          available: "24/7"
        },
        {
          name: "Crisis Center",
          phone: "241 484 149",
          description: "Ostrava - crisis support",
          available: "24/7"
        },
        {
          name: "SOS Line",
          phone: "596 618 908",
          description: "Brno - psychosocial help",
          available: "24/7"
        },
        {
          name: "People in Need",
          phone: "775 285 088",
          description: "Social counseling",
          available: "Mon-Fri 9-17"
        }
      ],
      toggleText: "Show help lines",
      emergencyNote: "For acute emergency call 155 (ambulance) or 158 (police)"
    }
  };
  $$result.css.add(css$4);
  return `<div class="${["immediate-help svelte-14n3mku", ""].join(" ").trim()}"><div class="help-header svelte-14n3mku" role="button" tabindex="0"><div class="help-icon svelte-14n3mku" data-svelte-h="svelte-2xid1o">🆘</div> <div class="help-text svelte-14n3mku"><h4 class="svelte-14n3mku">${escape(helpResources[language].title)}</h4> <p class="svelte-14n3mku">${escape(helpResources[language].subtitle)}</p></div> <button class="toggle-button svelte-14n3mku"${add_attribute("aria-label", helpResources[language].toggleText, 0)}><svg class="${["chevron svelte-14n3mku", ""].join(" ").trim()}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></button></div> ${``} </div>`;
});
const CTASection_svelte_svelte_type_style_lang = "";
const css$3 = {
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
  $$result.css.add(css$3);
  return `<section id="final-cta" class="cta-section svelte-et5uaz"${add_attribute("this", ctaContainer, 0)}><div class="czech-container"> <div class="background-elements svelte-et5uaz" data-svelte-h="svelte-k5ugyx"><div class="floating-element element-1 svelte-et5uaz">🌱</div> <div class="floating-element element-2 svelte-et5uaz">🤝</div> <div class="floating-element element-3 svelte-et5uaz">💚</div> <div class="floating-element element-4 svelte-et5uaz">🌍</div></div>  <div class="cta-content svelte-et5uaz"><div class="cta-header svelte-et5uaz"><h2 class="czech-heading-lg mb-4 svelte-et5uaz">${escape(content[currentLanguage].title)}</h2> <p class="czech-body-large mb-6 max-w-2xl mx-auto">${escape(content[currentLanguage].subtitle)}</p> <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">${escape(content[currentLanguage].description)}</p></div>  <div class="cta-buttons svelte-et5uaz"><button class="czech-button-primary cta-primary svelte-et5uaz"><span>${escape(content[currentLanguage].primaryCTA)}</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button> <button class="czech-button-secondary cta-secondary svelte-et5uaz">${escape(content[currentLanguage].secondaryCTA)}</button></div>  <div class="trust-indicators svelte-et5uaz"><div class="guarantee svelte-et5uaz"><span class="guarantee-icon svelte-et5uaz" data-svelte-h="svelte-1g63c70">✓</span> ${escape(content[currentLanguage].guarantee)}</div> <div class="privacy svelte-et5uaz"><span class="privacy-icon svelte-et5uaz" data-svelte-h="svelte-1h2sshi">🔒</span> ${escape(content[currentLanguage].privacy)}</div></div></div>  <div class="community-stats svelte-et5uaz"><div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-g4bb93">1,834</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.users)}</div></div> <div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-nzwmfo">247</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.actions)}</div></div> <div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-put88">12</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.impact)}</div></div></div>  <div class="final-message svelte-et5uaz"><div class="message-content svelte-et5uaz"><p class="czech-body italic">${escape(
    '"Každý velký sen začíná malým krokem. Váš krok může změnit svět."'
  )}</p> <div class="hearts svelte-et5uaz" data-svelte-h="svelte-1inp17v">💚 💚 💚</div></div></div></div> </section>`;
});
const FeedbackModal_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: ".feedback-trigger.svelte-1kwb6bh{position:fixed;bottom:140px;right:30px;background:linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);color:white;border:none;border-radius:50px;padding:12px 20px;font-weight:500;font-size:0.9rem;cursor:pointer;box-shadow:0 4px 20px rgba(46, 93, 49, 0.3);transition:all var(--timing-medium) var(--ease-gentle);z-index:45;display:flex;align-items:center;gap:8px;max-width:200px;opacity:1;visibility:visible}.feedback-trigger.svelte-1kwb6bh:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(46, 93, 49, 0.4);background:linear-gradient(135deg, var(--czech-forest-light) 0%, var(--czech-forest) 100%)}.feedback-icon.svelte-1kwb6bh{font-size:1.2rem;flex-shrink:0}.feedback-text.svelte-1kwb6bh{white-space:nowrap}@media(max-width: 768px){.feedback-trigger.svelte-1kwb6bh{bottom:120px;right:15px;left:auto;padding:10px 16px;font-size:0.85rem;max-width:160px}.feedback-text.svelte-1kwb6bh{display:none}.feedback-icon.svelte-1kwb6bh{font-size:1.4rem}}@media(max-width: 480px){.feedback-trigger.svelte-1kwb6bh{bottom:100px;right:10px;border-radius:50%;padding:12px;width:48px;height:48px;justify-content:center}}.modal-overlay.svelte-1kwb6bh{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0, 0, 0, 0.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(4px);animation:svelte-1kwb6bh-fadeIn 0.3s ease-out}@keyframes svelte-1kwb6bh-fadeIn{from{opacity:0}to{opacity:1}}.modal-content.svelte-1kwb6bh{background:white;border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0, 0, 0, 0.3);animation:svelte-1kwb6bh-slideIn 0.3s ease-out}@keyframes svelte-1kwb6bh-slideIn{from{opacity:0;transform:translateY(-20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}.modal-header.svelte-1kwb6bh{display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0;border-bottom:1px solid var(--subtle-border);margin-bottom:24px}.modal-title.svelte-1kwb6bh{font-size:1.5rem;color:var(--czech-forest);margin:0;font-weight:600}.modal-close.svelte-1kwb6bh{background:none;border:none;font-size:1.5rem;color:var(--text-secondary);cursor:pointer;padding:8px;border-radius:8px;transition:all var(--timing-quick) var(--ease-gentle)}.modal-close.svelte-1kwb6bh:hover{background:var(--bg-accent);color:var(--czech-forest)}.modal-body.svelte-1kwb6bh{padding:0 24px 24px}.modal-subtitle.svelte-1kwb6bh{color:var(--text-secondary);margin-bottom:24px;line-height:1.6}.feedback-form.svelte-1kwb6bh{display:flex;flex-direction:column;gap:20px}.form-group.svelte-1kwb6bh{display:flex;flex-direction:column;gap:8px}.form-label.svelte-1kwb6bh{font-weight:500;color:var(--text-primary);font-size:0.9rem}.optional.svelte-1kwb6bh{color:var(--text-muted);font-weight:400;font-size:0.8rem}.feedback-textarea.svelte-1kwb6bh{padding:12px;border:1px solid var(--subtle-border);border-radius:8px;font-family:inherit;font-size:0.9rem;line-height:1.5;resize:vertical;transition:border-color var(--timing-medium) var(--ease-gentle)}.feedback-textarea.svelte-1kwb6bh:focus{outline:none;border-color:var(--czech-forest);box-shadow:0 0 0 2px rgba(46, 93, 49, 0.1)}.char-counter.svelte-1kwb6bh{font-size:0.8rem;color:var(--text-muted);text-align:right}.emotion-select.svelte-1kwb6bh{padding:12px;border:1px solid var(--subtle-border);border-radius:8px;background:white;font-family:inherit;font-size:0.9rem;transition:border-color var(--timing-medium) var(--ease-gentle)}.emotion-select.svelte-1kwb6bh:focus{outline:none;border-color:var(--czech-forest);box-shadow:0 0 0 2px rgba(46, 93, 49, 0.1)}.star-rating-fieldset.svelte-1kwb6bh{border:none;padding:0;margin:0}.star-rating.svelte-1kwb6bh{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.star.svelte-1kwb6bh{background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px;border-radius:4px;transition:all var(--timing-quick) var(--ease-gentle);opacity:0.3;color:#fbbf24}.star.svelte-1kwb6bh:hover,.star.filled.svelte-1kwb6bh{opacity:1;transform:scale(1.1)}.rating-label.svelte-1kwb6bh{font-size:0.85rem;color:var(--text-secondary);margin-left:8px;font-weight:500}.status-message.svelte-1kwb6bh{padding:12px;border-radius:8px;font-size:0.9rem;font-weight:500;text-align:center}.status-message.success.svelte-1kwb6bh{background:rgba(74, 124, 89, 0.1);color:var(--czech-forest);border:1px solid var(--czech-forest-light)}.status-message.error.svelte-1kwb6bh{background:rgba(220, 53, 69, 0.1);color:#dc3545;border:1px solid rgba(220, 53, 69, 0.3)}.submit-button.svelte-1kwb6bh{background:linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);color:white;border:none;padding:14px 24px;border-radius:8px;font-weight:500;font-size:0.95rem;cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);display:flex;align-items:center;justify-content:center;gap:8px}.submit-button.svelte-1kwb6bh:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(46, 93, 49, 0.4)}.submit-button.svelte-1kwb6bh:disabled{opacity:0.6;cursor:not-allowed;transform:none}.spinner.svelte-1kwb6bh{width:16px;height:16px;border:2px solid rgba(255, 255, 255, 0.3);border-radius:50%;border-top-color:white;animation:svelte-1kwb6bh-spin 1s ease-in-out infinite}@keyframes svelte-1kwb6bh-spin{to{transform:rotate(360deg)}}@media(max-width: 768px){.feedback-trigger.svelte-1kwb6bh{bottom:20px;right:20px;padding:10px 16px;font-size:0.8rem}.feedback-text.svelte-1kwb6bh{display:none}.modal-content.svelte-1kwb6bh{margin:10px;max-height:95vh}.modal-header.svelte-1kwb6bh,.modal-body.svelte-1kwb6bh{padding:16px}.modal-title.svelte-1kwb6bh{font-size:1.3rem}}@media(prefers-contrast: high){.modal-overlay.svelte-1kwb6bh{background:rgba(0, 0, 0, 0.8)}.modal-content.svelte-1kwb6bh{border:2px solid var(--czech-forest)}}@media(prefers-reduced-motion: reduce){.modal-overlay.svelte-1kwb6bh,.modal-content.svelte-1kwb6bh,.feedback-trigger.svelte-1kwb6bh,.star.svelte-1kwb6bh,.submit-button.svelte-1kwb6bh{animation:none;transition:none}}",
  map: null
};
const FeedbackModal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let language = "czech";
  currentLanguage$1.subscribe((value) => {
    language = value;
  });
  const content = {
    czech: {
      triggerText: "Zpětná vazba",
      triggerTitle: "Sdělte nám svůj názor",
      triggerLabel: "Otevřít formulář zpětné vazby",
      modalTitle: "Vaše zpětná vazba",
      modalSubtitle: "Pomozte nám vylepšit Akcelerátor altruismu. Vaše zpětná vazba je anonymní a velmi cenná.",
      feedbackLabel: "Co si myslíte o Akcelerátoru altruismu?",
      feedbackPlaceholder: "Sdělte nám svůj názor, návrhy na zlepšení, nebo jak vám aplikace pomohla...",
      emotionLabel: "Jak se právě cítíte?",
      ratingLabel: "Jak hodnotíte užitečnost aplikace?",
      optional: "(volitelné)",
      submitButton: "Odeslat zpětnou vazbu",
      submitting: "Odesílám...",
      closeLabel: "Zavřít",
      closeTitle: "Zavřít (Esc)",
      successMessage: "Děkujeme za váš podnět! Vaše zpětná vazba je pro nás velmi cenná.",
      errorMessage: "Nepodařilo se odeslat zpětnou vazbu. Zkuste to prosím později.",
      emotions: [
        { value: "", label: "Nejmenované" },
        { value: "grateful", label: "Vděčný/á" },
        { value: "hopeful", label: "Plný/á naděje" },
        {
          value: "inspired",
          label: "Inspirovaný/á"
        },
        { value: "neutral", label: "Neutrální" },
        { value: "confused", label: "Zmatený/á" },
        {
          value: "overwhelmed",
          label: "Přetížený/á"
        }
      ],
      ratings: {
        1: "Nepomohlo",
        2: "Trochu pomohlo",
        3: "Pomohlo",
        4: "Hodně pomohlo",
        5: "Úplně změnilo můj pohled"
      }
    },
    english: {
      triggerText: "Feedback",
      triggerTitle: "Share your thoughts",
      triggerLabel: "Open feedback form",
      modalTitle: "Your Feedback",
      modalSubtitle: "Help us improve Altruism Accelerator. Your feedback is anonymous and very valuable.",
      feedbackLabel: "What do you think about the Altruism Accelerator?",
      feedbackPlaceholder: "Share your thoughts, suggestions for improvement, or how the app helped you...",
      emotionLabel: "How are you feeling right now?",
      ratingLabel: "How do you rate the usefulness of the app?",
      optional: "(optional)",
      submitButton: "Send feedback",
      submitting: "Sending...",
      closeLabel: "Close",
      closeTitle: "Close (Esc)",
      successMessage: "Thank you for your feedback! Your input is very valuable to us.",
      errorMessage: "Failed to send feedback. Please try again later.",
      emotions: [
        { value: "", label: "Unspecified" },
        { value: "grateful", label: "Grateful" },
        { value: "hopeful", label: "Hopeful" },
        { value: "inspired", label: "Inspired" },
        { value: "neutral", label: "Neutral" },
        { value: "confused", label: "Confused" },
        {
          value: "overwhelmed",
          label: "Overwhelmed"
        }
      ],
      ratings: {
        1: "Did not help",
        2: "Helped a little",
        3: "Helped",
        4: "Helped a lot",
        5: "Completely changed my perspective"
      }
    }
  };
  $$result.css.add(css$2);
  return `  <button class="feedback-trigger svelte-1kwb6bh"${add_attribute("aria-label", content[language].triggerLabel, 0)}${add_attribute("title", content[language].triggerTitle, 0)}><span class="feedback-icon svelte-1kwb6bh" data-svelte-h="svelte-1gjelm3">💬</span> <span class="feedback-text svelte-1kwb6bh">${escape(content[language].triggerText)}</span></button>  ${``}`;
});
const LanguageToggle_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".language-toggle.svelte-1jnozdz.svelte-1jnozdz{position:relative;z-index:1000}.toggle-button.svelte-1jnozdz.svelte-1jnozdz{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255, 255, 255, 0.95);border:1px solid var(--subtle-border);border-radius:8px;cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);font-size:0.9rem;font-weight:500;color:var(--text-primary);backdrop-filter:blur(8px);box-shadow:0 2px 8px rgba(0, 0, 0, 0.1)}.toggle-button.svelte-1jnozdz.svelte-1jnozdz:hover{background:rgba(255, 255, 255, 1);border-color:var(--czech-forest-light);transform:translateY(-1px);box-shadow:0 4px 12px rgba(0, 0, 0, 0.15)}.toggle-button.svelte-1jnozdz.svelte-1jnozdz:focus{outline:2px solid var(--copper-detail);outline-offset:2px}.current-language.svelte-1jnozdz.svelte-1jnozdz{display:flex;align-items:center;gap:6px}.flag.svelte-1jnozdz.svelte-1jnozdz{font-size:1.1rem}.code.svelte-1jnozdz.svelte-1jnozdz{font-weight:600;color:var(--czech-forest)}.dropdown-arrow.svelte-1jnozdz.svelte-1jnozdz{display:flex;align-items:center;transition:transform var(--timing-medium) var(--ease-gentle);color:var(--text-secondary)}.dropdown-arrow.rotated.svelte-1jnozdz.svelte-1jnozdz{transform:rotate(180deg)}.dropdown-menu.svelte-1jnozdz.svelte-1jnozdz{position:absolute;top:100%;right:0;margin-top:4px;background:white;border:1px solid var(--subtle-border);border-radius:8px;box-shadow:0 8px 24px rgba(0, 0, 0, 0.15);overflow:hidden;min-width:160px;backdrop-filter:blur(8px);animation:svelte-1jnozdz-dropdownAppear 0.2s ease-out}@keyframes svelte-1jnozdz-dropdownAppear{from{opacity:0;transform:translateY(-8px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}.dropdown-option.svelte-1jnozdz.svelte-1jnozdz{display:flex;align-items:center;gap:10px;width:100%;padding:12px 16px;background:none;border:none;text-align:left;cursor:pointer;transition:background-color var(--timing-quick) var(--ease-gentle);color:var(--text-primary);font-size:0.9rem}.dropdown-option.svelte-1jnozdz.svelte-1jnozdz:hover{background-color:var(--bg-accent)}.dropdown-option.svelte-1jnozdz.svelte-1jnozdz:focus{background-color:var(--bg-accent);outline:none}.dropdown-option.active.svelte-1jnozdz.svelte-1jnozdz{background-color:var(--bg-accent);color:var(--czech-forest);font-weight:500}.dropdown-option.svelte-1jnozdz .name.svelte-1jnozdz{flex:1}.checkmark.svelte-1jnozdz.svelte-1jnozdz{color:var(--czech-forest);font-weight:bold}@media(max-width: 768px){.toggle-button.svelte-1jnozdz.svelte-1jnozdz{padding:6px 10px;font-size:0.8rem}.dropdown-menu.svelte-1jnozdz.svelte-1jnozdz{min-width:140px}.dropdown-option.svelte-1jnozdz.svelte-1jnozdz{padding:10px 12px;font-size:0.85rem}}@media(prefers-contrast: high){.toggle-button.svelte-1jnozdz.svelte-1jnozdz{border-width:2px}.dropdown-menu.svelte-1jnozdz.svelte-1jnozdz{border-width:2px}}@media(prefers-reduced-motion: reduce){.toggle-button.svelte-1jnozdz.svelte-1jnozdz,.dropdown-arrow.svelte-1jnozdz.svelte-1jnozdz,.dropdown-option.svelte-1jnozdz.svelte-1jnozdz{transition:none}.dropdown-menu.svelte-1jnozdz.svelte-1jnozdz{animation:none}}",
  map: null
};
const LanguageToggle = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let language = "czech";
  let isOpen = false;
  currentLanguage$1.subscribe((value) => {
    language = value;
  });
  const languages = {
    czech: {
      code: "cs",
      flag: "🇨🇿",
      name: "Čeština",
      shortName: "CZ",
      nativeName: "Čeština"
    },
    english: {
      code: "en",
      flag: "🇺🇸",
      name: "English",
      shortName: "EN",
      nativeName: "English"
    }
  };
  function handleClickOutside(event) {
    if (!event.target.closest(".language-toggle")) {
      isOpen = false;
    }
  }
  if (typeof document !== "undefined") {
    document.addEventListener("click", handleClickOutside);
  }
  $$result.css.add(css$1);
  return `<div class="${["language-toggle svelte-1jnozdz", isOpen ? "open" : ""].join(" ").trim()}"><button class="toggle-button svelte-1jnozdz" aria-label="Vyberte jazyk / Select language"${add_attribute("aria-expanded", isOpen, 0)} aria-haspopup="listbox"><span class="current-language svelte-1jnozdz"><span class="flag svelte-1jnozdz">${escape(languages[language].flag)}</span> <span class="code svelte-1jnozdz">${escape(languages[language].shortName)}</span></span> <span class="${["dropdown-arrow svelte-1jnozdz", isOpen ? "rotated" : ""].join(" ").trim()}" data-svelte-h="svelte-1qedb0v"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4.5l3 3 3-3"></path></svg></span></button> ${isOpen ? `<div class="dropdown-menu svelte-1jnozdz" role="listbox">${each(Object.entries(languages), ([key, lang]) => {
    return `<button class="${["dropdown-option svelte-1jnozdz", language === key ? "active" : ""].join(" ").trim()}" role="option"${add_attribute("aria-selected", language === key, 0)}><span class="flag svelte-1jnozdz">${escape(lang.flag)}</span> <span class="name svelte-1jnozdz">${escape(lang.name)}</span> ${language === key ? `<span class="checkmark svelte-1jnozdz" data-svelte-h="svelte-594623">✓</span>` : ``} </button>`;
  })}</div>` : ``} </div>`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".czech-nav.svelte-14g5uj3{position:fixed;top:0;left:0;right:0;background:rgba(245, 241, 232, 0.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--subtle-border);z-index:100;transition:all var(--timing-medium) var(--ease-gentle)}.nav-container.svelte-14g5uj3{max-width:1200px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:70px}.nav-logo.svelte-14g5uj3{display:flex;align-items:center;gap:0.75rem;text-decoration:none;color:var(--czech-forest);font-weight:600;font-size:1.1rem}.logo-icon.svelte-14g5uj3{font-size:1.5rem}.nav-links.svelte-14g5uj3{display:flex;align-items:center;gap:2rem}.nav-link.svelte-14g5uj3{text-decoration:none;color:var(--text-secondary);font-weight:500;transition:color var(--timing-medium) var(--ease-gentle);position:relative}.nav-link.svelte-14g5uj3:hover,.nav-link.svelte-14g5uj3:focus{color:var(--czech-forest)}.nav-link.svelte-14g5uj3::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--copper-detail);transition:width var(--timing-medium) var(--ease-gentle)}.nav-link.svelte-14g5uj3:hover::after{width:100%}.nav-actions.svelte-14g5uj3{display:flex;align-items:center;gap:1rem}.nav-cta.svelte-14g5uj3{background:var(--czech-forest);color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.5rem;transition:all var(--timing-medium) var(--ease-gentle)}.nav-cta.svelte-14g5uj3:hover{background:var(--czech-forest-dark);transform:translateY(-1px)}.landing-page.svelte-14g5uj3{padding-top:70px}.story-section.svelte-14g5uj3{padding:5rem 0}.story-content.svelte-14g5uj3{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.story-paragraphs.svelte-14g5uj3{margin-bottom:2rem}.story-stats.svelte-14g5uj3{display:flex;gap:2rem}.stat-item.svelte-14g5uj3{text-align:center}.stat-number.svelte-14g5uj3{font-size:2.5rem;font-weight:700;color:var(--czech-forest);line-height:1;margin-bottom:0.5rem}.stat-label.svelte-14g5uj3{font-size:0.9rem;color:var(--text-secondary);font-weight:500}.visual-elements.svelte-14g5uj3{display:flex;flex-direction:column;gap:2rem}.element.svelte-14g5uj3{display:flex;align-items:center;gap:1rem;padding:1.5rem;background:var(--bg-accent);border:1px solid var(--subtle-border);border-radius:12px;transition:all var(--timing-medium) var(--ease-gentle)}.element.svelte-14g5uj3:hover{transform:translateX(8px);box-shadow:0 8px 24px rgba(46, 93, 49, 0.1)}.element-icon.svelte-14g5uj3{font-size:2rem;flex-shrink:0}.element-text.svelte-14g5uj3{font-weight:500;color:var(--czech-forest);margin:0}@media(max-width: 768px){.nav-container.svelte-14g5uj3{padding:0 1rem;height:60px}.nav-links.svelte-14g5uj3{display:none}.nav-actions.svelte-14g5uj3{gap:0.5rem}.landing-page.svelte-14g5uj3{padding-top:60px}.story-content.svelte-14g5uj3{grid-template-columns:1fr;gap:2rem}.story-stats.svelte-14g5uj3{justify-content:center}.visual-elements.svelte-14g5uj3{order:-1}.element.svelte-14g5uj3{flex-direction:column;text-align:center;padding:1rem}}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let language = "czech";
  currentLanguage$1.subscribe((value) => {
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
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  $$result.css.add(css);
  return ` <nav class="czech-nav svelte-14g5uj3"><div class="nav-container svelte-14g5uj3"> <div class="nav-logo svelte-14g5uj3"><div class="logo-icon svelte-14g5uj3" data-svelte-h="svelte-a96uxz">🤝</div> <span class="logo-text">${escape(language === "czech" ? "Akcelerátor altruismu" : "Altruism Accelerator")}</span></div>  <div class="nav-links svelte-14g5uj3"><a href="#hero" class="nav-link svelte-14g5uj3" data-section="hero">${escape(content[language].nav.home)}</a> <a href="#solidarity-garden" class="nav-link svelte-14g5uj3" data-section="solidarity-garden">${escape(content[language].sections.garden)}</a> <a href="#czech-map" class="nav-link svelte-14g5uj3" data-section="czech-map">${escape(content[language].sections.map)}</a></div>  <div class="nav-actions svelte-14g5uj3"> ${validate_component(LanguageToggle, "LanguageToggle").$$render($$result, {}, {}, {})} <button class="nav-cta svelte-14g5uj3">${escape(content[language].nav.launch)} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button></div></div></nav>  <main class="landing-page svelte-14g5uj3"> ${validate_component(Hero, "Hero").$$render($$result, {}, {}, {})}  <section id="story" class="story-section czech-section svelte-14g5uj3"><div class="czech-container"><div class="story-content svelte-14g5uj3"><div class="story-text"><h2 class="czech-heading-lg mb-6">${escape(language === "czech" ? "Od empatie k akci – česky a prakticky" : "From empathy to action – Czech and practical")}</h2> ${language === "czech" ? `<div class="story-paragraphs svelte-14g5uj3" data-svelte-h="svelte-np8txc"><p class="czech-body-large mb-4">Václav Havel říkal: &quot;Naděje není přesvědčení, že se něco povede, 
                ale jistota, že má smysl, bez ohledu na to, jak to dopadne.&quot;</p> <p class="czech-body mb-4">Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. 
                Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.</p> <p class="czech-body mb-6">Od pomoci sousedům po podporu ukrajinských rodin, od doučování dětí 
                po péči o seniory – každá akce je propojená s důvěryhodnými 
                českými organizacemi.</p></div>` : `<div class="story-paragraphs svelte-14g5uj3" data-svelte-h="svelte-1p4o3qu"><p class="czech-body-large mb-4">Václav Havel said: &quot;Hope is not the conviction that something will turn out well, 
                but the certainty that something makes sense, regardless of how it turns out.&quot;</p> <p class="czech-body mb-4">This platform was born from understanding that Czechs don&#39;t want grand gestures 
                and empty words. We want <strong>practical steps</strong> that truly help.</p> <p class="czech-body mb-6">From helping neighbors to supporting Ukrainian families, from tutoring children 
                to caring for seniors – every action is connected with trustworthy 
                Czech organizations.</p></div>`} <div class="story-stats svelte-14g5uj3"><div class="stat-item svelte-14g5uj3"><div class="stat-number svelte-14g5uj3" data-svelte-h="svelte-nzwmfo">247</div> <div class="stat-label svelte-14g5uj3">${escape(language === "czech" ? "akcí tento týden" : "actions this week")}</div></div> <div class="stat-item svelte-14g5uj3"><div class="stat-number svelte-14g5uj3" data-svelte-h="svelte-g4bb93">1,834</div> <div class="stat-label svelte-14g5uj3">${escape(language === "czech" ? "aktivních lidí" : "active helpers")}</div></div> <div class="stat-item svelte-14g5uj3"><div class="stat-number svelte-14g5uj3" data-svelte-h="svelte-put88">12</div> <div class="stat-label svelte-14g5uj3">${escape(language === "czech" ? "regionů" : "regions")}</div></div></div></div> <div class="story-visual"><div class="visual-elements svelte-14g5uj3"><div class="element element-1 svelte-14g5uj3"><div class="element-icon svelte-14g5uj3" data-svelte-h="svelte-1uxqtms">🤝</div> <p class="element-text svelte-14g5uj3">${escape(language === "czech" ? "Soused pomáhá sousedovi" : "Neighbor helps neighbor")}</p></div> <div class="element element-2 svelte-14g5uj3"><div class="element-icon svelte-14g5uj3" data-svelte-h="svelte-x26xhe">🌱</div> <p class="element-text svelte-14g5uj3">${escape(language === "czech" ? "Malé kroky, velký dopad" : "Small steps, big impact")}</p></div> <div class="element element-3 svelte-14g5uj3"><div class="element-icon svelte-14g5uj3" data-svelte-h="svelte-1o2krzy">💚</div> <p class="element-text svelte-14g5uj3">${escape(language === "czech" ? "Praktická solidarita" : "Practical solidarity")}</p></div></div></div></div></div></section>  ${validate_component(SolidarityGarden, "SolidarityGarden").$$render($$result, {}, {}, {})}  ${validate_component(CzechMap, "CzechMap").$$render($$result, {}, {}, {})}  ${validate_component(CTASection, "CTASection").$$render($$result, {}, {}, {})}  ${validate_component(ImmediateHelp, "ImmediateHelp").$$render($$result, {}, {}, {})}  ${validate_component(FeedbackModal, "FeedbackModal").$$render($$result, {}, {}, {})} </main>`;
});
export {
  Page as default
};
