import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * A steel ring that trails the pointer, swells over anything interactive and names
 * the action (data-cursor). Buttons lean magnetically toward it. Fine pointers only.
 */
export default function Cursor({ enabled }: { enabled: boolean }) {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    html.classList.add('has-cursor');
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3.out' });
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3.out' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3.out' });
    let magnet: HTMLElement | null = null;

    const release = () => {
      if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      magnet = null;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      ring.current!.classList.add('is-visible');
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
      const t = e.target as HTMLElement;
      const hit = t.closest<HTMLElement>('a, button, [data-cursor]');
      ring.current!.classList.toggle('is-link', !!hit);
      label.current!.textContent = hit?.dataset.cursor ?? '';
      ring.current!.classList.toggle('has-label', !!hit?.dataset.cursor);

      const m = t.closest<HTMLElement>('.btn, [data-magnetic]');
      if (m !== magnet) release();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        gsap.to(m, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.28,
          y: (e.clientY - (r.top + r.height / 2)) * 0.38,
          duration: 0.5, ease: 'power3.out',
        });
      }
    };
    const onDown = () => ring.current!.classList.add('is-down');
    const onUp = () => ring.current!.classList.remove('is-down');
    const onLeave = () => { ring.current!.classList.remove('is-visible'); release(); };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    html.addEventListener('pointerleave', onLeave);
    return () => {
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      html.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ring}><span ref={label} className="cursor__label" /></div>
      <div className="cursor__dot" ref={dot} />
    </div>
  );
}
