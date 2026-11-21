// Svelte 5 component map for AppIcon.svelte (do NOT import from Node-only Vitest modules)
import LucideZap from '@lucide/svelte/icons/zap';
import LucideCompass from '@lucide/svelte/icons/compass';
import LucideClock from '@lucide/svelte/icons/clock';
import LucideMapPin from '@lucide/svelte/icons/map-pin';
import LucideTrees from '@lucide/svelte/icons/trees';
import LucidePlus from '@lucide/svelte/icons/plus';
import LucideLeaf from '@lucide/svelte/icons/leaf';
import LucideHeart from '@lucide/svelte/icons/heart';
import LucideStar from '@lucide/svelte/icons/star';
import LucideHome from '@lucide/svelte/icons/house';
import LucideFootprints from '@lucide/svelte/icons/footprints';
import LucideMousePointer from '@lucide/svelte/icons/mouse-pointer';
import LucideMessageCircle from '@lucide/svelte/icons/message-circle';
import LucideLifeBuoy from '@lucide/svelte/icons/life-buoy';
import LucidePhone from '@lucide/svelte/icons/phone';
import LucideAlertTriangle from '@lucide/svelte/icons/triangle-exclamation-point';
import LucideX from '@lucide/svelte/icons/x';
import LucideCheck from '@lucide/svelte/icons/check';
import LucideShare2 from '@lucide/svelte/icons/share-2';
import LucideCoffee from '@lucide/svelte/icons/coffee';
import LucideInfo from '@lucide/svelte/icons/info';
import LucideSparkles from '@lucide/svelte/icons/sparkles';
import LucideSun from '@lucide/svelte/icons/sun';
import LucideMoon from '@lucide/svelte/icons/moon';
import LucideWaves from '@lucide/svelte/icons/waves-horizontal';
import LucideVolume2 from '@lucide/svelte/icons/volume-2';
import LucideVolumeX from '@lucide/svelte/icons/volume-x';
import LucideMenu from '@lucide/svelte/icons/menu';
import LucideChevronLeft from '@lucide/svelte/icons/chevron-left';
import LucideChevronRight from '@lucide/svelte/icons/chevron-right';
import LucideChevronDown from '@lucide/svelte/icons/chevron-down';
import LucideRefreshCw from '@lucide/svelte/icons/refresh-cw';
import LucideArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
import LucideTarget from '@lucide/svelte/icons/target';
import LucideShieldCheck from '@lucide/svelte/icons/shield-check';
import LucideUsers from '@lucide/svelte/icons/users';
import LucideBookOpen from '@lucide/svelte/icons/book-open';
import LucideUtensils from '@lucide/svelte/icons/utensils';
import LucideBuilding from '@lucide/svelte/icons/building';
import LucideCalendar from '@lucide/svelte/icons/calendar';
import LucideCopy from '@lucide/svelte/icons/copy';
import LucideMail from '@lucide/svelte/icons/mail';
import LucideSlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
import LucideSearch from '@lucide/svelte/icons/search';
import LucideNavigation from '@lucide/svelte/icons/navigation';
import LucideCircleDot from '@lucide/svelte/icons/circle-dot';
import LucideArrowRight from '@lucide/svelte/icons/arrow-right';
import LucideArrowLeft from '@lucide/svelte/icons/arrow-left';
import LucideArrowDown from '@lucide/svelte/icons/arrow-down';
import LucideArrowUp from '@lucide/svelte/icons/arrow-up';
import LucideBird from '@lucide/svelte/icons/bird';
import LucideMusic from '@lucide/svelte/icons/eighth-notes';
import LucideAmbulance from '@lucide/svelte/icons/ambulance';
import LucideDroplet from '@lucide/svelte/icons/droplet';
import LucideDna from '@lucide/svelte/icons/dna';
import LucideScissors from '@lucide/svelte/icons/scissors';
import LucideBrain from '@lucide/svelte/icons/brain';
import LucideFlower2 from '@lucide/svelte/icons/flower-2';
import LucideRainbow from '@lucide/svelte/icons/rainbow';
import LucidePenLine from '@lucide/svelte/icons/pen-line';
import LucideLaptop from '@lucide/svelte/icons/laptop';
import LucideMap from '@lucide/svelte/icons/map';
import LucideTelescope from '@lucide/svelte/icons/telescope';
import LucideGraduationCap from '@lucide/svelte/icons/graduation-cap';
import LucideMic from '@lucide/svelte/icons/mic';
import LucidePackage from '@lucide/svelte/icons/package';
import LucideSmartphone from '@lucide/svelte/icons/smartphone';
import LucideSprout from '@lucide/svelte/icons/sprout';
import LucideApple from '@lucide/svelte/icons/apple';
import LucideTent from '@lucide/svelte/icons/tent';
import LucideBackpack from '@lucide/svelte/icons/backpack';
import LucideBike from '@lucide/svelte/icons/bike';
import LucideAccessibility from '@lucide/svelte/icons/accessibility';
import LucideGift from '@lucide/svelte/icons/gift';
import LucideHandshake from '@lucide/svelte/icons/handshake';
import LucideHandHelping from '@lucide/svelte/icons/hand-helping';
import LucideFlame from '@lucide/svelte/icons/flame';
import LucideGlobe from '@lucide/svelte/icons/globe';
import LucideShirt from '@lucide/svelte/icons/shirt';
import LucideCircleCheck from '@lucide/svelte/icons/circle-check';
import LucideHourglass from '@lucide/svelte/icons/hourglass';
import LucideList from '@lucide/svelte/icons/list';
import LucideImage from '@lucide/svelte/icons/image';
import LucideLightbulb from '@lucide/svelte/icons/lightbulb';
import LucideDownload from '@lucide/svelte/icons/download';
import LucideKeyRound from '@lucide/svelte/icons/key-round';
import LucideArmchair from '@lucide/svelte/icons/armchair';
import LucideScale from '@lucide/svelte/icons/scale';
import LucideLock from '@lucide/svelte/icons/lock';
import LucideSunrise from '@lucide/svelte/icons/sunrise';
import LucideWind from '@lucide/svelte/icons/wind';
import LucideSquirrel from '@lucide/svelte/icons/squirrel';

