import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

/** Smooth, inertial scrolling for fine pointers; touch devices keep native scrolling. */
export function createSmoother(reducedMotion: boolean) {
  if (reducedMotion) return null;
  const smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.15,
    smoothTouch: false,
    effects: true,
    normalizeScroll: false,
  });
  // Keyboard focus, find-in-page and scrollIntoView scroll the clipped wrapper itself;
  // hand that offset back to the page so the camera, HUD and nav stay in sync.
  const wrapper = smoother.wrapper();
  wrapper.addEventListener('scroll', () => {
    const off = wrapper.scrollTop;
    if (!off) return;
    wrapper.scrollTop = 0;
    smoother.scrollTop(smoother.scrollTop() + off);
  });
  return smoother;
}

/** Scrolls to an in-page anchor through the smoother when there is one. */
export function scrollToHash(hash: string) {
  const target = document.querySelector(hash);
  if (!target) return;
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(target, true, 'top top');
  else target.scrollIntoView({ behavior: 'smooth' });
  history.replaceState(null, '', hash);
}

/** Routes every in-page link through scrollToHash. Returns a cleanup function. */
export function interceptAnchors() {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const hash = a.getAttribute('href')!;
    if (hash.length < 2 || !document.querySelector(hash)) return;
    e.preventDefault();
    scrollToHash(hash);
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}
