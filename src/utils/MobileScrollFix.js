// utils/MobileScrollFix.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function applyMobileScrollFix() {
  const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  // Onemogući pinch-zoom
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  if (isAndroid) _fixAndroidViewport();

  if (isIOS) {
    // iOS: momentum scroll glitch fix
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style['-webkit-overflow-scrolling'] = 'touch';
  }

  return { isIOS, isAndroid };
}

function _fixAndroidViewport() {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  setVH();
  window.addEventListener('resize', setVH, { passive: true });
}

export async function initLenis() {
  try {
    const { default: Lenis } = await import('lenis');
    const lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothTouch: false,   // Isključeno — nativni touch je bolji za ovaj tip scroll-a
      touchMultiplier: 1.2,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    window.__lenis = lenis;
    return lenis;
  } catch (e) {
    console.warn('Lenis nije dostupan:', e);
    return null;
  }
}