/** @typedef {import('./iconRegistry.js').IconKey} IconKey */
/** @typedef {import('@lucide/svelte').LucideIcon} LucideIcon */

/** @type {Record<Exclude<IconKey, 'paw'>, LucideIcon>} */
export const LUCIDE_ICON_MAP = {
  'zap': LucideZap,
  'compass': LucideCompass,
  'clock': LucideClock,
  'map-pin': LucideMapPin,
  'trees': LucideTrees,
  'plus': LucidePlus,
  'leaf': LucideLeaf,
  'heart': LucideHeart,
  'star': LucideStar,
  'home': LucideHome,
  'footprints': LucideFootprints,
  'mouse-pointer': LucideMousePointer,
  'message-circle': LucideMessageCircle,
  'life-buoy': LucideLifeBuoy,
  'phone': LucidePhone,
  'alert-triangle': LucideAlertTriangle,
  'x': LucideX,
  'check': LucideCheck,
  'share-2': LucideShare2,
  'coffee': LucideCoffee,
  'info': LucideInfo,
  'sparkles': LucideSparkles,
  'sun': LucideSun,
  'moon': LucideMoon,
  'waves': LucideWaves,
  'volume-2': LucideVolume2,
  'volume-x': LucideVolumeX,
  'menu': LucideMenu,
  'chevron-left': LucideChevronLeft,
  'chevron-right': LucideChevronRight,
  'chevron-down': LucideChevronDown,
  'refresh-cw': LucideRefreshCw,
  'arrow-up-right': LucideArrowUpRight,
  'target': LucideTarget,
  'shield-check': LucideShieldCheck,
  'users': LucideUsers,
  'book-open': LucideBookOpen,
  'utensils': LucideUtensils,
  'building': LucideBuilding,
  'calendar': LucideCalendar,
  'copy': LucideCopy,
  'mail': LucideMail,
  'sliders-horizontal': LucideSlidersHorizontal,
  'search': LucideSearch,
  'navigation': LucideNavigation,
  'circle-dot': LucideCircleDot,
  'arrow-right': LucideArrowRight,
  'arrow-left': LucideArrowLeft,
  'arrow-down': LucideArrowDown,
  'arrow-up': LucideArrowUp,
  'bird': LucideBird,
  'music': LucideMusic,
  'ambulance': LucideAmbulance,
  'droplet': LucideDroplet,
  'dna': LucideDna,
  'scissors': LucideScissors,
  'brain': LucideBrain,
  'flower-2': LucideFlower2,
  'rainbow': LucideRainbow,
  'pen-line': LucidePenLine,
  'laptop': LucideLaptop,
  'map': LucideMap,
  'telescope': LucideTelescope,
  'graduation-cap': LucideGraduationCap,
  'mic': LucideMic,
  'package': LucidePackage,
  'smartphone': LucideSmartphone,
  'sprout': LucideSprout,
  'apple': LucideApple,
  'tent': LucideTent,
  'backpack': LucideBackpack,
  'bike': LucideBike,
  'accessibility': LucideAccessibility,
  'gift': LucideGift,
  'handshake': LucideHandshake,
  'hand-helping': LucideHandHelping,
  'flame': LucideFlame,
  'globe': LucideGlobe,
  'shirt': LucideShirt,
  'circle-check': LucideCircleCheck,
  'hourglass': LucideHourglass,
  'list': LucideList,
  'image': LucideImage,
  'lightbulb': LucideLightbulb,
  'download': LucideDownload,
  'key-round': LucideKeyRound,
  'armchair': LucideArmchair,
  'scale': LucideScale,
  'lock': LucideLock,
  'sunrise': LucideSunrise,
  'wind': LucideWind,
  'squirrel': LucideSquirrel
};

/**
 * @param {Exclude<IconKey, 'paw'>} key
 * @returns {LucideIcon}
 */
export function getLucideIcon(key) {
  return LUCIDE_ICON_MAP[key] || LUCIDE_ICON_MAP['circle-dot'];
}
