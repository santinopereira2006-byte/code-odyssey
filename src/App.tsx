import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TheCall from './components/home/TheCall';
import Rules from './components/home/Rules';
import Voyage from './components/home/Voyage';
import SetSail from './components/home/SetSail';
import SiteFooter from './components/home/SiteFooter';

gsap.registerPlugin(ScrollTrigger);

type Phase = 'loading' | 'reveal' | 'ready';
const SEEN_KEY = 'co5-intro-seen';

const readSeen = () => {
  try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
};

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [sceneReady, setSceneReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [quick] = useState(readSeen);
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Always open on the surface, with scrolling locked until the reveal is complete.
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', phase !== 'ready');
  }, [phase]);

  useEffect(() => {
    const fonts = Promise.all([
      document.fonts.load('600 1em Montserrat'),
      document.fonts.load('400 1em Montserrat'),
    ]).catch(() => undefined);
    const timeout = new Promise((r) => setTimeout(r, 4000));
    Promise.race([fonts.then(() => document.fonts.ready), timeout]).then(() => setFontsReady(true));
  }, []);

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onReveal = useCallback(() => setPhase('reveal'), []);
  const onDone = useCallback(() => {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* storage unavailable */ }
    setPhase('ready');
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  // Section reveals: rise out of the dark, sharpening as they arrive.
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 48, filter: 'blur(8px)', duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('[data-track]').forEach((el) => {
        gsap.from(el, {
          letterSpacing: '0.75em', duration: 1.8, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count);
        const v = { n: 0 };
        gsap.to(v, {
          n: end, duration: 2, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => { el.textContent = Math.round(v.n).toLocaleString('en-IN'); },
        });
      });
    });
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <>
      <a className="skip" href="#about">Skip to content</a>
      <Navbar visible={phase === 'ready'} />
      <main>
        <Hero play={phase !== 'loading'} reducedMotion={reducedMotion} onReady={onSceneReady} />
        <div className="depths">
          <TheCall />
          <Rules />
          <Voyage />
          <SetSail />
        </div>
      </main>
      <SiteFooter />
      {phase !== 'ready' && (
        <Loader
          ready={sceneReady && fontsReady}
          quick={quick}
          reducedMotion={reducedMotion}
          onReveal={onReveal}
          onDone={onDone}
        />
      )}
    </>
  );
}
