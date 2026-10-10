import { useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event } from '../event.config';
import { ART, pickArt } from '../scene/OceanScene';
import { rig } from '../scene/rig';
import { scrollToHash } from '../lib/scroll';
import RegisterButton from './RegisterButton';
import Countdown from './home/Countdown';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  /** Starts the camera move — fired as the loader opens. */
  play: boolean;
  reducedMotion: boolean;
}

const WORDS = event.name.split(' ');

/** Points of interest pinned to the artwork itself (image uv per art profile). */
const HOTSPOTS = [
  { id: 'ship', href: '#voyage', depth: 0.3, uv: { wide: [0.39, 0.3], tall: [0.2, 0.31] },
    kicker: 'The Voyage', title: '17 — 18 October', body: 'Two days at sea. Follow the course from registration to the hackathon.' },
  { id: 'helmet', href: '#about', depth: 0.95, uv: { wide: [0.5, 0.355], tall: [0.5, 0.36] },
    kicker: 'The Call', title: `${event.prizePool} prize pool`, body: 'Winners also get a shot at a TATA STRIVE internship.' },
  { id: 'sea', href: '#rules', depth: 0.55, uv: { wide: [0.8, 0.43], tall: [0.76, 0.43] },
    kicker: 'Rules of the Sea', title: 'Crews of four', body: 'KJSIT TY & LY only, with at least one female crew member.' },
] as const;

/**
 * Pinned opening shot. The WebGL ocean lives in <OceanStage>; the hero directs its camera:
 * Intro (time-based): the frame opens on the waterline in close-up, racks focus to the helmet
 * and dollies back to reveal helmet, hull and the red-sailed ship.
 * Scroll (scrubbed): letterbox in, the camera sinks beneath the surface, past the hull, into the abyss.
 */
