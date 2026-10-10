import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event } from '../event.config';
import { OceanScene, pickArt } from '../scene/OceanScene';
import RegisterButton from './RegisterButton';
import Countdown from './home/Countdown';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  /** Starts the camera move — fired as the loader opens. */
  play: boolean;
  reducedMotion: boolean;
  onReady: () => void;
}

const WORDS = event.name.split(' ');

/**
 * Pinned opening shot built on the supplied key art (public/assets/odyssey-bg-*.jpg).
 * Intro (time-based): the frame opens on the waterline in close-up, then the camera
 * dollies back and settles to reveal helmet, hull and the red-sailed ship.
 * Scroll (scrubbed): the camera sinks beneath the surface, past the hull and into the abyss.
 */
export default function Hero({ play, reducedMotion, onReady }: Props) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<OceanScene | null>(null);
  const [fallback, setFallback] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState(() => pickArt(window.innerWidth, window.innerHeight).src);
  // Camera = intro pose (time-based) composed with the scroll pose (scrubbed).
  const intro = useRef({ camY: -0.04, zoom: 1.85, roll: 0.045, exposure: 0 });
  const scroll = useRef({ camY: 0, zoom: 1, dive: 0 });
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // ---- Scene lifecycle --------------------------------------------------------
  useEffect(() => {
    const el = canvas.current!;
    let s: OceanScene;
    try {
      s = new OceanScene(el, !reducedMotion);
    } catch (err) {
      console.warn('WebGL scene unavailable, using the still image.', err);
      setFallback(true);
      const img = new Image();
      img.onload = img.onerror = () => onReadyRef.current();
      img.src = fallbackSrc;
      return;
    }
    scene.current = s;
    s.resize();
    s.load(pickArt(window.innerWidth, window.innerHeight)).then(() => onReadyRef.current(), () => onReadyRef.current());

    const compose = () => {
      const st = s.state, a = intro.current, b = scroll.current;
      st.camY = a.camY + b.camY;
      st.zoom = a.zoom * b.zoom;
      st.roll = a.roll;
      st.exposure = a.exposure;
      st.dive = b.dive;
    };
    gsap.ticker.add(compose);

    const onResize = () => {
      s.resize();
      s.load(pickArt(window.innerWidth, window.innerHeight));
    };
    window.addEventListener('resize', onResize);

    // Only render while the stage (including its pinned scroll distance) is on screen and the tab is visible.
    const sync = () => {
      const box = (root.current?.parentElement ?? el).getBoundingClientRect();
      if (box.bottom > 0 && !document.hidden) s.play(); else s.pause();
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    document.addEventListener('visibilitychange', sync);

    return () => {
      gsap.ticker.remove(compose);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', sync);
      document.removeEventListener('visibilitychange', sync);
      s.destroy();
      scene.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    if (!fallback) return;
    const onResize = () => setFallbackSrc(pickArt(window.innerWidth, window.innerHeight).src);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fallback]);

  // ---- Scroll: the descent ------------------------------------------------------
  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current, start: 'top top', end: '+=230%',
          pin: true, scrub: 1.2, invalidateOnRefresh: true,
        },
      });
      tl.to(scroll.current, { camY: 0.5, zoom: 1.24, duration: 1, ease: 'power1.inOut' }, 0)
        .to(scroll.current, { dive: 1, duration: 0.9, ease: 'power1.in' }, 0.1)
        .to(q('.hero__copy'), { yPercent: -35, opacity: 0, filter: 'blur(10px)', duration: 0.24, ease: 'power1.in' }, 0)
        .to(q('.hero__meta'), { y: 40, opacity: 0, duration: 0.16, ease: 'power1.in' }, 0)
        .to(q('.hero__cue'), { opacity: 0, duration: 0.06 }, 0)
        .fromTo(q('.hero__abyss'), { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.in' }, 0.75);

      q('.hero__chapter').forEach((el, i) => {
        const at = 0.34 + i * 0.32;
        tl.fromTo(el, { opacity: 0, y: 50, filter: 'blur(12px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.12, ease: 'power2.out' }, at)
          .fromTo(el.querySelector('.hero__chapter-line'), { letterSpacing: '0.9em' }, { letterSpacing: '0.34em', duration: 0.22, ease: 'power2.out' }, at)
          .to(el, { opacity: 0, y: -50, filter: 'blur(12px)', duration: 0.1, ease: 'power2.in' }, at + 0.2);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // ---- Intro: the opening camera move ---------------------------------------------
  useLayoutEffect(() => {
    if (!play) return;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      const a = intro.current;
      if (reducedMotion) {
        Object.assign(a, { camY: 0, zoom: 1, roll: 0 });
        gsap.to(a, { exposure: 1, duration: 0.8 });
        gsap.from(q('.hero__copy, .hero__meta, .hero__cue'), { opacity: 0, duration: 0.8, delay: 0.2 });
        return;
      }
      gsap.timeline()
        .to(a, { exposure: 1, duration: 1.2, ease: 'power1.out' }, 0)
        .to(a, { zoom: 1, camY: 0, duration: 4.2, ease: 'power3.inOut' }, 0)
        .to(a, { roll: 0, duration: 4.6, ease: 'power2.out' }, 0)
        .from(q('.hero__by'), { opacity: 0, y: 16, letterSpacing: '0.9em', duration: 1.4, ease: 'power3.out' }, 2.3)
        .from(q('.hero__char'), {
          opacity: 0, rotateX: -95, z: -260, y: 40, filter: 'blur(10px)',
          duration: 1.6, ease: 'expo.out', stagger: { each: 0.055, from: 'center' },
        }, 2.5)
        .from(q('.hero__title'), { letterSpacing: '0.85em', duration: 2.4, ease: 'expo.out' }, 2.5)
        .from(q('.hero__edition'), { opacity: 0, scale: 1.6, filter: 'blur(14px)', duration: 1.4, ease: 'expo.out' }, 3.2)
        .from(q('.hero__rule'), { scaleX: 0, duration: 1.2, ease: 'expo.inOut' }, 3.3)
        .from(q('.hero__meta > *'), { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.12 }, 3.6)
        .from(q('.hero__cue'), { opacity: 0, duration: 1 }, 4.4);
    }, root);
    return () => ctx.revert();
  }, [play, reducedMotion]);

  return (
    <section id="home" className={`hero ${play ? 'is-playing' : ''}`} ref={root} aria-label={`${event.name} ${event.edition}`}>
      <div className="hero__stage">
        <canvas ref={canvas} className="hero__canvas" aria-hidden="true" hidden={fallback} />
        {fallback && <img className="hero__fallback" src={fallbackSrc} alt="" />}
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__abyss" aria-hidden="true" />

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

        <a href="#about" className="hero__cue"><span>Scroll to dive</span><i aria-hidden="true" /></a>
      </div>
    </section>
  );
}
