import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event, MAP_SIZE } from '../event.config';

gsap.registerPlugin(ScrollTrigger);

const { width: W, height: H } = MAP_SIZE;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const statusLabel = { upcoming: 'Upcoming', live: 'Underway', completed: 'Completed' } as const;

/** Smooth Catmull-Rom curve through the milestone points, as an SVG path. */
function routePath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
}

export default function Timeline() {
  const ms = event.milestones;
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const d = routePath(ms);
  const current = ms[active];

  // One-time route reveal when the map scrolls into view.
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.route__reveal', { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut',
        scrollTrigger: { trigger: '.voyage__map', start: 'top 70%', once: true },
      });
      gsap.from('.marker', {
        scale: 0, opacity: 0, duration: 0.5, stagger: 0.22, delay: 0.2, ease: 'back.out(2)',
        scrollTrigger: { trigger: '.voyage__map', start: 'top 70%', once: true },
      });
    });
    return () => mm.revert();
  }, []);

  if (!current) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (active + step + ms.length) % ms.length;
    setActive(next);
    root.current?.querySelectorAll<HTMLButtonElement>('.stage-list button')[next]?.focus();
  };

  return (
    <section id="timeline" className="section voyage" ref={root}>
      <header className="section__head" data-reveal>
        <p className="eyebrow">Chapter III — The Timeline</p>
        <h2>The Voyage Ahead</h2>
        <p className="lede">Every milestone brings us closer to the final destination.</p>
      </header>

      <div className="voyage__scroller" tabIndex={0} aria-label="Voyage map — scroll sideways on small screens">
        <div className="voyage__map">
          <img src="assets/odyssey-map.webp" alt="Illustrated map of Odysseus' ten-year voyage across the Mediterranean" width={W} height={H} loading="lazy" />
          <svg className="voyage__route" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <mask id="route-mask">
                <path className="route__reveal" d={d} pathLength={1} strokeDasharray="1" />
              </mask>
            </defs>
            <path className="route__line" d={d} mask="url(#route-mask)" />
          </svg>
          {ms.map((m, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              className={`marker ${i === active ? 'is-active' : ''} ${i < active ? 'is-past' : ''} ${i === hover ? 'is-hover' : ''}`}
              style={{ left: `${(m.x / W) * 100}%`, top: `${(m.y / H) * 100}%` }}
              onClick={() => setActive(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              title={`${m.title} — ${m.subtitle}`}
              aria-label={`Stage ${i + 1}: ${m.title}`}
            >
              <span>{ROMAN[i] ?? i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="voyage__panel">
        <ol className="stage-list" aria-label="Milestones" onKeyDown={onKeyDown}>
          {ms.map((m, i) => (
            <li key={i}>
              <button
                type="button"
                aria-current={i === active ? 'step' : undefined}
                aria-controls="stage-detail"
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <span className="stage-list__num">{ROMAN[i] ?? i + 1}</span>
                <span className="stage-list__title">{m.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <article id="stage-detail" className="stage-detail" aria-live="polite" key={active}>
          <p className="eyebrow">
            Stage {String(active + 1).padStart(2, '0')} / {String(ms.length).padStart(2, '0')} · {current.place}
          </p>
          <h3>{current.title}</h3>
          <p className="stage-detail__subtitle">{current.subtitle}</p>
          <p className="stage-detail__body">{current.description}</p>
          <dl className="stage-detail__meta">
            <div>
              <dt>Date</dt>
              <dd>{current.date ?? 'To be announced'}</dd>
            </div>
            {current.status && (
              <div>
                <dt>Status</dt>
                <dd className={`status status--${current.status}`}>{statusLabel[current.status]}</dd>
              </div>
            )}
          </dl>
          <div className="stage-detail__nav">
            <button type="button" onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}>← Previous</button>
            <button type="button" onClick={() => setActive(Math.min(ms.length - 1, active + 1))} disabled={active === ms.length - 1}>Next →</button>
          </div>
        </article>
      </div>
    </section>
  );
}