export default function Hero({ play, reducedMotion }: Props) {
  const root = useRef<HTMLElement>(null);
  const spots = useRef<(HTMLAnchorElement | null)[]>([]);
  const lastRipple = useRef({ t: 0, x: 0, y: 0 });

  // ---- Hotspots follow the camera; the title block floats with the pointer ---------
  useEffect(() => {
    const words = root.current!.querySelector('.hero__words');
    const copy = root.current!.querySelector('.hero__copy');
    gsap.set(words, { transformPerspective: 1100 });
    const tiltX = gsap.quickTo(words, 'rotationY', { duration: 1.2, ease: 'power3.out' });
    const tiltY = gsap.quickTo(words, 'rotationX', { duration: 1.2, ease: 'power3.out' });
    const shift = gsap.quickTo(copy, 'x', { duration: 1.4, ease: 'power3.out' });

    const tick = () => {
      const s = rig.scene;
      const key = pickArt(window.innerWidth, window.innerHeight) === ART.tall ? 'tall' : 'wide';
      const vis = Math.max(0, 1 - rig.scroll.dive * 12);
      HOTSPOTS.forEach((h, i) => {
        const el = spots.current[i];
        if (!el) return;
        const [u, v] = h.uv[key];
        const [x, y] = s ? s.imageToScreen(u, v, h.depth) : [u, v];
        el.style.transform = `translate3d(${(x * window.innerWidth).toFixed(1)}px, ${(y * window.innerHeight).toFixed(1)}px, 0)`;
        el.style.setProperty('--vis', vis.toFixed(3));
        el.classList.toggle('is-flipped', x > 0.62);
        el.tabIndex = vis > 0.5 ? 0 : -1;
      });
    };
    gsap.ticker.add(tick);

    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'mouse' || reducedMotion || rig.scroll.dive > 0.2) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tiltX(nx * 9);
      tiltY(-ny * 6);
      shift(-nx * 18);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onMove);
    };
  }, [reducedMotion]);

  // ---- Scroll: the descent ------------------------------------------------------
  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      const cam = rig.scroll;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: '+=240%',
          pin: true, scrub: 1.4, invalidateOnRefresh: true,
        },
      });
      tl.to(cam, { camY: 0.5, zoom: 1.24, duration: 1, ease: 'power2.inOut' }, 0)
        .to(cam, { dive: 1, duration: 0.9, ease: 'power1.in' }, 0.1)
        .to(cam, { focus: 0.95, glow: 1, duration: 0.5 }, 0.05)
        .to(cam, { lantern: 1, duration: 0.3 }, 0.2)
        .fromTo(q('.hero__bar'), { scaleY: 0 }, { scaleY: 1, duration: 0.18, ease: 'power2.out' }, 0.04)
        .to(q('.hero__bar'), { scaleY: 0, duration: 0.14, ease: 'power2.in' }, 0.86)
        .to(q('.hero__copy'), { yPercent: -40, opacity: 0, filter: 'blur(12px)', duration: 0.24, ease: 'power1.in' }, 0)
        .to(q('.hero__by, .hero__edition'), { letterSpacing: '1.2em', duration: 0.24, ease: 'power1.in' }, 0)
        .to(q('.hero__meta'), { y: 50, opacity: 0, duration: 0.16, ease: 'power1.in' }, 0)
        .to(q('.hero__cue'), { opacity: 0, duration: 0.06 }, 0)
        .fromTo(q('.hero__depth'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.18)
        .to(q('.hero__depth'), { opacity: 0, duration: 0.08 }, 0.9);

      q('.hero__chapter').forEach((el, i) => {
        const at = 0.32 + i * 0.3;
        const line = el.querySelector('.hero__chapter-line');
        const kicker = el.querySelector('.hero__chapter-kicker');
        tl.fromTo(el, { opacity: 0, y: 60, filter: 'blur(14px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.12, ease: 'power3.out' }, at)
          .fromTo(line, { letterSpacing: '0.9em', scale: 1.08 }, { letterSpacing: '0.3em', scale: 1, duration: 0.24, ease: 'power2.out' }, at)
          .fromTo(kicker, { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 0.12, ease: 'power2.out' }, at + 0.02)
          .to(el, { opacity: 0, y: -60, filter: 'blur(14px)', duration: 0.1, ease: 'power2.in' }, at + 0.2);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // ---- Intro: the opening camera move ---------------------------------------------
  useLayoutEffect(() => {
    if (!play) return;
    const q = gsap.utils.selector(root);
    const a = rig.intro;
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        Object.assign(a, { camY: 0, zoom: 1, roll: 0, dof: 0, focus: 0.95 });
        gsap.to(a, { exposure: 1, duration: 0.8 });
        gsap.from(q('.hero__copy, .hero__meta, .hero__cue, .hotspot'), { opacity: 0, duration: 0.8, delay: 0.2 });
        return;
      }
      gsap.timeline()
        .to(a, { exposure: 1, duration: 1.4, ease: 'power1.out' }, 0)
        .to(a, { zoom: 1, camY: 0, duration: 4.4, ease: 'power3.inOut' }, 0)
        .to(a, { roll: 0, duration: 4.8, ease: 'power2.out' }, 0)
        // rack focus: from the waterline to the helmet, then the lens settles
        .to(a, { focus: 0.95, duration: 1.8, ease: 'power2.inOut' }, 0.5)
        .to(a, { dof: 0, duration: 2.6, ease: 'power2.inOut' }, 1.6)
        .from(q('.hero__by'), { opacity: 0, y: 16, letterSpacing: '0.9em', duration: 1.4, ease: 'power3.out' }, 2.3)
        .from(q('.hero__char'), {
          opacity: 0, rotateX: -95, z: -260, y: 40, filter: 'blur(10px)',
          duration: 1.6, ease: 'expo.out', stagger: { each: 0.055, from: 'center' },
        }, 2.5)
        .from(q('.hero__title'), { letterSpacing: '0.85em', duration: 2.4, ease: 'expo.out' }, 2.5)
        .from(q('.hero__edition'), { opacity: 0, scale: 1.6, filter: 'blur(14px)', duration: 1.4, ease: 'expo.out' }, 3.2)
        .from(q('.hero__rule'), { scaleX: 0, duration: 1.2, ease: 'expo.inOut' }, 3.3)
        .from(q('.hero__meta > *'), { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.12 }, 3.6)
        .from(q('.hotspot__inner'), { opacity: 0, scale: 0.2, duration: 0.9, ease: 'back.out(2.2)', stagger: 0.18 }, 4.2)
        .from(q('.hero__cue'), { opacity: 0, duration: 1 }, 4.4);
    }, root);
    return () => ctx.revert();
  }, [play, reducedMotion]);

  // A touch on the water sends a ripple; a sweep of the mouse leaves a faint wake.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    rig.scene?.ripple(e.clientX, e.clientY, 1);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const l = lastRipple.current;
    const now = performance.now();
    if (now - l.t > 380 && Math.hypot(e.clientX - l.x, e.clientY - l.y) > 60) {
      rig.scene?.ripple(e.clientX, e.clientY, 0.35);
      Object.assign(l, { t: now, x: e.clientX, y: e.clientY });
    }
  };

  return (
    <section id="home" className={`hero ${play ? 'is-playing' : ''}`} ref={root} aria-label={`${event.name} ${event.edition}`}>
      <div className="hero__stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
        <div className="hero__shade" aria-hidden="true" />
        <span className="hero__bar hero__bar--top" aria-hidden="true" />
        <span className="hero__bar hero__bar--bottom" aria-hidden="true" />

        <nav className="hotspots" aria-label="Explore the scene">
          {HOTSPOTS.map((h, i) => (
            <a
              key={h.id}
              ref={(el) => { spots.current[i] = el; }}
              className="hotspot"
              href={h.href}
              data-cursor="Explore"
              onClick={(e) => {
                e.preventDefault();
                rig.scene?.ripple(e.clientX, e.clientY, 1.4);
                scrollToHash(h.href);
              }}
            >
              <span className="hotspot__inner">
                <span className="hotspot__dot" aria-hidden="true" />
                <span className="hotspot__card">
                  <span className="hotspot__kicker">{h.kicker}</span>
                  <span className="hotspot__title">{h.title}</span>
                  <span className="hotspot__body">{h.body}</span>
                </span>
              </span>
            </a>
          ))}
        </nav>

        <div className="hero__copy">
          <p className="hero__by">A Hackathon by <b>{event.organizer.name}</b></p>
          <h1 className="hero__title">
            <span className="sr-only">{event.name} {event.edition}</span>
            <span aria-hidden="true" className="hero__words">
              {WORDS.map((w, wi) => (
                <span key={w} className="hero__word">
                  {w.split('').map((ch, i) => <span key={i} className="hero__char">{ch}</span>)}
                  {wi < WORDS.length - 1 && <span className="hero__gap"> </span>}
                </span>
              ))}
            </span>
          </h1>
          <span className="hero__rule" aria-hidden="true" />
          <p className="hero__edition" aria-hidden="true">{event.edition}</p>
        </div>

        <div className="hero__meta">
          <p className="hero__date">{event.heroDate}</p>
          <p className="hero__prize"><span>Prize pool</span> <b>{event.prizePool}</b> <i aria-hidden="true">·</i> <span>TATA STRIVE internship opportunity</span></p>
          <div className="hero__actions">
            <RegisterButton className="btn--solid" label="Register now" />
            <a className="btn btn--ghost" href="#about">Explore the voyage</a>
          </div>
          <Countdown />
        </div>

        <p className="hero__chapter" aria-hidden="true">
          <span className="hero__chapter-kicker">Beneath the surface</span>
          <span className="hero__chapter-line">Every great journey begins with the unknown</span>
        </p>
        <p className="hero__chapter" aria-hidden="true">
          <span className="hero__chapter-kicker">Into the deep</span>
          <span className="hero__chapter-line">Two days. Four crew. One odyssey.</span>
        </p>
        <p className="hero__depth" aria-hidden="true"><span className="on-fine">Move your cursor to light the deep</span><span className="on-coarse">Touch the water to light the deep</span></p>

        <a href="#about" className="hero__cue" data-cursor="Dive"><span>Scroll to dive</span><i aria-hidden="true" /></a>
      </div>
    </section>
  );
}
