import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createOcean } from '../ocean/renderer';

gsap.registerPlugin(ScrollTrigger);

/**
 * The live sea behind the About section.
 *
 * Motion: a fixed, full-viewport canvas. The hero's outro fades it in over the poster
 * (see Hero.tsx), then scroll drives the camera — `prog` across the voyage spacer down
 * to the intro, `deep` from the intro to the end of the section. It only renders while
 * it can be seen. Reduced motion: one still underwater frame, sticky behind the text.
 * Without WebGL the wrapper's CSS gradient stands in.
 */
export default function Ocean() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    // Found from our own node: a parent's ref is not attached yet when this child effect runs.
    const section = wrap.current?.closest<HTMLElement>('.desc');
    const intro = section?.querySelector<HTMLElement>('.desc__intro');
    const ocean = canvas.current && section && intro && createOcean(canvas.current);
    if (!ocean) {
      wrap.current?.classList.add('ocean--fallback');
      return;
    }

    const mm = gsap.matchMedia();
    mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      if (!ctx.conditions?.motion) {
        ocean.setActive(false);
        ocean.renderStill(1, 0.6, 14);
        return;
      }
      let first = true;
      let depth: ScrollTrigger | undefined;
      const progress = ScrollTrigger.create({
        trigger: section, start: 'top bottom',
        endTrigger: intro, end: 'top 62%',
        onRefresh: (s) => { ocean.setTargets(s.progress, depth?.progress ?? 0, first); first = false; },
        onUpdate: (s) => ocean.setTargets(s.progress, depth?.progress ?? 0),
      });
      depth = ScrollTrigger.create({
        trigger: intro, start: 'top 62%',
        endTrigger: section, end: 'bottom bottom',
        onUpdate: (s) => ocean.setTargets(progress.progress, s.progress),
      });
      // Awake from the moment the hero starts fading the sea in until the section has left.
      ScrollTrigger.create({
        trigger: section,
        start: () => {
          const hero = ScrollTrigger.getById('hero');
          return hero ? hero.end - window.innerHeight * 0.7 : 'top bottom';
        },
        end: 'bottom top',
        onToggle: (s) => ocean.setActive(s.isActive),
        onRefresh: (s) => ocean.setActive(s.isActive),
      });
      return () => ocean.setActive(false);
    });

    return () => {
      mm.revert();
      ocean.destroy();
    };
  }, []);

  return (
    <div className="ocean" ref={wrap} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}
