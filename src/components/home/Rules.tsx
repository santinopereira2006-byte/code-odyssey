import type { PointerEvent } from 'react';
import { event } from '../../event.config';
import Hud from './Hud';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** Gentle 3D tilt toward the pointer, with a glare that follows it. */
function tilt(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty('--rx', `${-y * 10}deg`);
  el.style.setProperty('--ry', `${x * 12}deg`);
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
      <span className="ghost" data-speed="0.75" aria-hidden="true">II</span>
      <div className="section__head">
        <Hud index="Chapter II" name="The Code of the Voyage" />
        <h2 className="display" data-split>Rules of the Sea</h2>
      </div>
      <ol className="rules__grid">
        {event.rules.map((r, i) => (
          <li key={r.title} className="rule">
            <div className="rule__card" onPointerMove={tilt} onPointerLeave={untilt}>
              <span className="rule__glare" aria-hidden="true" />
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
