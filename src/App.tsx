import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import OceanStage from './components/OceanStage';
import Cursor from './components/Cursor';
import DepthGauge from './components/DepthGauge';
import TheCall from './components/home/TheCall';
import Rules from './components/home/Rules';
import Voyage from './components/home/Voyage';
import SetSail from './components/home/SetSail';
import SiteFooter from './components/home/SiteFooter';
import { createSmoother, interceptAnchors } from './lib/scroll';
import { rig } from './scene/rig';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

type Phase = 'loading' | 'reveal' | 'ready';
const SEEN_KEY = 'co5-intro-seen';

/** Chapters, in page order: drive the nav highlight and the depth gauge. */
const CHAPTERS = [
  { id: 'home', label: 'Surface' },
  { id: 'about', label: 'The Call' },
  { id: 'rules', label: 'Rules of the Sea' },
  { id: 'voyage', label: 'The Voyage' },
  { id: 'register', label: 'Set Sail' },
];

const readSeen = () => {
  try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
};

/** Smooth scrolling has to exist before any ScrollTrigger, so it mounts first. */
function SmoothScroll({ reducedMotion }: { reducedMotion: boolean }) {
  useLayoutEffect(() => {
    const smoother = createSmoother(reducedMotion);
    const stop = interceptAnchors();
    return () => { stop(); smoother?.kill(); };
  }, [reducedMotion]);
  return null;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [sceneReady, setSceneReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [chapter, setChapter] = useState('home');
  const [quick] = useState(readSeen);
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [finePointer] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  // Always open on the surface, with scrolling locked until the reveal is complete.
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', phase !== 'ready');
    ScrollSmoother.get()?.paused(phase !== 'ready');
  }, [phase]);

  useEffect(() => {
    const fonts = Promise.all([
      document.fonts.load('600 1em Montserrat'),
      document.fonts.load('400 1em Montserrat'),
      document.fonts.load('italic 400 1em "Cormorant Garamond"'),
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

  // ---- The director: one camera across every chapter -----------------------------
  useLayoutEffect(() => {
    const root = document.documentElement;
    const ctx = gsap.context(() => {
      // Progress + velocity for the HUD, nav hairline and the scene's currents.
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          root.style.setProperty('--progress', self.progress.toFixed(4));
          rig.velocity = self.getVelocity() / window.innerHeight;
          rig.progress = self.progress;
        },
      });
      gsap.ticker.add(decayVelocity);

      CHAPTERS.forEach((c) => {
        ScrollTrigger.create({
          trigger: `#${c.id}`, start: 'top 55%', end: 'bottom 55%',
          onToggle: (self) => self.isActive && setChapter(c.id),
        });
      });

      // Each chapter steers the camera a little: a slow drift through the deep,
      // then the long ascent back to the surface for the final call.
      const cam = rig.scroll;
      const leg = (trigger: string, from: object, to: object, start = 'top center', end = 'bottom center') =>
        gsap.fromTo(cam, from, {
          ...to, ease: 'sine.inOut', immediateRender: false,
          scrollTrigger: { trigger, start, end, scrub: 1.6 },
        });
      leg('#about', { camX: 0 }, { camX: -0.035 });
      leg('#rules', { camX: -0.035 }, { camX: 0.04 });
      leg('#voyage', { camX: 0.04 }, { camX: 0 });
      leg('#register',
        { camY: 0.5, zoom: 1.24, dive: 1, lantern: 1, glow: 1, focus: 0.95 },
        { camY: 0, zoom: 1.07, dive: 0.12, lantern: 0.25, glow: 0.55, focus: 0.95 },
        'top bottom', 'center center');
    });

    function decayVelocity() { rig.velocity *= 0.92; }
    return () => { gsap.ticker.remove(decayVelocity); ctx.revert(); };
  }, []);

  // ---- Choreographed reveals ----------------------------------------------------
  useLayoutEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      const once = (el: Element, start = 'top 86%') => ({ trigger: el, start, once: true });

      // Headings: letters rise out of a hairline mask, tracking settles.
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
        const split = SplitText.create(el, { type: 'words,chars', mask: 'words' });
        gsap.from(split.chars, {
          yPercent: 115, rotateX: -60, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.028,
          scrollTrigger: once(el),
        });
        gsap.from(el, { letterSpacing: '0.6em', duration: 2, ease: 'expo.out', scrollTrigger: once(el) });
      });

      // Running copy: line by line from behind a mask.
      gsap.utils.toArray<HTMLElement>('[data-lines]').forEach((el) => {
        SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 105, duration: 1.2, ease: 'power4.out', stagger: 0.09, scrollTrigger: once(el),
          }),
        });
      });

      // Chapter instruments: the rule draws, the reading ticks in.
      gsap.utils.toArray<HTMLElement>('.hud').forEach((el) => {
        gsap.timeline({ scrollTrigger: once(el, 'top 90%') })
          .from(el.querySelector('.hud__line'), { scaleX: 0, duration: 1.2, ease: 'expo.inOut' })
          .from(el.querySelectorAll('.hud__index, .hud__name, .hud__depth'), { opacity: 0, y: 10, stagger: 0.08, duration: 0.7, ease: 'power3.out' }, 0.2);
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 48, filter: 'blur(8px)', duration: 1.2, ease: 'power3.out',
          scrollTrigger: once(el, 'top 88%'),
        });
      });

      // Rule cards surface from depth, one after another.
      ScrollTrigger.batch('.rule', {
        start: 'top 88%', once: true,
        onEnter: (els) => gsap.from(els, {
          opacity: 0, y: 90, z: -160, rotateX: -28, transformPerspective: 1000, transformOrigin: '50% 100%',
          duration: 1.4, ease: 'expo.out', stagger: 0.12,
        }),
      });

      // Stat dividers draw before the numbers count up.
      gsap.utils.toArray<HTMLElement>('.stat').forEach((el, i) => {
        gsap.from(el, { opacity: 0, y: 30, duration: 1.1, delay: i * 0.1, ease: 'power3.out', scrollTrigger: once(el, 'top 92%') });
      });
      gsap.from('.stats__rule', { scaleX: 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: once(document.querySelector('.stats')!, 'top 90%') });

      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count);
        const v = { n: 0 };
        gsap.to(v, {
          n: end, duration: 2.2, ease: 'power3.out',
          scrollTrigger: once(el, 'top 92%'),
          onUpdate: () => { el.textContent = Math.round(v.n).toLocaleString('en-IN'); },
        });
      });
    });
    return () => ctx.revert();
  }, [reducedMotion]);

  const chapterLabel = CHAPTERS.find((c) => c.id === chapter)?.label ?? '';

  return (
    <>
      <SmoothScroll reducedMotion={reducedMotion} />
      <a className="skip" href="#about">Skip to content</a>
      <OceanStage reducedMotion={reducedMotion} onReady={onSceneReady} />
      <Navbar visible={phase === 'ready'} active={chapter} />
      <DepthGauge visible={phase === 'ready'} chapter={chapterLabel} />
      <Cursor enabled={finePointer && !reducedMotion} />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main>
            <Hero play={phase !== 'loading'} reducedMotion={reducedMotion} />
            <div className="depths">
              <TheCall />
              <Rules />
              <Voyage />
              <SetSail />
            </div>
          </main>
          <SiteFooter />
        </div>
      </div>
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
