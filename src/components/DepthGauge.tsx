import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { depthMetres } from '../scene/rig';

/** A slim instrument on the right edge: live depth, voyage progress and the current chapter. */
export default function DepthGauge({ visible, chapter }: { visible: boolean; chapter: string }) {
  const value = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let last = -1;
    const tick = () => {
      const m = depthMetres();
      if (m !== last && value.current) {
        value.current.textContent = String(m).padStart(3, '0');
        last = m;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <aside className={`gauge ${visible ? '' : 'is-hidden'}`} aria-hidden="true">
      <span className="gauge__label">Depth</span>
      <span className="gauge__value"><span ref={value}>000</span><small>m</small></span>
      <span className="gauge__track"><span className="gauge__fill" /></span>
      <span className="gauge__chapter" key={chapter}>{chapter}</span>
    </aside>
  );
}
