import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event } from '../event.config';
import {
  BACKPLATE, BREAK_LINE, FRAGMENTS, H, POSTER_WIDE, SEAMS, SHIP_MIST, SHIP_SEA_PATCH, TEXT_PATCHES, W,
  cloneStyle, featherStyle, polygon, rectStyle, type Patch, type Pt,
} from '../poster';

gsap.registerPlugin(ScrollTrigger);

function PatchView({ p }: { p: Patch }) {
  return (
    <div className="patch" style={{ ...rectStyle(p.dst), ...featherStyle(p.fx, p.fy) }}>
      <img src={POSTER_WIDE} alt="" style={cloneStyle(p.src)} />
    </div>
  );
}

/** The supplied poster with its film lettering painted out. Reused by every layer. */
function PosterArt({ onLoad }: { onLoad?: () => void }) {
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
 * Pinned, scroll-scrubbed title sequence built only from the supplied poster:
 * 1. camera push while the ship emerges from the mist (bottom first),
 * 2. the helmet splits along its own collage panels and drifts apart,
 * 3. CODE · ODYSSEY · 5.0 · CSI KJSIT surface one by one,
 * 4. a short hold, then the camera pushes in on the ship as dusk falls and the
 *    poster dissolves into the live WebGL sea of the About section.
 *
 * Timeline units are relative: the whole sequence is stretched over `end` of scroll,
 * so pacing is tuned here and overall speed via SCROLL_DESKTOP / SCROLL_MOBILE.
 * Without JS or with reduced motion, CSS renders the settled title frame.
 */
const SCROLL_DESKTOP = '+=360%';
const SCROLL_MOBILE = '+=280%';

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    const mm = gsap.matchMedia();
    try {
      mm.add({
        motion: '(prefers-reduced-motion: no-preference)',
        mobile: '(max-width: 820px)',
      }, (ctx) => {
        const { motion, mobile } = ctx.conditions as { motion: boolean; mobile: boolean };
        if (!motion) return;
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            id: 'hero', trigger: root.current, start: 'top top', end: mobile ? SCROLL_MOBILE : SCROLL_DESKTOP,
            pin: true, scrub: 0.6, invalidateOnRefresh: true,
          },
        });
        const TOTAL = 9.8;

        // Ambient motion across the whole sequence.
        tl.fromTo(q('.hero__sea'), { xPercent: 0, scaleY: 1 }, { xPercent: -0.9, scaleY: 1.035, duration: TOTAL }, 0)
          .fromTo(q('.hero__mist--a'), { xPercent: -5 }, { xPercent: 5, duration: TOTAL }, 0)
          .fromTo(q('.hero__mist--b'), { xPercent: 4 }, { xPercent: -6, duration: TOTAL }, 0)
          .fromTo(q('.hero__cue'), { opacity: 1, y: 0 }, { opacity: 0, y: 12, duration: 0.4 }, 0);

        // 1 — camera push; the ship emerges from the mist, hull first.
        tl.fromTo(q('.hero__camera'), { scale: 1, yPercent: 0 }, { scale: 1.1, duration: 2.4, ease: 'power1.inOut' }, 0)
          .fromTo(q('.ship-veil'), { '--reveal': '-32%' }, { '--reveal': '100%', duration: 2.1, ease: 'power1.inOut' }, 0.1)
          .fromTo(q('.ship-veil__mist'), { xPercent: 0 }, { xPercent: 9, duration: 2.1 }, 0.1);

        // 2 — light through the seams, then the helmet separates along its panels.
        const BREAK = 2.3;
        tl.fromTo(q('.hero__seams'), { opacity: 0 }, { opacity: 1, duration: 0.35 }, BREAK - 0.3)
          .to(q('.hero__seams'), { opacity: 0, duration: 0.5 }, BREAK + 0.15)
          // Backplate fades in under the still-closed fragments so its edge never pops.
          .fromTo(q('.hero__backplate'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, BREAK - 0.3)
          .to(q('.hero__camera'), { scale: 1.16, duration: 2.4, ease: 'power1.inOut' }, BREAK)
          .fromTo(q('.hero__haze'), { opacity: 0 }, { opacity: 0.75, duration: 1.6 }, BREAK + 1.1);
        FRAGMENTS.forEach((f) => {
          const el = q(`[data-frag="${f.id}"]`);
          const at = BREAK + f.at * 0.6;
          tl.fromTo(el, { xPercent: 0, yPercent: 0, rotation: 0, scale: 1, opacity: 1 },
            { xPercent: (f.x / W) * 100, yPercent: (f.y / H) * 100, rotation: f.r, scale: f.s, duration: 1.9, ease: 'sine.in' }, at)
            .to(el, { opacity: 0, duration: 0.85, ease: 'power1.in' }, at + 0.95);
        });

        // 3 — identity, one element at a time, as the last fragments clear.
        const ID = 4.5;
        tl.to(q('.hero__camera'), { scale: 1.08, duration: 2.2, ease: 'power1.inOut' }, ID);
        const hidden = { opacity: 0, y: 28, scaleX: 1.22, filter: 'blur(6px)' };
        const shown = { opacity: 1, y: 0, scaleX: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' };
        tl.fromTo(q('[data-w="code"]'), hidden, shown, ID)
          .fromTo(q('[data-w="odyssey"]'), hidden, shown, ID + 0.45)
          .fromTo(q('[data-w="edition"]'), hidden, shown, ID + 0.9)
          .fromTo(q('.hero__rule'), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.6 }, ID + 1.25)
          .fromTo(q('.hero__org'), { opacity: 0, y: 12, letterSpacing: '1.1em' },
            { opacity: 1, y: 0, letterSpacing: '0.55em', duration: 0.7, ease: 'power2.out' }, ID + 1.35)
          .fromTo(q('.hero__tagline'), { opacity: 0, y: 10, letterSpacing: '0.5em' },
            { opacity: 1, y: 0, letterSpacing: '0.22em', duration: 0.7, ease: 'power2.out' }, ID + 1.7);

        // 4 — hold the title frame (ID + 2.4 → 7.4), then push in on the ship as dusk falls,
        //     and dissolve into the live sea (Ocean.tsx), whose first frame matches this one.
        const OUT = 7.4;
        const ocean = document.querySelector('.ocean');
        tl.to(q('.hero__camera'), { scale: 1.45, yPercent: -4.5, duration: TOTAL - OUT, ease: 'power1.in' }, OUT)
          .to(q('.hero__brand'), { opacity: 0, yPercent: -40, duration: 1.1, ease: 'power1.in' }, OUT)
          .fromTo(q('.hero__tint'), { opacity: 0 }, { opacity: 0.5, duration: TOTAL - OUT, ease: 'power1.in' }, OUT);
        if (ocean) tl.fromTo(ocean, { opacity: 0 }, { opacity: 1, duration: 1.3, ease: 'power1.inOut' }, TOTAL - 1.3);
      });
    } catch (err) {
      console.error('Hero animation disabled:', err); // the static title frame stays usable
    }

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    return () => {
      window.removeEventListener('load', refresh);
      mm.revert();
    };
  }, []);

  return (
    <section id="home" className="hero" ref={root} aria-label={`${event.name} ${event.edition}`}>
      <div className="hero__stage">
        <div className="hero__camera">
          <div className="layer">
            <PosterArt onLoad={() => ScrollTrigger.refresh()} />
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
          <h1 className="hero__title">
            <span className="sr-only">{event.name} {event.edition}</span>
            <span aria-hidden="true" className="hero__words">
              <span data-w="code">CODE</span>
              <span data-w="odyssey">ODYSSEY</span>
              <span data-w="edition" className="hero__edition">{event.edition}</span>
            </span>
          </h1>
          <span className="hero__rule" aria-hidden="true" />
          <p className="hero__org">{event.organizer.name}</p>
          <p className="hero__tagline">{event.tagline}</p>
        </div>
      </div>

      <div className="hero__tint" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__vignette" aria-hidden="true" />
      <div className="hero__deep" aria-hidden="true" />
      <a href="#about" className="hero__cue"><span>Scroll</span><i aria-hidden="true" /></a>
    </section>
  );
}
