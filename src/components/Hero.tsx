import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { event } from '../event.config';
import {
  BACKPLATE, BREAK_LINE, FRAGMENTS, H, POSTER_WIDE, SEAMS, SHIP_MIST, SHIP_SEA_PATCH, TEXT_PATCHES, W,
  cloneStyle, featherStyle, polygon, rectStyle, type Patch, type Pt,
} from '../poster';

function PatchView({ p }: { p: Patch }) {
  return (
    <div className="patch" style={{ ...rectStyle(p.dst), ...featherStyle(p.fx, p.fy) }}>
      <img src={POSTER_WIDE} alt="" style={cloneStyle(p.src)} />
    </div>
  );
}

/** The supplied poster with its film lettering painted out. Reused by every layer. */
export function PosterArt({ onLoad }: { onLoad?: () => void }) {
  return (
    <>
      <img className="poster-img" src={POSTER_WIDE} alt="" onLoad={onLoad} />
      {TEXT_PATCHES.map((p, i) => <PatchView key={i} p={p} />)}
    </>
  );
}

const centre = (pts: Pt[]) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return `${((Math.min(...xs) + Math.max(...xs)) / 2 / W) * 100}% ${((Math.min(...ys) + Math.max(...ys)) / 2 / H) * 100}%`;
};

const [bx, , bw] = BACKPLATE.dst;
const backplateClip = polygon([
  [bx, 0], [bx + bw, 0], [bx + bw, BREAK_LINE[0][1]], ...BREAK_LINE, [bx, BREAK_LINE[BREAK_LINE.length - 1][1]],
]);

/**
 * Full-screen loading screen, played once when the page opens. Built only from the supplied poster:
 * 1. camera push while the ship emerges from the mist (bottom first),
 * 2. the helmet splits along its own collage panels and drifts apart,
 * 3. CODE · ODYSSEY · 5.0 · Powered by TATA STRIVE surface one by one, 4. hold, then fade out.
 *
 * With reduced motion it shows the settled final frame briefly. `onDone` fires once the
 * screen has faded and the page underneath is ready to use.
 */
