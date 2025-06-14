import { c as create_ssr_component, a as add_attribute, e as escape, b as createEventDispatcher, o as onDestroy, v as validate_component, d as each } from "../../chunks/ssr.js";
import { c as currentLanguage$3 } from "../../chunks/animations.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { createClient } from "@supabase/supabase-js";
const Hero_svelte_svelte_type_style_lang = "";
const css$7 = {
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
  $$result.css.add(css$7);
  return `<section class="parallax-container czech-flex-center"${add_attribute("this", heroContainer, 0)}> <div class="parallax-forest"${add_attribute("this", parallaxForest, 0)}></div>  <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 20%; left: 10%; width: 4px; height: 4px; background: var(--czech-forest-light); border-radius: 50%; opacity: 0.6;"></div> <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 30%; right: 15%; width: 3px; height: 3px; background: var(--copper-detail); border-radius: 50%; opacity: 0.4;"></div> <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 60%; left: 20%; width: 5px; height: 5px; background: var(--moravian-earth); border-radius: 50%; opacity: 0.5;"></div> <div class="floating-particle svelte-1hl5d6t" style="position: absolute; top: 40%; right: 25%; width: 3px; height: 3px; background: var(--czech-forest); border-radius: 50%; opacity: 0.7;"></div>  <div class="absolute top-4 right-4 z-10"${add_attribute("this", languageSelector, 0)}><button class="${"language-flag " + escape("active", true) + " svelte-1hl5d6t"}" title="Čeština">🇨🇿</button> <button class="${"language-flag " + escape("", true) + " svelte-1hl5d6t"}" title="English">🇺🇸</button></div>  <div class="czech-container czech-text-center relative z-10"><h1 class="czech-heading-xl mb-6"${add_attribute("this", mainHeading, 0)}>${escape(content[currentLanguage2].heading)}</h1> <p class="czech-body-large mb-4 max-w-2xl mx-auto"${add_attribute("this", subHeading, 0)}>${escape(content[currentLanguage2].subheading)}</p> <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">${escape(content[currentLanguage2].description)}</p>  <div class="flex gap-4 justify-center flex-wrap svelte-1hl5d6t"${add_attribute("this", ctaButtons, 0)}><button class="czech-button-primary"><span>${escape(content[currentLanguage2].ctaPrimary)}</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button> <button class="czech-button-secondary">${escape(content[currentLanguage2].ctaSecondary)}</button></div>  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 czech-text-center"><p class="czech-body text-sm opacity-60 mb-2">${escape(content[currentLanguage2].scrollText)}</p> <div class="scroll-indicator svelte-1hl5d6t" data-svelte-h="svelte-j9xrzi"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--czech-forest)" stroke-width="2"><path d="M7 13l3 3 7-7M7 6l3 3 7-7"></path></svg></div></div></div> </section>`;
});
const StoryModal_svelte_svelte_type_style_lang = "";
const css$6 = {
  code: ".modal-overlay.svelte-1a2i4ly.svelte-1a2i4ly{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0, 0, 0, 0.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;backdrop-filter:blur(4px);animation:svelte-1a2i4ly-fadeIn 0.3s ease-out}@keyframes svelte-1a2i4ly-fadeIn{from{opacity:0}to{opacity:1}}.modal-content.svelte-1a2i4ly.svelte-1a2i4ly{background:white;border-radius:20px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0, 0, 0, 0.3);animation:svelte-1a2i4ly-slideIn 0.3s ease-out;position:relative}@keyframes svelte-1a2i4ly-slideIn{from{opacity:0;transform:translateY(-20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}.modal-header.svelte-1a2i4ly.svelte-1a2i4ly{display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0;position:relative}.story-icon.svelte-1a2i4ly.svelte-1a2i4ly{font-size:3rem;text-align:center;background:var(--bg-accent);border-radius:50%;width:80px;height:80px;display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 4px 12px rgba(46, 93, 49, 0.2)}.modal-close.svelte-1a2i4ly.svelte-1a2i4ly{position:absolute;top:0;right:0;background:none;border:none;font-size:1.5rem;color:var(--text-secondary);cursor:pointer;padding:8px;border-radius:50%;transition:all var(--timing-quick) var(--ease-gentle);width:40px;height:40px;display:flex;align-items:center;justify-content:center}.modal-close.svelte-1a2i4ly.svelte-1a2i4ly:hover{background:var(--bg-accent);color:var(--czech-forest);transform:scale(1.1)}.modal-body.svelte-1a2i4ly.svelte-1a2i4ly{padding:24px;text-align:center}.story-title.svelte-1a2i4ly.svelte-1a2i4ly{font-size:1.8rem;color:var(--czech-forest);margin:16px 0 8px;font-weight:600}.story-location.svelte-1a2i4ly.svelte-1a2i4ly{color:var(--text-secondary);font-size:0.9rem;margin-bottom:24px;padding:8px 16px;background:var(--bg-accent);border-radius:20px;display:inline-block}.story-action.svelte-1a2i4ly.svelte-1a2i4ly,.story-impact.svelte-1a2i4ly.svelte-1a2i4ly{margin-bottom:20px;text-align:left;background:var(--bg-accent);padding:16px;border-radius:12px;border:1px solid var(--subtle-border)}.story-action.svelte-1a2i4ly h3.svelte-1a2i4ly,.story-impact.svelte-1a2i4ly h3.svelte-1a2i4ly{color:var(--czech-forest);font-size:1rem;margin:0 0 8px 0;font-weight:600}.story-action.svelte-1a2i4ly p.svelte-1a2i4ly,.story-impact.svelte-1a2i4ly p.svelte-1a2i4ly{margin:0;color:var(--text-primary);line-height:1.5}.impact-text.svelte-1a2i4ly.svelte-1a2i4ly{font-weight:500;color:var(--czech-forest) !important}.story-inspiration.svelte-1a2i4ly.svelte-1a2i4ly{background:linear-gradient(135deg, var(--bg-accent) 0%, rgba(255, 255, 255, 0.8) 100%);padding:16px;border-radius:12px;margin:20px 0;border:2px solid var(--copper-detail)}.inspiration-text.svelte-1a2i4ly.svelte-1a2i4ly{margin:0;color:var(--czech-forest);font-size:1rem;line-height:1.5}.modal-actions.svelte-1a2i4ly.svelte-1a2i4ly{margin-top:24px}.primary-button.svelte-1a2i4ly.svelte-1a2i4ly{background:linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);color:#fff;border:none;padding:12px 24px;border-radius:25px;font-weight:600;font-size:1rem;cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);box-shadow:0 4px 12px rgba(46, 93, 49, 0.3);min-width:200px}.primary-button.svelte-1a2i4ly.svelte-1a2i4ly:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(46, 93, 49, 0.4);background:linear-gradient(135deg, var(--czech-forest-light) 0%, var(--czech-forest) 100%)}@media(max-width: 768px){.modal-content.svelte-1a2i4ly.svelte-1a2i4ly{margin:10px;max-height:95vh;border-radius:16px}.modal-header.svelte-1a2i4ly.svelte-1a2i4ly,.modal-body.svelte-1a2i4ly.svelte-1a2i4ly{padding:16px}.story-title.svelte-1a2i4ly.svelte-1a2i4ly{font-size:1.5rem}.story-icon.svelte-1a2i4ly.svelte-1a2i4ly{width:60px;height:60px;font-size:2.5rem}.primary-button.svelte-1a2i4ly.svelte-1a2i4ly{width:100%;min-width:auto}}@media(prefers-contrast: high){.modal-overlay.svelte-1a2i4ly.svelte-1a2i4ly{background:rgba(0, 0, 0, 0.8)}.modal-content.svelte-1a2i4ly.svelte-1a2i4ly{border:2px solid var(--czech-forest)}}@media(prefers-reduced-motion: reduce){.modal-overlay.svelte-1a2i4ly.svelte-1a2i4ly,.modal-content.svelte-1a2i4ly.svelte-1a2i4ly,.modal-close.svelte-1a2i4ly.svelte-1a2i4ly,.primary-button.svelte-1a2i4ly.svelte-1a2i4ly{animation:none;transition:none}}",
  map: null
};
const StoryModal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const dispatch = createEventDispatcher();
  let { isOpen = false } = $$props;
  let { story = null } = $$props;
  let modalElement;
  let previouslyFocused;
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
    document.removeEventListener("keydown", handleKeydown);
    document.body.style.overflow = "";
  });
  if ($$props.isOpen === void 0 && $$bindings.isOpen && isOpen !== void 0)
    $$bindings.isOpen(isOpen);
  if ($$props.story === void 0 && $$bindings.story && story !== void 0)
    $$bindings.story(story);
  $$result.css.add(css$6);
  {
    if (isOpen && modalElement) {
      previouslyFocused = document.activeElement;
      modalElement.focus();
    }
  }
  {
    if (isOpen) {
      document.addEventListener("keydown", handleKeydown);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
    }
  }
  return ` ${isOpen && story ? `<div class="modal-overlay svelte-1a2i4ly" role="dialog" aria-modal="true" aria-labelledby="story-title" tabindex="-1"${add_attribute("this", modalElement, 0)}><div class="modal-content svelte-1a2i4ly" role="document"> <div class="modal-header svelte-1a2i4ly"><div class="story-icon svelte-1a2i4ly">${escape(story.icon)}</div> <button class="modal-close svelte-1a2i4ly" aria-label="Zavřít příběh" type="button" data-svelte-h="svelte-1t6rk7d">✕</button></div>  <div class="modal-body svelte-1a2i4ly"><h2 id="story-title" class="story-title svelte-1a2i4ly">${escape(story.name)}</h2> <div class="story-location svelte-1a2i4ly">📍 ${escape(story.location)}</div> <div class="story-action svelte-1a2i4ly"><h3 class="svelte-1a2i4ly" data-svelte-h="svelte-jlw5cp">Co udělal/a:</h3> <p class="svelte-1a2i4ly">${escape(story.action)}</p></div> <div class="story-impact svelte-1a2i4ly"><h3 class="svelte-1a2i4ly" data-svelte-h="svelte-fhmlmx">Jaký to mělo dopad:</h3> <p class="impact-text svelte-1a2i4ly">${escape(story.impact)}</p></div> <div class="story-inspiration svelte-1a2i4ly" data-svelte-h="svelte-1yikskz"><p class="inspiration-text svelte-1a2i4ly">✨ <strong>I ty můžeš udělat rozdíl!</strong> Každá malá akce má svůj význam.</p></div> <div class="modal-actions svelte-1a2i4ly"><button class="primary-button svelte-1a2i4ly" data-svelte-h="svelte-oc7u2u">Inspiruj mě k akci! 🌱</button></div></div></div></div>` : ``}`;
});
const SolidarityGarden_svelte_svelte_type_style_lang = "";
const css$5 = {
  code: ".garden-wrapper.svelte-1tmqal5.svelte-1tmqal5{position:relative;max-width:900px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(46, 93, 49, 0.15);background:var(--warm-stone);transition:all 0.6s ease}.garden-wrapper.spring.svelte-1tmqal5.svelte-1tmqal5{background:linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%)}.garden-wrapper.summer.svelte-1tmqal5.svelte-1tmqal5{background:linear-gradient(135deg, #fff9e6 0%, #f5f0e8 100%)}.garden-wrapper.autumn.svelte-1tmqal5.svelte-1tmqal5{background:linear-gradient(135deg, #faf5f0 0%, #f0e6d6 100%)}.garden-wrapper.winter.svelte-1tmqal5.svelte-1tmqal5{background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)}.seasonal-header.svelte-1tmqal5.svelte-1tmqal5{text-align:center;padding:1.5rem 2rem 0;background:rgba(255, 255, 255, 0.7);backdrop-filter:blur(10px)}.season-indicator.svelte-1tmqal5.svelte-1tmqal5{font-size:1.1rem;color:var(--czech-forest);font-weight:500;padding:0.5rem 1rem;background:var(--bg-accent);border-radius:20px;border:1px solid var(--subtle-border)}.garden-canvas.svelte-1tmqal5.svelte-1tmqal5{position:relative;min-height:400px;padding:2rem;overflow:hidden}.garden-background.svelte-1tmqal5.svelte-1tmqal5{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1}.hills.svelte-1tmqal5.svelte-1tmqal5{position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg, transparent 0%, var(--bohemian-mist) 100%);border-radius:50% 50% 0 0}.sky.svelte-1tmqal5.svelte-1tmqal5{position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg, rgba(173, 216, 230, 0.3) 0%, transparent 100%)}.garden-floor.svelte-1tmqal5.svelte-1tmqal5{position:relative;z-index:2;display:grid;grid-template-columns:repeat(auto-fit, minmax(80px, 1fr));gap:1.5rem;align-items:end;padding:1rem 0;min-height:200px}.garden-element.svelte-1tmqal5.svelte-1tmqal5{font-size:2.5rem;text-align:center;cursor:pointer;transition:all 0.3s ease;filter:drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));transform-origin:bottom center;position:relative}.garden-element.svelte-1tmqal5.svelte-1tmqal5:hover{transform:scale(1.2) translateY(-5px);filter:drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))}.story-trigger.svelte-1tmqal5.svelte-1tmqal5{position:relative;outline:none}.story-trigger.svelte-1tmqal5.svelte-1tmqal5:focus{outline:2px solid var(--czech-forest);outline-offset:4px}.story-trigger.svelte-1tmqal5.svelte-1tmqal5::after{content:'✨';position:absolute;top:-10px;right:-10px;font-size:1rem;opacity:0;animation:svelte-1tmqal5-sparkle-hint 2s ease-in-out infinite}.story-trigger.svelte-1tmqal5.svelte-1tmqal5:hover::after{opacity:1;animation:svelte-1tmqal5-sparkle-pulse 0.5s ease-in-out infinite}@keyframes svelte-1tmqal5-sparkle-hint{0%,80%,100%{opacity:0}40%{opacity:0.6}}@keyframes svelte-1tmqal5-sparkle-pulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.2);opacity:1}}.tree.svelte-1tmqal5.svelte-1tmqal5{font-size:3rem;grid-row:span 2}.flower.svelte-1tmqal5.svelte-1tmqal5{font-size:2rem;animation:svelte-1tmqal5-gentle-sway 3s ease-in-out infinite}.sprout.svelte-1tmqal5.svelte-1tmqal5{font-size:1.8rem;opacity:0.8}@keyframes svelte-1tmqal5-gentle-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}.garden-controls.svelte-1tmqal5.svelte-1tmqal5{position:relative;z-index:3;display:flex;gap:1rem;justify-content:center;margin:2rem 0;flex-wrap:wrap}.garden-controls.svelte-1tmqal5 button.svelte-1tmqal5{font-size:0.9rem;padding:0.75rem 1.25rem;border-radius:25px;transition:all 0.3s ease}.garden-controls.svelte-1tmqal5 button.svelte-1tmqal5:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(46, 93, 49, 0.3)}.community-garden-stats.svelte-1tmqal5.svelte-1tmqal5{display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:1.5rem;padding:2rem;background:rgba(255, 255, 255, 0.6);backdrop-filter:blur(10px);border-radius:16px 16px 0 0;margin-top:2rem}.stat-plant.svelte-1tmqal5.svelte-1tmqal5{text-align:center;padding:1rem;background:var(--bg-accent);border-radius:12px;border:1px solid var(--subtle-border);transition:all 0.3s ease}.stat-plant.svelte-1tmqal5.svelte-1tmqal5:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(46, 93, 49, 0.15)}.plant-icon.svelte-1tmqal5.svelte-1tmqal5{font-size:2rem;margin-bottom:0.5rem}.stat-number.svelte-1tmqal5.svelte-1tmqal5{font-size:1.8rem;font-weight:600;color:var(--czech-forest);line-height:1;margin-bottom:0.25rem}.stat-label.svelte-1tmqal5.svelte-1tmqal5{font-size:0.85rem;color:var(--text-secondary);font-weight:500}.enhanced-quote.svelte-1tmqal5.svelte-1tmqal5{background:linear-gradient(135deg, var(--bg-accent) 0%, rgba(255, 255, 255, 0.8) 100%);border:none;border-radius:16px;padding:2rem;margin:0;backdrop-filter:blur(10px);display:flex;align-items:center;gap:1rem}.quote-decoration.svelte-1tmqal5.svelte-1tmqal5{font-size:1.5rem;opacity:0.6;color:var(--czech-forest)}@keyframes svelte-1tmqal5-sparkle-fade{0%{opacity:1;transform:scale(0) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(180deg)}100%{opacity:0;transform:scale(0) rotate(360deg)}}@media(max-width: 768px){.garden-canvas.svelte-1tmqal5.svelte-1tmqal5{padding:1.5rem 1rem;min-height:300px}.garden-floor.svelte-1tmqal5.svelte-1tmqal5{grid-template-columns:repeat(3, 1fr);gap:1rem}.garden-element.svelte-1tmqal5.svelte-1tmqal5{font-size:2rem}.tree.svelte-1tmqal5.svelte-1tmqal5{font-size:2.5rem}.garden-controls.svelte-1tmqal5.svelte-1tmqal5{flex-direction:column;align-items:center}.garden-controls.svelte-1tmqal5 button.svelte-1tmqal5{width:200px}.community-garden-stats.svelte-1tmqal5.svelte-1tmqal5{grid-template-columns:1fr;gap:1rem;padding:1.5rem}.enhanced-quote.svelte-1tmqal5.svelte-1tmqal5{flex-direction:column;text-align:center;padding:1.5rem}}@media(max-width: 900px){.garden-wrapper.svelte-1tmqal5.svelte-1tmqal5{max-width:100%;border-radius:16px}}",
  map: null
};
let currentLanguage$2 = "czech";
function getCurrentSeason() {
  const month = (/* @__PURE__ */ new Date()).getMonth();
  if (month >= 2 && month <= 4)
    return "spring";
  if (month >= 5 && month <= 7)
    return "summer";
  if (month >= 8 && month <= 10)
    return "autumn";
  return "winter";
}
const SolidarityGarden = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  gsap.registerPlugin(ScrollTrigger);
  let gardenContainer;
  let totalCommunityActions = 247;
  let plantedSeeds = 0;
  let communityFlowers = 0;
  let isStoryModalOpen = false;
  let currentStory = null;
  const currentSeason = getCurrentSeason();
  const content = {
    czech: {
      title: "Zahrada solidarity",
      subtitle: "Interaktivní vizualizace naší společné pomoci",
      description: "Každá vaše akce zde zaseje semínko naděje. Kliknutím na rostliny objevíte skutečné příběhy české solidarity a laskavosti.",
      counter: "lidí pomohlo tento týden",
      plantSeed: "Zasadit semínko",
      waterPlant: "Zalít rostlinu",
      watchGrow: "Sledovat růst",
      seasonInfo: {
        spring: "🌸 Jarní obnova - čas nových začátků",
        summer: "☀️ Letní energie - čas akcí",
        autumn: "🍂 Podzimní sklizeň - čas díkůvzdání",
        winter: "❄️ Zimní péče - čas solidarity"
      }
    },
    english: {
      title: "Solidarity Garden",
      subtitle: "Interactive visualization of our collective help",
      description: "Every action you take plants a seed of hope here. Click on garden elements to watch our community grow.",
      counter: "people helped this week",
      plantSeed: "Plant a seed",
      waterPlant: "Water plant",
      watchGrow: "Watch grow",
      seasonInfo: {
        spring: "🌸 Spring renewal - time for new beginnings",
        summer: "☀️ Summer energy - time for action",
        autumn: "🍂 Autumn harvest - time for gratitude",
        winter: "❄️ Winter care - time for solidarity"
      }
    }
  };
  $$result.css.add(css$5);
  return `<section id="solidarity-garden" class="czech-section"${add_attribute("this", gardenContainer, 0)}><div class="czech-container"><div class="czech-text-center mb-12"><h2 class="czech-heading-lg mb-4">${escape(content[currentLanguage$2].title)}</h2> <p class="czech-body-large mb-6 max-w-2xl mx-auto">${escape(content[currentLanguage$2].subtitle)}</p></div>  <div class="${[
    "garden-wrapper svelte-1tmqal5",
    (currentSeason === "spring" ? "spring" : "") + " " + (currentSeason === "summer" ? "summer" : "") + " " + (currentSeason === "autumn" ? "autumn" : "") + " " + (currentSeason === "winter" ? "winter" : "")
  ].join(" ").trim()}"> <div class="seasonal-header svelte-1tmqal5"><span class="season-indicator svelte-1tmqal5">${escape(content[currentLanguage$2].seasonInfo[currentSeason])}</span></div> <div class="garden-canvas svelte-1tmqal5"> <div class="garden-background svelte-1tmqal5" data-svelte-h="svelte-1p5fyaq"><div class="hills svelte-1tmqal5"></div> <div class="sky svelte-1tmqal5"></div></div>  <div class="garden-floor svelte-1tmqal5"> <div class="garden-element tree interactive-element floating-element story-trigger svelte-1tmqal5" title="Klikněte pro inspirativní příběh" role="button" tabindex="0" data-svelte-h="svelte-1kor13r">🌳</div> <div class="garden-element tree interactive-element floating-element story-trigger svelte-1tmqal5" title="Klikněte pro inspirativní příběh" role="button" tabindex="0" data-svelte-h="svelte-vuau1s">🌲</div>  <div class="garden-element flower interactive-element floating-element seed-1 story-trigger svelte-1tmqal5" title="Klikněte pro inspirativní příběh" role="button" tabindex="0" data-svelte-h="svelte-1eftaxu">🌸</div> <div class="garden-element flower interactive-element floating-element seed-2 story-trigger svelte-1tmqal5" title="Klikněte pro inspirativní příběh" role="button" tabindex="0" data-svelte-h="svelte-1df39cf">🌺</div> <div class="garden-element flower interactive-element floating-element seed-3 story-trigger svelte-1tmqal5" title="Klikněte pro inspirativní příběh" role="button" tabindex="0" data-svelte-h="svelte-1c43y1n">🌻</div>  <div class="garden-element sprout interactive-element floating-element story-trigger svelte-1tmqal5" title="Klikněte pro inspirativní příběh" role="button" tabindex="0" data-svelte-h="svelte-1eyygy">🌱</div> <div class="garden-element sprout interactive-element floating-element story-trigger svelte-1tmqal5" title="Klikněte pro inspirativní příběh" role="button" tabindex="0" data-svelte-h="svelte-1g0n9l0">🌿</div></div>  <div class="garden-controls svelte-1tmqal5"><button class="czech-button-secondary interactive-element svelte-1tmqal5">🌱 ${escape(content[currentLanguage$2].plantSeed)}</button> <button class="czech-button-secondary interactive-element svelte-1tmqal5">💧 ${escape(content[currentLanguage$2].waterPlant)}</button></div>  <div class="community-garden-stats svelte-1tmqal5"><div class="stat-plant svelte-1tmqal5"><div class="plant-icon svelte-1tmqal5" data-svelte-h="svelte-2lxhln">🌳</div> <div class="stat-number svelte-1tmqal5">${escape(totalCommunityActions)}</div> <div class="stat-label svelte-1tmqal5">${escape(content[currentLanguage$2].counter)}</div></div> <div class="stat-plant svelte-1tmqal5"><div class="plant-icon svelte-1tmqal5" data-svelte-h="svelte-1xdyt2">🌸</div> <div class="stat-number svelte-1tmqal5">${escape(plantedSeeds + communityFlowers)}</div> <div class="stat-label svelte-1tmqal5">${escape(
    "zasazených semínek"
  )}</div></div> <div class="stat-plant svelte-1tmqal5"><div class="plant-icon svelte-1tmqal5" data-svelte-h="svelte-10dscil">💚</div> <div class="stat-number svelte-1tmqal5">${escape(Math.floor(totalCommunityActions / 10))}</div> <div class="stat-label svelte-1tmqal5">${escape(
    "aktivních komunit"
  )}</div></div></div></div>  <div class="havel-quote enhanced-quote svelte-1tmqal5"><div class="quote-decoration svelte-1tmqal5" data-svelte-h="svelte-2ak0yx">🌱</div> <p class="czech-body italic">${escape(
    '"Naděje není přesvědčení, že se něco povede, ale jistota, že má smysl." - Václav Havel'
  )}</p> <div class="quote-decoration svelte-1tmqal5" data-svelte-h="svelte-2ak0yx">🌱</div></div></div></div>  ${validate_component(StoryModal, "StoryModal").$$render(
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
const css$4 = {
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
  $$result.css.add(css$4);
  return `<section id="czech-map" class="czech-section"${add_attribute("this", mapContainer, 0)}><div class="czech-container"> <div class="czech-text-center mb-12"><h2 class="czech-heading-lg mb-4">${escape(content[currentLanguage$1].title)}</h2> <p class="czech-body-large mb-2 max-w-2xl mx-auto">${escape(content[currentLanguage$1].subtitle)}</p> <p class="czech-body opacity-70">${escape(content[currentLanguage$1].selectRegion)}</p></div>  <div class="map-container svelte-jwly34"> <div class="czech-map-svg svelte-jwly34"><svg viewBox="0 0 800 500" class="w-full h-auto"><path d="M120,200 L180,150 L250,140 L320,160 L380,150 L450,170 L520,160 L580,180 L620,220 L600,280 L550,320 L480,340 L420,350 L360,340 L300,330 L240,320 L180,300 L140,260 Z" fill="var(--bohemian-mist)" stroke="var(--czech-forest-light)" stroke-width="2" class="country-outline svelte-jwly34"></path>${each(Object.entries(regions), ([key, region]) => {
    return `<circle${add_attribute("cx", region.x, 0)}${add_attribute("cy", region.y, 0)} r="12"${add_attribute("fill", region.color, 0)} class="regional-pulse svelte-jwly34"${add_attribute("data-region", key, 0)} tabindex="0" role="button"${add_attribute("aria-label", `Select ${region.name}`, 0)}></circle>  <text${add_attribute("x", region.x, 0)}${add_attribute("y", region.y + 25, 0)} text-anchor="middle" class="region-label svelte-jwly34" fill="var(--text-primary)" font-size="14" font-weight="500">${escape(region.name)}</text>`;
  })}<g class="solidarity-network svelte-jwly34" opacity="0.3"><line x1="340" y1="180" x2="380" y2="260" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line><line x1="380" y1="260" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line><line x1="340" y1="180" x2="450" y2="200" stroke="var(--czech-forest-light)" stroke-width="1" stroke-dasharray="5,5"></line></g></svg></div>  ${`<div class="map-placeholder svelte-jwly34" data-svelte-h="svelte-9ve3ef"><div class="placeholder-content"><div class="pulse-demo svelte-jwly34"><div class="demo-pulse svelte-jwly34" style="background-color: var(--czech-forest);"></div> <div class="demo-pulse svelte-jwly34" style="background-color: var(--copper-detail); animation-delay: 0.5s;"></div> <div class="demo-pulse svelte-jwly34" style="background-color: var(--moravian-earth); animation-delay: 1s;"></div></div> <p class="czech-body opacity-70 mt-4">Klikni na kterékoli město na mapě</p></div></div>`}</div>  <div class="historical-context svelte-jwly34" data-svelte-h="svelte-1d3n03q"><div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34">🏘️</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">Tradice pomoci sousedům</h4> <p class="text-sm opacity-80">Od moravských brigád po pražské sokolstvo - Čechům pomoc není cizí</p></div></div> <div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34">🤝</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">Moderní solidarita</h4> <p class="text-sm opacity-80">Tech komunity, studentské organizace a občanské iniciativy spojují síly</p></div></div> <div class="context-card svelte-jwly34"><div class="context-icon svelte-jwly34">💪</div> <div class="context-text svelte-jwly34"><h4 class="czech-body font-semibold svelte-jwly34">Praktický přístup</h4> <p class="text-sm opacity-80">Méně řečí, více činů - český způsob dělání dobra</p></div></div></div></div> </section>`;
});
const ImmediateHelp_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".immediate-help.svelte-2u15ml.svelte-2u15ml{position:fixed;bottom:20px;right:20px;background:var(--bg-primary);border:2px solid var(--copper-detail);border-radius:16px;box-shadow:0 8px 32px rgba(46, 93, 49, 0.15);z-index:50;max-width:400px;transition:all var(--timing-medium) var(--ease-gentle);backdrop-filter:blur(8px)}.expanded.svelte-2u15ml.svelte-2u15ml{max-width:500px;max-height:80vh;overflow-y:auto}.help-header.svelte-2u15ml.svelte-2u15ml{display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;cursor:pointer;transition:all var(--timing-quick) var(--ease-gentle)}.help-header.svelte-2u15ml.svelte-2u15ml:hover{background:var(--bg-accent)}.help-icon.svelte-2u15ml.svelte-2u15ml{font-size:1.5rem;flex-shrink:0}.help-text.svelte-2u15ml.svelte-2u15ml{flex:1}.help-text.svelte-2u15ml h4.svelte-2u15ml{margin:0 0 0.25rem 0;color:var(--czech-forest);font-size:1rem;font-weight:600}.help-text.svelte-2u15ml p.svelte-2u15ml{margin:0;color:var(--text-secondary);font-size:0.9rem}.toggle-button.svelte-2u15ml.svelte-2u15ml{background:none;border:none;cursor:pointer;color:var(--czech-forest);transition:transform var(--timing-quick) var(--ease-gentle)}.chevron.svelte-2u15ml.svelte-2u15ml{transition:transform var(--timing-medium) var(--ease-gentle)}.chevron.rotated.svelte-2u15ml.svelte-2u15ml{transform:rotate(180deg)}.help-content.svelte-2u15ml.svelte-2u15ml{border-top:1px solid var(--subtle-border);padding:1.5rem}.resources-grid.svelte-2u15ml.svelte-2u15ml{display:grid;gap:1rem;margin-bottom:1.5rem}.resource-card.svelte-2u15ml.svelte-2u15ml{padding:1rem;background:var(--bg-accent);border-radius:8px;border:1px solid var(--subtle-border)}.resource-header.svelte-2u15ml.svelte-2u15ml{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem}.resource-name.svelte-2u15ml.svelte-2u15ml{color:var(--czech-forest);font-size:0.95rem}.resource-availability.svelte-2u15ml.svelte-2u15ml{font-size:0.8rem;color:var(--text-muted);text-align:right}.resource-phone.svelte-2u15ml.svelte-2u15ml{display:inline-block;color:var(--czech-forest);text-decoration:none;font-weight:600;font-size:1.1rem;margin-bottom:0.5rem;transition:color var(--timing-quick) var(--ease-gentle)}.resource-phone.svelte-2u15ml.svelte-2u15ml:hover{color:var(--copper-detail)}.resource-description.svelte-2u15ml.svelte-2u15ml{margin:0;color:var(--text-secondary);font-size:0.9rem}.emergency-note.svelte-2u15ml.svelte-2u15ml{display:flex;align-items:flex-start;gap:0.75rem;padding:1rem;background:rgba(176, 141, 87, 0.1);border-radius:8px;border-left:4px solid var(--copper-detail)}.emergency-icon.svelte-2u15ml.svelte-2u15ml{font-size:1.2rem;flex-shrink:0}.emergency-note.svelte-2u15ml p.svelte-2u15ml{margin:0;color:var(--text-primary);font-size:0.9rem;font-weight:500}@media(max-width: 768px){.immediate-help.svelte-2u15ml.svelte-2u15ml{bottom:10px;right:10px;left:10px;max-width:none}.expanded.svelte-2u15ml.svelte-2u15ml{max-width:none}.help-header.svelte-2u15ml.svelte-2u15ml{padding:1rem}.help-content.svelte-2u15ml.svelte-2u15ml{padding:1rem}.resources-grid.svelte-2u15ml.svelte-2u15ml{grid-template-columns:1fr}}@media(prefers-reduced-motion: reduce){.immediate-help.svelte-2u15ml.svelte-2u15ml,.help-header.svelte-2u15ml.svelte-2u15ml,.toggle-button.svelte-2u15ml.svelte-2u15ml,.chevron.svelte-2u15ml.svelte-2u15ml{transition:none}}@media(prefers-contrast: high){.immediate-help.svelte-2u15ml.svelte-2u15ml{border-width:3px}.resource-card.svelte-2u15ml.svelte-2u15ml{border-width:2px}}",
  map: null
};
const ImmediateHelp = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let language = "czech";
  currentLanguage$3.subscribe((value) => {
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
  $$result.css.add(css$3);
  return `<div class="${["immediate-help svelte-2u15ml", ""].join(" ").trim()}"><div class="help-header svelte-2u15ml" role="button" tabindex="0"><div class="help-icon svelte-2u15ml" data-svelte-h="svelte-2xid1o">🆘</div> <div class="help-text svelte-2u15ml"><h4 class="svelte-2u15ml">${escape(helpResources[language].title)}</h4> <p class="svelte-2u15ml">${escape(helpResources[language].subtitle)}</p></div> <button class="toggle-button svelte-2u15ml"${add_attribute("aria-label", helpResources[language].toggleText, 0)}><svg class="${["chevron svelte-2u15ml", ""].join(" ").trim()}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></button></div> ${``} </div>`;
});
const CTASection_svelte_svelte_type_style_lang = "";
const css$2 = {
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
  $$result.css.add(css$2);
  return `<section id="final-cta" class="cta-section svelte-et5uaz"${add_attribute("this", ctaContainer, 0)}><div class="czech-container"> <div class="background-elements svelte-et5uaz" data-svelte-h="svelte-k5ugyx"><div class="floating-element element-1 svelte-et5uaz">🌱</div> <div class="floating-element element-2 svelte-et5uaz">🤝</div> <div class="floating-element element-3 svelte-et5uaz">💚</div> <div class="floating-element element-4 svelte-et5uaz">🌍</div></div>  <div class="cta-content svelte-et5uaz"><div class="cta-header svelte-et5uaz"><h2 class="czech-heading-lg mb-4 svelte-et5uaz">${escape(content[currentLanguage].title)}</h2> <p class="czech-body-large mb-6 max-w-2xl mx-auto">${escape(content[currentLanguage].subtitle)}</p> <p class="czech-body mb-8 max-w-xl mx-auto opacity-80">${escape(content[currentLanguage].description)}</p></div>  <div class="cta-buttons svelte-et5uaz"><button class="czech-button-primary cta-primary svelte-et5uaz"><span>${escape(content[currentLanguage].primaryCTA)}</span> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button> <button class="czech-button-secondary cta-secondary svelte-et5uaz">${escape(content[currentLanguage].secondaryCTA)}</button></div>  <div class="trust-indicators svelte-et5uaz"><div class="guarantee svelte-et5uaz"><span class="guarantee-icon svelte-et5uaz" data-svelte-h="svelte-1g63c70">✓</span> ${escape(content[currentLanguage].guarantee)}</div> <div class="privacy svelte-et5uaz"><span class="privacy-icon svelte-et5uaz" data-svelte-h="svelte-1h2sshi">🔒</span> ${escape(content[currentLanguage].privacy)}</div></div></div>  <div class="community-stats svelte-et5uaz"><div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-g4bb93">1,834</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.users)}</div></div> <div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-nzwmfo">247</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.actions)}</div></div> <div class="stat-item svelte-et5uaz"><div class="stat-number svelte-et5uaz" data-svelte-h="svelte-put88">12</div> <div class="stat-label svelte-et5uaz">${escape(content[currentLanguage].stats.impact)}</div></div></div>  <div class="final-message svelte-et5uaz"><div class="message-content svelte-et5uaz"><p class="czech-body italic">${escape(
    '"Každý velký sen začíná malým krokem. Váš krok může změnit svět."'
  )}</p> <div class="hearts svelte-et5uaz" data-svelte-h="svelte-1inp17v">💚 💚 💚</div></div></div></div> </section>`;
});
const supabaseUrl = typeof PUBLIC_SUPABASE_URL !== "undefined" ? PUBLIC_SUPABASE_URL : "https://your-project.supabase.co";
const supabaseKey = typeof PUBLIC_SUPABASE_ANON_KEY !== "undefined" ? PUBLIC_SUPABASE_ANON_KEY : "your-anon-key";
createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    // No authentication needed for anonymous feedback
    autoRefreshToken: false
  }
});
const FeedbackModal_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".feedback-trigger.svelte-5jgn1z{position:fixed;bottom:30px;right:30px;background:linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);color:white;border:none;border-radius:50px;padding:12px 20px;font-weight:500;font-size:0.9rem;cursor:pointer;box-shadow:0 4px 20px rgba(46, 93, 49, 0.3);transition:all var(--timing-medium) var(--ease-gentle);z-index:40;display:flex;align-items:center;gap:8px;max-width:200px}.feedback-trigger.svelte-5jgn1z:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(46, 93, 49, 0.4);background:linear-gradient(135deg, var(--czech-forest-light) 0%, var(--czech-forest) 100%)}.feedback-icon.svelte-5jgn1z{font-size:1.2rem;flex-shrink:0}.feedback-text.svelte-5jgn1z{white-space:nowrap}.modal-overlay.svelte-5jgn1z{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0, 0, 0, 0.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;backdrop-filter:blur(4px);animation:svelte-5jgn1z-fadeIn 0.3s ease-out}@keyframes svelte-5jgn1z-fadeIn{from{opacity:0}to{opacity:1}}.modal-content.svelte-5jgn1z{background:white;border-radius:16px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0, 0, 0, 0.3);animation:svelte-5jgn1z-slideIn 0.3s ease-out}@keyframes svelte-5jgn1z-slideIn{from{opacity:0;transform:translateY(-20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}.modal-header.svelte-5jgn1z{display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0;border-bottom:1px solid var(--subtle-border);margin-bottom:24px}.modal-title.svelte-5jgn1z{font-size:1.5rem;color:var(--czech-forest);margin:0;font-weight:600}.modal-close.svelte-5jgn1z{background:none;border:none;font-size:1.5rem;color:var(--text-secondary);cursor:pointer;padding:8px;border-radius:8px;transition:all var(--timing-quick) var(--ease-gentle)}.modal-close.svelte-5jgn1z:hover{background:var(--bg-accent);color:var(--czech-forest)}.modal-body.svelte-5jgn1z{padding:0 24px 24px}.modal-subtitle.svelte-5jgn1z{color:var(--text-secondary);margin-bottom:24px;line-height:1.6}.feedback-form.svelte-5jgn1z{display:flex;flex-direction:column;gap:20px}.form-group.svelte-5jgn1z{display:flex;flex-direction:column;gap:8px}.form-label.svelte-5jgn1z{font-weight:500;color:var(--text-primary);font-size:0.9rem}.optional.svelte-5jgn1z{color:var(--text-muted);font-weight:400;font-size:0.8rem}.feedback-textarea.svelte-5jgn1z{padding:12px;border:1px solid var(--subtle-border);border-radius:8px;font-family:inherit;font-size:0.9rem;line-height:1.5;resize:vertical;transition:border-color var(--timing-medium) var(--ease-gentle)}.feedback-textarea.svelte-5jgn1z:focus{outline:none;border-color:var(--czech-forest);box-shadow:0 0 0 2px rgba(46, 93, 49, 0.1)}.char-counter.svelte-5jgn1z{font-size:0.8rem;color:var(--text-muted);text-align:right}.emotion-select.svelte-5jgn1z{padding:12px;border:1px solid var(--subtle-border);border-radius:8px;background:white;font-family:inherit;font-size:0.9rem;transition:border-color var(--timing-medium) var(--ease-gentle)}.emotion-select.svelte-5jgn1z:focus{outline:none;border-color:var(--czech-forest);box-shadow:0 0 0 2px rgba(46, 93, 49, 0.1)}.star-rating-fieldset.svelte-5jgn1z{border:none;padding:0;margin:0}.star-rating.svelte-5jgn1z{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.star.svelte-5jgn1z{background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px;border-radius:4px;transition:all var(--timing-quick) var(--ease-gentle);opacity:0.3;color:#fbbf24}.star.svelte-5jgn1z:hover,.star.filled.svelte-5jgn1z{opacity:1;transform:scale(1.1)}.rating-label.svelte-5jgn1z{font-size:0.85rem;color:var(--text-secondary);margin-left:8px;font-weight:500}.status-message.svelte-5jgn1z{padding:12px;border-radius:8px;font-size:0.9rem;font-weight:500;text-align:center}.status-message.success.svelte-5jgn1z{background:rgba(74, 124, 89, 0.1);color:var(--czech-forest);border:1px solid var(--czech-forest-light)}.status-message.error.svelte-5jgn1z{background:rgba(220, 53, 69, 0.1);color:#dc3545;border:1px solid rgba(220, 53, 69, 0.3)}.submit-button.svelte-5jgn1z{background:linear-gradient(135deg, var(--czech-forest) 0%, var(--czech-forest-light) 100%);color:white;border:none;padding:14px 24px;border-radius:8px;font-weight:500;font-size:0.95rem;cursor:pointer;transition:all var(--timing-medium) var(--ease-gentle);display:flex;align-items:center;justify-content:center;gap:8px}.submit-button.svelte-5jgn1z:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(46, 93, 49, 0.4)}.submit-button.svelte-5jgn1z:disabled{opacity:0.6;cursor:not-allowed;transform:none}.spinner.svelte-5jgn1z{width:16px;height:16px;border:2px solid rgba(255, 255, 255, 0.3);border-radius:50%;border-top-color:white;animation:svelte-5jgn1z-spin 1s ease-in-out infinite}@keyframes svelte-5jgn1z-spin{to{transform:rotate(360deg)}}@media(max-width: 768px){.feedback-trigger.svelte-5jgn1z{bottom:20px;right:20px;padding:10px 16px;font-size:0.8rem}.feedback-text.svelte-5jgn1z{display:none}.modal-content.svelte-5jgn1z{margin:10px;max-height:95vh}.modal-header.svelte-5jgn1z,.modal-body.svelte-5jgn1z{padding:16px}.modal-title.svelte-5jgn1z{font-size:1.3rem}}@media(prefers-contrast: high){.modal-overlay.svelte-5jgn1z{background:rgba(0, 0, 0, 0.8)}.modal-content.svelte-5jgn1z{border:2px solid var(--czech-forest)}}@media(prefers-reduced-motion: reduce){.modal-overlay.svelte-5jgn1z,.modal-content.svelte-5jgn1z,.feedback-trigger.svelte-5jgn1z,.star.svelte-5jgn1z,.submit-button.svelte-5jgn1z{animation:none;transition:none}}",
  map: null
};
const FeedbackModal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  $$result.css.add(css$1);
  return `  <button class="feedback-trigger svelte-5jgn1z" aria-label="Otevřít formulář zpětné vazby" title="Sdělte nám svůj názor" data-svelte-h="svelte-1t32p1x"><span class="feedback-icon svelte-5jgn1z">💬</span> <span class="feedback-text svelte-5jgn1z">Zpětná vazba</span></button>  ${``}`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".czech-nav.svelte-1tov3qa.svelte-1tov3qa{position:fixed;top:0;left:0;right:0;background:rgba(245, 241, 232, 0.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--subtle-border);z-index:100;transition:all var(--timing-medium) var(--ease-gentle)}.nav-container.svelte-1tov3qa.svelte-1tov3qa{max-width:1200px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:70px}.nav-logo.svelte-1tov3qa.svelte-1tov3qa{display:flex;align-items:center;gap:0.75rem;text-decoration:none;color:var(--czech-forest);font-weight:600;font-size:1.1rem}.logo-icon.svelte-1tov3qa.svelte-1tov3qa{font-size:1.5rem}.nav-links.svelte-1tov3qa.svelte-1tov3qa{display:flex;align-items:center;gap:2rem}.nav-link.svelte-1tov3qa.svelte-1tov3qa{text-decoration:none;color:var(--text-secondary);font-weight:500;transition:color var(--timing-medium) var(--ease-gentle);position:relative}.nav-link.svelte-1tov3qa.svelte-1tov3qa:hover,.nav-link.svelte-1tov3qa.svelte-1tov3qa:focus{color:var(--czech-forest)}.nav-link.svelte-1tov3qa.svelte-1tov3qa::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--copper-detail);transition:width var(--timing-medium) var(--ease-gentle)}.nav-link.svelte-1tov3qa.svelte-1tov3qa:hover::after{width:100%}.nav-actions.svelte-1tov3qa.svelte-1tov3qa{display:flex;align-items:center;gap:1rem}.language-selector.svelte-1tov3qa.svelte-1tov3qa{display:flex;background:var(--bg-secondary);border-radius:8px;padding:2px;border:1px solid var(--subtle-border)}.lang-button.svelte-1tov3qa.svelte-1tov3qa{background:transparent;border:none;padding:0.5rem;border-radius:6px;cursor:pointer;font-size:1rem;transition:all var(--timing-medium) var(--ease-gentle)}.lang-button.active.svelte-1tov3qa.svelte-1tov3qa{background:var(--czech-forest);transform:scale(1.1)}.nav-cta.svelte-1tov3qa.svelte-1tov3qa{background:var(--czech-forest);color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:0.5rem;transition:all var(--timing-medium) var(--ease-gentle)}.nav-cta.svelte-1tov3qa.svelte-1tov3qa:hover{background:var(--czech-forest-dark);transform:translateY(-1px)}.landing-page.svelte-1tov3qa.svelte-1tov3qa{padding-top:70px}.story-section.svelte-1tov3qa.svelte-1tov3qa{padding:5rem 0}.story-content.svelte-1tov3qa.svelte-1tov3qa{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}.story-paragraphs.svelte-1tov3qa.svelte-1tov3qa{margin-bottom:2rem}.story-stats.svelte-1tov3qa.svelte-1tov3qa{display:flex;gap:2rem}.stat-item.svelte-1tov3qa.svelte-1tov3qa{text-align:center}.stat-number.svelte-1tov3qa.svelte-1tov3qa{font-size:2.5rem;font-weight:700;color:var(--czech-forest);line-height:1;margin-bottom:0.5rem}.stat-label.svelte-1tov3qa.svelte-1tov3qa{font-size:0.9rem;color:var(--text-secondary);font-weight:500}.visual-elements.svelte-1tov3qa.svelte-1tov3qa{display:flex;flex-direction:column;gap:2rem}.element.svelte-1tov3qa.svelte-1tov3qa{display:flex;align-items:center;gap:1rem;padding:1.5rem;background:var(--bg-accent);border:1px solid var(--subtle-border);border-radius:12px;transition:all var(--timing-medium) var(--ease-gentle)}.element.svelte-1tov3qa.svelte-1tov3qa:hover{transform:translateX(8px);box-shadow:0 8px 24px rgba(46, 93, 49, 0.1)}.element-icon.svelte-1tov3qa.svelte-1tov3qa{font-size:2rem;flex-shrink:0}.element-text.svelte-1tov3qa.svelte-1tov3qa{font-weight:500;color:var(--czech-forest);margin:0}.czech-footer.svelte-1tov3qa.svelte-1tov3qa{background:var(--czech-forest-dark);color:var(--warm-stone);padding:3rem 0 1rem;margin-top:4rem}.footer-content.svelte-1tov3qa.svelte-1tov3qa{display:grid;grid-template-columns:2fr 3fr;gap:3rem;margin-bottom:2rem}.footer-logo.svelte-1tov3qa.svelte-1tov3qa{display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;font-weight:600;font-size:1.2rem}.footer-description.svelte-1tov3qa.svelte-1tov3qa{color:rgba(245, 241, 232, 0.8);line-height:1.6;max-width:400px}.footer-links.svelte-1tov3qa.svelte-1tov3qa{display:grid;grid-template-columns:repeat(3, 1fr);gap:2rem}.footer-title.svelte-1tov3qa.svelte-1tov3qa{color:var(--warm-stone);font-weight:600;margin-bottom:1rem;font-size:1rem}.footer-list.svelte-1tov3qa.svelte-1tov3qa{list-style:none;padding:0;margin:0}.footer-list.svelte-1tov3qa li.svelte-1tov3qa{margin-bottom:0.5rem}.footer-list.svelte-1tov3qa a.svelte-1tov3qa{color:rgba(245, 241, 232, 0.7);text-decoration:none;transition:color var(--timing-medium) var(--ease-gentle)}.footer-list.svelte-1tov3qa a.svelte-1tov3qa:hover{color:var(--warm-stone)}.footer-bottom.svelte-1tov3qa.svelte-1tov3qa{border-top:1px solid rgba(245, 241, 232, 0.2);padding-top:1rem;display:flex;justify-content:space-between;align-items:center;font-size:0.9rem}.footer-copyright.svelte-1tov3qa.svelte-1tov3qa{color:rgba(245, 241, 232, 0.6);margin:0}.footer-meta.svelte-1tov3qa.svelte-1tov3qa{display:flex;align-items:center;gap:1rem;color:rgba(245, 241, 232, 0.6)}.footer-meta.svelte-1tov3qa a.svelte-1tov3qa{color:rgba(245, 241, 232, 0.7);text-decoration:none}.footer-meta.svelte-1tov3qa a.svelte-1tov3qa:hover{color:var(--warm-stone)}.divider.svelte-1tov3qa.svelte-1tov3qa{opacity:0.5}@media(max-width: 768px){.nav-container.svelte-1tov3qa.svelte-1tov3qa{padding:0 1rem;height:60px}.nav-links.svelte-1tov3qa.svelte-1tov3qa{display:none}.nav-actions.svelte-1tov3qa.svelte-1tov3qa{gap:0.5rem}.landing-page.svelte-1tov3qa.svelte-1tov3qa{padding-top:60px}.story-content.svelte-1tov3qa.svelte-1tov3qa{grid-template-columns:1fr;gap:2rem}.story-stats.svelte-1tov3qa.svelte-1tov3qa{justify-content:center}.visual-elements.svelte-1tov3qa.svelte-1tov3qa{order:-1}.element.svelte-1tov3qa.svelte-1tov3qa{flex-direction:column;text-align:center;padding:1rem}.footer-content.svelte-1tov3qa.svelte-1tov3qa{grid-template-columns:1fr;gap:2rem}.footer-links.svelte-1tov3qa.svelte-1tov3qa{grid-template-columns:1fr;gap:1.5rem}.footer-bottom.svelte-1tov3qa.svelte-1tov3qa{flex-direction:column;gap:1rem;text-align:center}}",
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
  return ` <nav class="czech-nav svelte-1tov3qa"><div class="nav-container svelte-1tov3qa"> <div class="nav-logo svelte-1tov3qa"><div class="logo-icon svelte-1tov3qa" data-svelte-h="svelte-a96uxz">🤝</div> <span class="logo-text">${escape(language === "czech" ? "Akcelerátor altruismu" : "Altruism Accelerator")}</span></div>  <div class="nav-links svelte-1tov3qa"><a href="#hero" class="nav-link svelte-1tov3qa" data-section="hero">${escape(content[language].nav.home)}</a> <a href="#solidarity-garden" class="nav-link svelte-1tov3qa" data-section="solidarity-garden">${escape(content[language].sections.garden)}</a> <a href="#czech-map" class="nav-link svelte-1tov3qa" data-section="czech-map">${escape(content[language].sections.map)}</a></div>  <div class="nav-actions svelte-1tov3qa"><div class="language-selector svelte-1tov3qa"><button class="${"lang-button " + escape(language === "czech" ? "active" : "", true) + " svelte-1tov3qa"}" aria-label="Česky">🇨🇿</button> <button class="${"lang-button " + escape(language === "english" ? "active" : "", true) + " svelte-1tov3qa"}" aria-label="English">🇺🇸</button></div> <button class="nav-cta svelte-1tov3qa">${escape(content[language].nav.launch)} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button></div></div></nav>  <div class="landing-page svelte-1tov3qa"> ${validate_component(Hero, "Hero").$$render($$result, {}, {}, {})}  <section id="story" class="story-section czech-section svelte-1tov3qa"><div class="czech-container"><div class="story-content svelte-1tov3qa"><div class="story-text"><h2 class="czech-heading-lg mb-6">${escape(language === "czech" ? "Od empatie k akci – česky a prakticky" : "From empathy to action – Czech and practical")}</h2> ${language === "czech" ? `<div class="story-paragraphs svelte-1tov3qa" data-svelte-h="svelte-np8txc"><p class="czech-body-large mb-4">Václav Havel říkal: &quot;Naděje není přesvědčení, že se něco povede, 
                ale jistota, že má smysl, bez ohledu na to, jak to dopadne.&quot;</p> <p class="czech-body mb-4">Tato platforma vznikla z poznání, že Češi nechtějí velká gesta a prázdné řeči. 
                Chceme <strong>praktické kroky</strong>, které skutečně pomáhají.</p> <p class="czech-body mb-6">Od pomoci sousedům po podporu ukrajinských rodin, od doučování dětí 
                po péči o seniory – každá akce je propojená s důvěryhodnými 
                českými organizacemi.</p></div>` : `<div class="story-paragraphs svelte-1tov3qa" data-svelte-h="svelte-1p4o3qu"><p class="czech-body-large mb-4">Václav Havel said: &quot;Hope is not the conviction that something will turn out well, 
                but the certainty that something makes sense, regardless of how it turns out.&quot;</p> <p class="czech-body mb-4">This platform was born from understanding that Czechs don&#39;t want grand gestures 
                and empty words. We want <strong>practical steps</strong> that truly help.</p> <p class="czech-body mb-6">From helping neighbors to supporting Ukrainian families, from tutoring children 
                to caring for seniors – every action is connected with trustworthy 
                Czech organizations.</p></div>`} <div class="story-stats svelte-1tov3qa"><div class="stat-item svelte-1tov3qa"><div class="stat-number svelte-1tov3qa" data-svelte-h="svelte-nzwmfo">247</div> <div class="stat-label svelte-1tov3qa">${escape(language === "czech" ? "akcí tento týden" : "actions this week")}</div></div> <div class="stat-item svelte-1tov3qa"><div class="stat-number svelte-1tov3qa" data-svelte-h="svelte-g4bb93">1,834</div> <div class="stat-label svelte-1tov3qa">${escape(language === "czech" ? "aktivních lidí" : "active helpers")}</div></div> <div class="stat-item svelte-1tov3qa"><div class="stat-number svelte-1tov3qa" data-svelte-h="svelte-put88">12</div> <div class="stat-label svelte-1tov3qa">${escape(language === "czech" ? "regionů" : "regions")}</div></div></div></div> <div class="story-visual"><div class="visual-elements svelte-1tov3qa"><div class="element element-1 svelte-1tov3qa"><div class="element-icon svelte-1tov3qa" data-svelte-h="svelte-1uxqtms">🤝</div> <p class="element-text svelte-1tov3qa">${escape(language === "czech" ? "Soused pomáhá sousedovi" : "Neighbor helps neighbor")}</p></div> <div class="element element-2 svelte-1tov3qa"><div class="element-icon svelte-1tov3qa" data-svelte-h="svelte-x26xhe">🌱</div> <p class="element-text svelte-1tov3qa">${escape(language === "czech" ? "Malé kroky, velký dopad" : "Small steps, big impact")}</p></div> <div class="element element-3 svelte-1tov3qa"><div class="element-icon svelte-1tov3qa" data-svelte-h="svelte-1o2krzy">💚</div> <p class="element-text svelte-1tov3qa">${escape(language === "czech" ? "Praktická solidarita" : "Practical solidarity")}</p></div></div></div></div></div></section>  ${validate_component(SolidarityGarden, "SolidarityGarden").$$render($$result, {}, {}, {})}  ${validate_component(CzechMap, "CzechMap").$$render($$result, {}, {}, {})}  ${validate_component(CTASection, "CTASection").$$render($$result, {}, {}, {})}  ${validate_component(ImmediateHelp, "ImmediateHelp").$$render($$result, {}, {}, {})}  ${validate_component(FeedbackModal, "FeedbackModal").$$render($$result, {}, {}, {})}  <footer class="czech-footer svelte-1tov3qa"><div class="czech-container"><div class="footer-content svelte-1tov3qa"><div class="footer-main"><div class="footer-logo svelte-1tov3qa" data-svelte-h="svelte-4jde00"><div class="logo-icon svelte-1tov3qa">🤝</div> <span class="logo-text">Akcelerátor altruismu</span></div> <p class="footer-description svelte-1tov3qa">${escape(language === "czech" ? "Praktická cesta od empatie k akci. Pomáháme tisícům Čechů najít svou cestu k smysluplné pomoci." : "Practical path from empathy to action. Helping thousands of Czechs find their way to meaningful help.")}</p></div> <div class="footer-links svelte-1tov3qa"><div class="footer-section"><h4 class="footer-title svelte-1tov3qa">${escape(language === "czech" ? "Platforma" : "Platform")}</h4> <ul class="footer-list svelte-1tov3qa"><li class="svelte-1tov3qa"><a href="#how-it-works" class="svelte-1tov3qa">${escape(language === "czech" ? "Jak to funguje" : "How it works")}</a></li> <li class="svelte-1tov3qa"><a href="#privacy" class="svelte-1tov3qa">${escape(language === "czech" ? "Soukromí" : "Privacy")}</a></li> <li class="svelte-1tov3qa"><a href="#about" class="svelte-1tov3qa">${escape(language === "czech" ? "O projektu" : "About")}</a></li></ul></div> <div class="footer-section"><h4 class="footer-title svelte-1tov3qa">${escape(language === "czech" ? "Pomoc" : "Help")}</h4> <ul class="footer-list svelte-1tov3qa"><li class="svelte-1tov3qa" data-svelte-h="svelte-lpk1xi"><a href="#faq" class="svelte-1tov3qa">FAQ</a></li> <li class="svelte-1tov3qa"><a href="#contact" class="svelte-1tov3qa">${escape(language === "czech" ? "Kontakt" : "Contact")}</a></li> <li class="svelte-1tov3qa"><a href="#support" class="svelte-1tov3qa">${escape(language === "czech" ? "Podpora" : "Support")}</a></li></ul></div> <div class="footer-section"><h4 class="footer-title svelte-1tov3qa">${escape(language === "czech" ? "Partneři" : "Partners")}</h4> <ul class="footer-list svelte-1tov3qa" data-svelte-h="svelte-nf87zv"><li class="svelte-1tov3qa"><a href="https://charita.cz" target="_blank" rel="noopener" class="svelte-1tov3qa">Charita ČR</a></li> <li class="svelte-1tov3qa"><a href="https://dobrovolnik.cz" target="_blank" rel="noopener" class="svelte-1tov3qa">Dobrovolník.cz</a></li> <li class="svelte-1tov3qa"><a href="https://adra.cz" target="_blank" rel="noopener" class="svelte-1tov3qa">ADRA</a></li></ul></div></div></div> <div class="footer-bottom svelte-1tov3qa"><p class="footer-copyright svelte-1tov3qa">© 2024 Akcelerátor altruismu. 
          ${escape(language === "czech" ? "Vytvořeno s láskou pro českou komunitu." : "Made with love for the Czech community.")}</p> <div class="footer-meta svelte-1tov3qa"><a href="#privacy" class="svelte-1tov3qa">${escape(language === "czech" ? "Ochrana soukromí" : "Privacy Policy")}</a> <span class="divider svelte-1tov3qa" data-svelte-h="svelte-fhej52">•</span> <a href="#terms" class="svelte-1tov3qa">${escape(language === "czech" ? "Podmínky" : "Terms")}</a></div></div></div></footer> </div>`;
});
export {
  Page as default
};
