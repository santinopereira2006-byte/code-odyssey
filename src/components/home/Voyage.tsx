import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event } from '../../event.config';

gsap.registerPlugin(ScrollTrigger);

/** The road to the hackathon: a line of light draws itself and each port lights up as it is reached. */
export default function Voyage() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      gsap.fromTo(q('.voyage__beam'), { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: q('.voyage__list')[0], start: 'top 70%', end: 'bottom 60%', scrub: 0.8 },
      });
      q('.port').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 62%', toggleClass: { targets: el, className: 'is-lit' } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="voyage" className="section voyage" ref={root}>
      <div className="section__head" data-reveal>
        <p className="eyebrow">Chapter III — The Voyage Ahead</p>
        <h2 className="display" data-track>Charting the Course</h2>
      </div>
      <ol className="voyage__list">
        <span className="voyage__rail" aria-hidden="true"><span className="voyage__beam" /></span>
        {event.schedule.map((s) => (
          <li key={s.title} className="port" data-reveal>
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
