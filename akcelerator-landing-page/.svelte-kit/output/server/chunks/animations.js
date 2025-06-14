import { w as writable } from "./index2.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
const currentLanguage = writable("czech");
gsap.registerPlugin(ScrollTrigger);
export {
  currentLanguage as c
};
