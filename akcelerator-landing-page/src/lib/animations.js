import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Czech-appropriate animation timings and easings
export const czechAnimations = {
  timing: {
    quick: 0.2,
    medium: 0.4,
    slow: 0.8,
    thoughtful: 1.2
  },
  easing: {
    gentle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    natural: "cubic-bezier(0.4, 0.0, 0.2, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  }
};

// Smooth scroll to section
export function scrollToSection(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    gsap.to(window, {
      duration: czechAnimations.timing.thoughtful,
      scrollTo: { y: element, offsetY: 80 },
      ease: czechAnimations.easing.gentle
    });
  }
}

// Fade in elements with stagger
export function fadeInStagger(elements, options = {}) {
  const defaults = {
    duration: czechAnimations.timing.slow,
    stagger: 0.1,
    ease: czechAnimations.easing.gentle,
    y: 20,
    opacity: 0
  };
  
  const config = { ...defaults, ...options };
  
  gsap.fromTo(elements, 
    { 
      opacity: config.opacity,
      y: config.y 
    },
    {
      opacity: 1,
      y: 0,
      duration: config.duration,
      stagger: config.stagger,
      ease: config.ease,
      scrollTrigger: {
        trigger: elements[0],
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    }
  );
}

// Czech-style gentle reveal animation
export function czechReveal(element, options = {}) {
  const defaults = {
    duration: czechAnimations.timing.thoughtful,
    ease: czechAnimations.easing.gentle,
    y: 30,
    opacity: 0,
    scale: 0.95
  };
  
  const config = { ...defaults, ...options };
  
  gsap.fromTo(element,
    {
      opacity: config.opacity,
      y: config.y,
      scale: config.scale
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: config.duration,
      ease: config.ease,
      scrollTrigger: {
        trigger: element,
        start: "top 70%",
        end: "bottom 30%",
        toggleActions: "play none none reverse"
      }
    }
  );
}

// Parallax effect for Czech forest background
export function initParallax(element, speed = 0.5) {
  gsap.to(element, {
    yPercent: -50,
    ease: "none",
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        gsap.set(element, {
          yPercent: -50 + (self.progress * 100 * speed)
        });
      }
    }
  });
}

// Czech-style hover animation
export function czechHover(element, options = {}) {
  const defaults = {
    scale: 1.02,
    duration: czechAnimations.timing.medium,
    ease: czechAnimations.easing.gentle
  };
  
  const config = { ...defaults, ...options };
  
  element.addEventListener('mouseenter', () => {
    gsap.to(element, {
      scale: config.scale,
      duration: config.duration,
      ease: config.ease
    });
  });
  
  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      scale: 1,
      duration: config.duration,
      ease: config.ease
    });
  });
}

// Gentle pulse animation for regional map
export function pulseAnimation(element, options = {}) {
  const defaults = {
    scale: 1.1,
    duration: 2,
    ease: "power2.inOut",
    repeat: -1,
    yoyo: true
  };
  
  const config = { ...defaults, ...options };
  
  gsap.to(element, {
    scale: config.scale,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo
  });
}

// Celebration animation (understated for Czech culture)
export function czechCelebration(element, message = "Výborně!") {
  // Create celebration element
  const celebration = document.createElement('div');
  celebration.className = 'czech-celebration';
  celebration.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-icon">✨</div>
      <div class="celebration-text">${message}</div>
    </div>
  `;
  
  element.appendChild(celebration);
  
  // Animate celebration (Czech-style: gentle, not flashy)
  const tl = gsap.timeline({
    onComplete: () => celebration.remove()
  });
  
  tl.fromTo(celebration,
    {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: czechAnimations.timing.slow,
      ease: czechAnimations.easing.spring
    }
  )
  .to(celebration, {
    opacity: 0,
    scale: 0.9,
    y: -10,
    duration: czechAnimations.timing.slow,
    ease: czechAnimations.easing.gentle,
    delay: 2
  });
}

// Text reveal animation for storytelling sections
export function textReveal(element, options = {}) {
  const defaults = {
    duration: czechAnimations.timing.thoughtful,
    ease: czechAnimations.easing.gentle,
    stagger: 0.05
  };
  
  const config = { ...defaults, ...options };
  
  // Split text into words
  const words = element.textContent.split(' ');
  element.innerHTML = words.map(word => 
    `<span class="word-reveal" style="opacity: 0; transform: translateY(10px); display: inline-block;">${word}</span>`
  ).join(' ');
  
  const wordElements = element.querySelectorAll('.word-reveal');
  
  gsap.to(wordElements, {
    opacity: 1,
    y: 0,
    duration: config.duration,
    stagger: config.stagger,
    ease: config.ease,
    scrollTrigger: {
      trigger: element,
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  });
}

// Loading transition for Streamlit app launch
export function streamlitTransition(element, callback) {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'streamlit-loading';
  loadingOverlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">Připravujeme akcelerátor...</p>
    </div>
  `;
  
  document.body.appendChild(loadingOverlay);
  
  gsap.fromTo(loadingOverlay,
    { opacity: 0 },
    { 
      opacity: 1, 
      duration: czechAnimations.timing.medium,
      ease: czechAnimations.easing.gentle,
      onComplete: () => {
        setTimeout(() => {
          callback();
          gsap.to(loadingOverlay, {
            opacity: 0,
            duration: czechAnimations.timing.medium,
            onComplete: () => loadingOverlay.remove()
          });
        }, 1000);
      }
    }
  );
}

// Initialize all scroll-triggered animations
export function initScrollAnimations() {
  // Refresh ScrollTrigger when page loads
  ScrollTrigger.refresh();
  
  // Add scroll indicator animation
  const scrollIndicators = document.querySelectorAll('.scroll-indicator');
  scrollIndicators.forEach(indicator => {
    gsap.to(indicator, {
      y: 10,
      duration: 1.5,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    });
  });
}

// Cleanup function
export function cleanupAnimations() {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  gsap.killTweensOf("*");
} 