import type { PointerEvent } from 'react';
import { event } from '../../event.config';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** Gentle 3D tilt toward the pointer, with a glare that follows it. */
function tilt(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty('--rx', `${-y * 8}deg`);
  el.style.setProperty('--ry', `${x * 10}deg`);
  el.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
  el.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
}
function untilt(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg');
  e.currentTarget.style.setProperty('--ry', '0deg');
}

export default function Rules() {
  return (
    <section id="rules" className="section rules">
      <div className="section__head" data-reveal>
        <p className="eyebrow">Chapter II — The Code of the Voyage</p>
        <h2 className="display" data-track>Rules of the Sea</h2>
      </div>
      <ol className="rules__grid">
        {event.rules.map((r, i) => (
          <li key={r.title} className="rule" data-reveal>
            <div className="rule__card" onPointerMove={tilt} onPointerLeave={untilt}>
              <span className="rule__num" aria-hidden="true">{NUMERALS[i]}</span>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
