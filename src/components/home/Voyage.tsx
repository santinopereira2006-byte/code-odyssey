import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event } from '../../event.config';
import Hud from './Hud';

gsap.registerPlugin(ScrollTrigger);

/** The road to the hackathon: a line of light draws itself and each port lights up as it is reached. */
export default function Voyage() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      // The beam of light and the ship that rides it are scrubbed by the scroll.
      const st = { trigger: q('.voyage__list')[0], start: 'top 70%', end: 'bottom 60%', scrub: 0.8 };
      gsap.fromTo(q('.voyage__beam'), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: st });
      gsap.fromTo(q('.voyage__ship'), { top: '0%' }, { top: '100%', ease: 'none', scrollTrigger: { ...st } });
      q('.port').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 62%', toggleClass: { targets: el, className: 'is-lit' } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="voyage" className="section voyage" ref={root}>
      <span className="ghost" data-speed="0.75" aria-hidden="true">III</span>
      <div className="section__head">
        <Hud index="Chapter III" name="The Voyage Ahead" />
        <h2 className="display" data-split>Charting the Course</h2>
      </div>
      <ol className="voyage__list">
        <span className="voyage__rail" aria-hidden="true"><span className="voyage__beam" /><span className="voyage__ship" /></span>
        {event.schedule.map((s, i) => (
          <li key={s.title} className="port" data-reveal>
            <span className="port__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <span className="port__node" aria-hidden="true" />
            <p className="port__when"><b>{s.date}</b> {s.day}</p>
            <h3>{s.title}</h3>
            <p className="muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
