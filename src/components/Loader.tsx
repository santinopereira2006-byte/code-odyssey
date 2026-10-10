import { useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { event } from '../event.config';

const TITLE = `${event.name} ${event.edition}`;
const R = 34;
const C = 2 * Math.PI * R;

interface Props {
  /** True once the scene artwork and fonts are ready. */
  ready: boolean;
  /** Shorter hold for repeat visits within a session. */
  quick: boolean;
  reducedMotion: boolean;
  /** Fired when the shutters start to open — the scene's camera move begins here. */
  onReveal: () => void;
  onDone: () => void;
}

/**
 * Title card in the style of the reference teaser: black field, steel-blue
 * Montserrat with very wide tracking, a ring spinner and "(LOADING)".
 * Exit: the type dissolves, the ring collapses, a line of light is drawn across
 * the horizon and the frame opens along it onto the sea.
 */
export default function Loader({ ready, quick, reducedMotion, onReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const progress = useRef({ p: 0 });
  const minDone = useRef(false);
  const exiting = useRef(false);
  const readyRef = useRef(ready);
  const cbs = useRef({ onReveal, onDone });
  cbs.current = { onReveal, onDone };

  const drawArc = () => {
    const f = 0.16 + 0.84 * progress.current.p;
    arc.current?.setAttribute('stroke-dasharray', `${C * f} ${C}`);
  };

  const exit = () => {
    if (exiting.current) return;
    exiting.current = true;
    const q = gsap.utils.selector(root);
    if (reducedMotion) {
      cbs.current.onReveal();
      gsap.to(root.current, { opacity: 0, duration: 0.6, onComplete: () => cbs.current.onDone() });
      return;
    }
    gsap.timeline({ onComplete: () => cbs.current.onDone() })
      .to(progress.current, { p: 1, duration: 0.45, ease: 'power2.out', onUpdate: drawArc })
      .to(q('.loader__title'), { letterSpacing: '0.95em', opacity: 0, filter: 'blur(14px)', duration: 1, ease: 'power2.in' }, '+=0.1')
      .to(q('.loader__by, .loader__date'), { opacity: 0, filter: 'blur(10px)', y: (i) => (i ? 14 : -14), duration: 0.8, ease: 'power2.in' }, '<0.05')
      .to(q('.loader__status'), { opacity: 0, letterSpacing: '0.7em', duration: 0.5 }, '<')
      .to(q('.loader__ring'), { scale: 0.08, opacity: 0, duration: 0.7, ease: 'back.in(2)' }, '<0.1')
      .fromTo(q('.loader__line'), { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, '-=0.25')
      .fromTo(q('.loader__flare'), { scaleX: 0.1, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.7, ease: 'power2.out' }, '<0.1')
      .add(() => cbs.current.onReveal(), '-=0.35')
      .to(q('.loader__shutter--top'), { yPercent: -100, duration: 1.5, ease: 'expo.inOut' }, '-=0.35')
      .to(q('.loader__shutter--bottom'), { yPercent: 100, duration: 1.5, ease: 'expo.inOut' }, '<')
      .to(q('.loader__line'), { scaleY: 18, opacity: 0, duration: 1.1, ease: 'power2.out' }, '<0.25')
      .to(q('.loader__flare'), { scaleX: 1.6, opacity: 0, duration: 1.2, ease: 'power2.out' }, '<');
  };

  // Entrance: letters surface one by one out of the dark.
  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    drawArc();
    const min = quick ? 1.2 : 3.4;
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.from(q('.loader__block, .loader__progress'), { opacity: 0, duration: 0.6 });
      } else {
        gsap.timeline()
          .from(q('.loader__char'), {
            opacity: 0, y: 10, rotateX: -80, filter: 'blur(8px)',
            duration: 1.1, ease: 'power3.out', stagger: quick ? 0.025 : 0.06,
          }, 0.15)
          .fromTo(q('.loader__title'), { letterSpacing: '0.8em' }, { letterSpacing: '0.42em', duration: quick ? 1.2 : 2.2, ease: 'power3.out' }, 0.15)
          .from(q('.loader__by, .loader__date'), { opacity: 0, y: (i) => (i ? -6 : 6), duration: 0.9, ease: 'power2.out' }, quick ? 0.3 : 0.7)
          .from(q('.loader__progress'), { opacity: 0, duration: 0.8 }, quick ? 0.4 : 1.0);
      }
      gsap.to(progress.current, { p: 0.82, duration: min, ease: 'power1.out', onUpdate: drawArc });
      gsap.delayedCall(min, () => {
        minDone.current = true;
        if (readyRef.current) exit();
      });
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    readyRef.current = ready;
    if (ready && minDone.current) exit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className="loader" ref={root} role="status" aria-live="polite" aria-label={`Loading ${TITLE}`}>
      <div className="loader__shutter loader__shutter--top" />
      <div className="loader__shutter loader__shutter--bottom" />
      <div className="loader__line" aria-hidden="true" />
      <div className="loader__flare" aria-hidden="true" />

      <div className="loader__block" aria-hidden="true">
        <p className="loader__by">A Hackathon by <b>{event.organizer.name}</b></p>
        <p className="loader__title">
          {TITLE.split('').map((ch, i) => (
            <span key={i} className="loader__char">{ch === ' ' ? ' ' : ch}</span>
          ))}
        </p>
        <p className="loader__date">{event.loaderDate}</p>
      </div>

      <div className="loader__progress" aria-hidden="true">
        <svg className="loader__ring" viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r={R} className="loader__track" />
          <circle ref={arc} cx="40" cy="40" r={R} className="loader__arc" />
        </svg>
        <p className="loader__status">(Loading)</p>
      </div>
    </div>
  );
}