export default function Hero({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  const exitRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    const q = gsap.utils.selector(root);
    let exited = false;
    const exit = () => {
      if (exited) return;
      exited = true;
      setLeaving(true);
      gsap.to(root.current, { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut', onComplete: () => done.current() });
    };

    exitRef.current = exit;

    try {
      mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
        if (ctx.conditions?.reduce) {
          const t = gsap.delayedCall(1.6, exit);
          return () => t.kill();
        }
        const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true, onComplete: exit });
        tlRef.current = tl;

        // Ambient motion across the whole sequence.
        tl.fromTo(q('.hero__sea'), { xPercent: 0, scaleY: 1 }, { xPercent: -0.9, scaleY: 1.035, duration: 11.6 }, 0)
          .fromTo(q('.hero__mist--a'), { xPercent: -5 }, { xPercent: 5, duration: 11.6 }, 0)
          .fromTo(q('.hero__mist--b'), { xPercent: 4 }, { xPercent: -6, duration: 11.6 }, 0);

        // 1 — camera push; the ship emerges from the mist, hull first.
        tl.fromTo(q('.hero__camera'), { scale: 1 }, { scale: 1.1, duration: 3.4, ease: 'power1.inOut' }, 0)
          .fromTo(q('.ship-veil'), { '--reveal': '-32%' }, { '--reveal': '100%', duration: 2.8, ease: 'power1.inOut' }, 0.3)
          .fromTo(q('.ship-veil__mist'), { xPercent: 0 }, { xPercent: 9, duration: 2.8 }, 0.3);

        // 2 — light through the seams, then the helmet separates along its panels.
        tl.fromTo(q('.hero__seams'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 3.1)
          .to(q('.hero__seams'), { opacity: 0, duration: 0.8 }, 3.8)
          .fromTo(q('.hero__backplate'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 3.6)
          .to(q('.hero__camera'), { scale: 1.16, duration: 3.6, ease: 'power1.inOut' }, 3.6)
          .fromTo(q('.hero__haze'), { opacity: 0 }, { opacity: 0.75, duration: 2.4 }, 5);
        FRAGMENTS.forEach((f) => {
          const el = q(`[data-frag="${f.id}"]`);
          const at = 3.6 + f.at;
          tl.fromTo(el, { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, opacity: 1 },
            { xPercent: (f.x / W) * 100, yPercent: (f.y / H) * 100, rotation: f.r, scale: f.s, duration: 2.6, ease: 'power2.in' }, at)
            .to(el, { opacity: 0, duration: 1.1, ease: 'power1.in' }, at + 1.5);
        });

        // 3 — identity, one element at a time.
        tl.to(q('.hero__camera'), { scale: 1.08, duration: 3.2, ease: 'power1.inOut' }, 7.2);
        const hidden = { opacity: 0, y: 28, scaleX: 1.22, filter: 'blur(8px)' };
        const shown = { opacity: 1, y: 0, scaleX: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' };
        tl.fromTo(q('[data-w="code"]'), hidden, shown, 7.2)
          .fromTo(q('[data-w="odyssey"]'), hidden, shown, 7.9)
          .fromTo(q('[data-w="edition"]'), hidden, shown, 8.6)
          .fromTo(q('.hero__rule'), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.8 }, 9.1)
          .fromTo(q('.hero__powered'), { opacity: 0, y: 14, filter: 'blur(6px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 9.2)
          .fromTo(q('.hero__org'), { opacity: 0, y: 10, letterSpacing: '1.1em' },
            { opacity: 1, y: 0, letterSpacing: '0.55em', duration: 0.9, ease: 'power2.out' }, 9.7);

        // 4 — hold the final frame, then hand over to the page.
        tl.to({}, { duration: 1.6 }, 10.6);

        // Wait for the poster before playing, so the first frames are not blank.
        const img = root.current?.querySelector<HTMLImageElement>('.poster-img');
        const play = () => tl.timeScale(1.75).play();
        if (!img || img.complete) play();
        else { img.addEventListener('load', play, { once: true }); img.addEventListener('error', play, { once: true }); }
        return () => { tlRef.current = null; };
      });
    } catch (err) {
      console.error('Loading animation disabled:', err); // fall back to a short static frame
      const t = gsap.delayedCall(1.2, exit);
      return () => { t.kill(); mm.revert(); };
    }

    return () => mm.revert();
  }, []);

  const skip = () => {
    if (tlRef.current) tlRef.current.progress(1);
    else exitRef.current();
  };

  return (
    <div className={`hero loader ${leaving ? 'is-leaving' : ''}`} ref={root} role="status" aria-label={`Loading ${event.name} ${event.edition}`}>
      <div className="hero__stage">
        <div className="hero__camera">
          <div className="layer">
            <PosterArt />
            <div className="ship-veil">
              <PatchView p={SHIP_SEA_PATCH} />
              <div className="ship-veil__mist" style={rectStyle(SHIP_MIST)}>
                <img src={POSTER_WIDE} alt="" style={cloneStyle(SHIP_MIST)} />
              </div>
            </div>
          </div>

          <div className="layer hero__sea" aria-hidden="true"><PosterArt /></div>

          <div className="layer hero__backplate" style={{ clipPath: backplateClip }} aria-hidden="true">
            <div className="hero__backplate-sky" style={rectStyle(BACKPLATE.dst)}>
              <img src={POSTER_WIDE} alt="" style={cloneStyle(BACKPLATE.src)} />
            </div>
          </div>

          {FRAGMENTS.map((f) => (
            <div
              key={f.id}
              data-frag={f.id}
              className="layer hero__frag"
              style={{ clipPath: polygon(f.pts), transformOrigin: centre(f.pts) } as CSSProperties}
              aria-hidden="true"
            >
              <PosterArt />
            </div>
          ))}

          <div className="hero__haze" aria-hidden="true" />
          <svg className="hero__seams" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            {SEAMS.map((s, i) => <polyline key={i} points={s.map((p) => p.join(',')).join(' ')} />)}
          </svg>
        </div>

        <div className="hero__mist hero__mist--a" aria-hidden="true" />
        <div className="hero__mist hero__mist--b" aria-hidden="true" />

        <div className="hero__brand">
          <p className="hero__title">
            <span className="sr-only">{event.name} {event.edition}</span>
            <span aria-hidden="true" className="hero__words">
              <span data-w="code">CODE</span>
              <span data-w="odyssey">ODYSSEY</span>
              <span data-w="edition" className="hero__edition">{event.edition}</span>
            </span>
          </p>
          <span className="hero__rule" aria-hidden="true" />
          <p className="hero__powered">
            <img src={event.poweredBy.logo} alt="" width={225} height={225} />
            <span>Powered by <strong>{event.poweredBy.name}</strong></span>
          </p>
          <p className="hero__org">{event.organizer.name}</p>
        </div>
      </div>

      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__vignette" aria-hidden="true" />
      <button type="button" className="loader__skip" onClick={skip}>Skip intro</button>
    </div>
  );
}
